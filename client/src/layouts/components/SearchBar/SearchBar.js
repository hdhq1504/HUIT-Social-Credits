import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './SearchBar.module.scss';

const cx = classNames.bind(styles);

function SearchBar() {
    const [keyword, setKeyword] = useState('');
    const [course, setCourse] = useState('');
    const [subject, setSubject] = useState('');
    const [type, setType] = useState('');
    const navigate = useNavigate();

    const handleSearch = () => {
        // Tạo query string
        const queryString = `?keyword=${keyword}&course=${course}&subject=${subject}&type=${type}`;

        // Điều hướng đến trang FilterBook với query string
        navigate(`/filterDepartment${queryString}`);
    };

    return (
        <div className={cx('wrapper')}>
            <div className={cx('search-form')}>
                <input
                    type="text"
                    className={cx('search-input')}
                    placeholder="Nhập từ khóa"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                />

                <div className={cx('select-wrapper')}>
                    <select className={cx('search-select')} value={course} onChange={(e) => setCourse(e.target.value)}>
                        <option value="">Khoa</option>
                        <option value="cntt">Công nghệ thông tin</option>
                        <option value="cntp">Công nghệ thực phẩm</option>
                        <option value="cnhh">Công nghệ hóa học</option>
                        <option value="ck">Cơ khí</option>
                        <option value="qtkd">Quản trị kinh doanh</option>
                    </select>
                </div>

                <div className={cx('select-wrapper')}>
                    <select
                        className={cx('search-select')}
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                    >
                        <option value="">Môn</option>
                        <option value="ltrinhpython">Lập trình Python</option>
                        <option value="ptdlthongke">Phân tích dữ liệu thống kê</option>
                        <option value="ml">Machine Learning</option>
                        <option value="sql">SQL Server</option>
                    </select>
                </div>

                <div className={cx('select-wrapper')}>
                    <select className={cx('search-select')} value={type} onChange={(e) => setType(e.target.value)}>
                        <option value="">Loại</option>
                        <option value="pdf">PDF</option>
                        <option value="doc">DOC</option>
                        <option value="ppt">PPT</option>
                        <option value="video">Video</option>
                    </select>
                </div>

                <button className={cx('search-button')} onClick={handleSearch}>
                    <i className="fas fa-search"></i> Lọc
                </button>
            </div>
        </div>
    );
}

export default SearchBar;
