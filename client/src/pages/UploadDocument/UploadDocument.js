import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import styles from './UploadDocument.module.scss';
import classNames from 'classnames/bind';
import InputField from '../../components/InputField/InputField';
import { formatFileSize } from '../../utils/fileUtils';
import { db, storage } from '../../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

const cx = classNames.bind(styles);

const UploadDocument = () => {
    const [step, setStep] = useState('upload');
    const [file, setFile] = useState(null);
    const [formData, setFormData] = useState({
        khoa: '',
        mon: '',
        tenTaiLieu: '',
        moTa: '',
    });
    const [loading, setLoading] = useState(false);
    const [faculties, setFaculties] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [filteredSubjects, setFilteredSubjects] = useState([]);

    const { user } = useSelector((state) => state.auth);

    // Fetch danh sách khoa và môn từ Firestore
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch faculties
                const facultiesSnapshot = await getDocs(collection(db, 'faculties'));
                const facultiesData = facultiesSnapshot.docs.map((doc) => ({
                    MaKhoa: doc.data().MaKhoa,
                    TenKhoa: doc.data().TenKhoa || 'Khoa không xác định',
                }));
                setFaculties(facultiesData);

                // Fetch subjects
                const subjectsSnapshot = await getDocs(collection(db, 'subjects'));
                const subjectsData = subjectsSnapshot.docs.map((doc) => ({
                    MaKhoa: doc.data().MaKhoa,
                    MaMH: doc.data().MaMH,
                    TenMH: doc.data().TenMH || 'Môn không xác định',
                }));
                setSubjects(subjectsData);
            } catch (error) {
                console.error('Lỗi khi lấy dữ liệu từ Firestore:', error);
            }
        };

        fetchData();
    }, []);

    // Lọc danh sách môn khi chọn khoa
    useEffect(() => {
        if (formData.khoa) {
            const filtered = subjects.filter((subject) => subject.MaKhoa === formData.khoa);
            setFilteredSubjects(filtered);
            setFormData((prevData) => ({
                ...prevData,
                mon: '',
            }));
        } else {
            setFilteredSubjects([]);
        }
    }, [formData.khoa, subjects]);

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!file || !formData.khoa || !formData.mon || !formData.tenTaiLieu || !formData.moTa) {
            alert('Vui lòng điền đầy đủ thông tin và chọn tệp để tải lên.');
            return;
        }

        setStep('confirm');
    };

    const handleConfirmUpload = async () => {
        if (!user) {
            alert('Bạn cần đăng nhập để đăng tải tài liệu.');
            return;
        }

        setLoading(true);

        try {
            const fileExtension = file.name.split('.').pop().toLowerCase();
            const storageRef = ref(storage, `documents/${uuidv4()}.${fileExtension}`);
            await uploadBytes(storageRef, file);
            const fileURL = await getDownloadURL(storageRef);

            const documentData = {
                kichThuoc: file.size,
                loai: fileExtension.toUpperCase(),
                luotTaiVe: 0,
                luotThich: 0,
                maMH: formData.mon,
                maTaiLieu: uuidv4(),
                moTa: formData.moTa,
                ngayDang: serverTimestamp(),
                nguoiDang: user.MaNguoiDung || user.email || 'unknown',
                previewImages: null,
                tenTaiLieu: formData.tenTaiLieu,
                trangThai: 'Chờ duyệt',
                uRL: fileURL,
            };

            await addDoc(collection(db, 'documents'), documentData);

            alert('Tài liệu đã được đăng tải thành công!');
            setFile(null);
            setFormData({
                khoa: '',
                mon: '',
                tenTaiLieu: '',
                moTa: '',
            });
            setStep('upload');
        } catch (error) {
            console.error('Lỗi khi đăng tải tài liệu:', error);
            alert('Đã có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setStep('upload');
    };

    const khoaOptions = [
        { value: '', label: 'Chọn khoa' },
        ...faculties.map((faculty) => ({
            value: faculty.MaKhoa,
            label: faculty.TenKhoa,
        })),
    ];

    const monOptions = [
        { value: '', label: 'Chọn môn' },
        ...filteredSubjects.map((subject) => ({
            value: subject.MaMH,
            label: subject.TenMH,
        })),
    ];

    return (
        <div className={cx('wrapper')}>
            <div className={cx('link')}>
                <Link to="/">Trang chủ</Link> / <Link to="#">Tài liệu</Link>
                {step === 'confirm' && ' / Xác nhận đăng tải'}
            </div>

            {step === 'upload' ? (
                <div className={cx('upload')}>
                    <div className={cx('upload-section')}>
                        <h3>Tải lên các tập tin của bạn</h3>
                        <p>Bạn có thể tải lên tối đa 1 tệp mỗi lần</p>

                        <label className={cx('upload-box')}>
                            <img src="/images/upload.svg" alt="Upload" />
                            <p>Kéo tập tin của bạn để bắt đầu tải lên</p>
                            <input type="file" onChange={handleFileChange} hidden />
                            <div className={cx('separator')}>Hoặc</div>
                            <button
                                className={cx('browse-files-btn')}
                                onClick={() => document.querySelector("input[type='file']").click()}
                            >
                                Duyệt tập tin
                            </button>
                        </label>
                    </div>

                    <div className={cx('info-section')}>
                        {file && (
                            <div className={cx('file-preview')}>
                                <div className={cx('file-item')}>
                                    <div className={cx('file-icon')}>
                                        <img src="/images/upload.svg" alt="" />
                                        <div className={cx('file-info')}>
                                            <p className={cx('file-name')}>{file.name}</p>
                                            <span className={cx('file-size')}>{formatFileSize(file.size)}</span>
                                        </div>
                                    </div>
                                    <button className={cx('remove-file')} onClick={handleRemoveFile}>
                                        <img src="/images/remove-file.svg" alt="" />
                                    </button>
                                </div>
                            </div>
                        )}

                        <h3>Thông tin tài liệu</h3>

                        <div className={cx('input-group')}>
                            <label>
                                Khoa <span className={cx('required')}>*</span>
                            </label>
                            <select
                                name="khoa"
                                value={formData.khoa}
                                onChange={handleInputChange}
                                required
                                className={cx('select-field')}
                            >
                                {khoaOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={cx('input-group')}>
                            <label>
                                Môn <span className={cx('required')}>*</span>
                            </label>
                            <select
                                name="mon"
                                value={formData.mon}
                                onChange={handleInputChange}
                                required
                                className={cx('select-field')}
                                disabled={!formData.khoa}
                            >
                                {monOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={cx('input-group')}>
                            <InputField
                                label="Tên tài liệu"
                                placeholder="Giáo trình giảng dạy"
                                name="tenTaiLieu"
                                value={formData.tenTaiLieu}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className={cx('input-group')}>
                            <InputField
                                label="Mô tả"
                                placeholder="Mô tả tài liệu"
                                name="moTa"
                                value={formData.moTa}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <button className={cx('submit-btn')} onClick={handleSubmit} disabled={loading}>
                            {loading ? 'Đang xử lý...' : 'Đăng tải'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className={cx('confirm-section')}>
                    <div className={cx('file-preview')}>
                        <div className={cx('file-item')}>
                            <div className={cx('file-icon')}>
                                <img src="/images/upload.svg" alt="File" />
                                <div className={cx('file-info')}>
                                    <p className={cx('file-name')}>{file.name}</p>
                                    <span className={cx('file-size')}>{formatFileSize(file.size)}</span>
                                </div>
                            </div>
                            <button className={cx('remove-file')} onClick={handleRemoveFile}>
                                <img src="/images/remove-file.svg" alt="" />
                            </button>
                        </div>
                    </div>

                    <div className={cx('info-section')}>
                        <h4>Thông tin tài liệu</h4>
                        <div className={cx('info-item')}>
                            <InputField
                                label="Khoa"
                                value={faculties.find((f) => f.MaKhoa === formData.khoa)?.TenKhoa || formData.khoa}
                                readOnly
                            />
                        </div>
                        <div className={cx('info-item')}>
                            <InputField
                                label="Môn"
                                value={subjects.find((s) => s.MaMH === formData.mon)?.TenMH || formData.mon}
                                readOnly
                            />
                        </div>
                        <div className={cx('info-item')}>
                            <InputField label="Tên tài liệu" value={formData.tenTaiLieu} readOnly />
                        </div>
                        <div className={cx('info-item')}>
                            <InputField label="Mô tả" value={formData.moTa} readOnly />
                        </div>
                    </div>

                    <div className={cx('button-group')}>
                        <button className={cx('confirm-btn')} onClick={handleConfirmUpload} disabled={loading}>
                            {loading ? 'Đang tải lên...' : 'Đăng tải'}
                        </button>
                        <button className={cx('cancel-btn')} onClick={handleCancel} disabled={loading}>
                            Hủy
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UploadDocument;
