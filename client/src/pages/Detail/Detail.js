import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './Detail.module.scss';
import { Button, Box, IconButton, Modal } from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ReplyIcon from '@mui/icons-material/Reply';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import { db } from '../../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

const cx = classNames.bind(styles);

function Detail() {
    const { id } = useParams();
    const [documentData, setDocumentData] = useState(null);
    const [images, setImages] = useState([]);
    const [chatMessages, setChatMessages] = useState([
        {
            user: 'Huỳnh Thị Gấm',
            message: 'Học lập trình là mệt à!',
            timestamp: '20/08/2024 lúc 16:55',
            likes: 1,
            avatar: '/images/no-image.jpg',
        },
        {
            user: 'Vũ Thiên',
            message: 'Cho mình hỏi là có ai ở tài liệu này chưa ạ ?',
            timestamp: '18/08/2024 lúc 12:47',
            likes: 0,
            avatar: '/images/no-image.jpg',
        },
    ]);
    const [newMessage, setNewMessage] = useState('');
    const [openModal, setOpenModal] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch document
                const docRef = doc(db, 'documents', id);
                const docSnap = await getDoc(docRef);

                if (!docSnap.exists()) {
                    setError('Tài liệu không tồn tại');
                    setLoading(false);
                    return;
                }

                const data = docSnap.data();
                setDocumentData({
                    tenTaiLieu: data.tenTaiLieu || 'Không có tiêu đề',
                    moTa: data.moTa || 'Không có mô tả',
                    loai: data.loai || 'PDF',
                    kichThuoc: data.kichThuoc || 'Không xác định',
                    luotTaiVe: data.luotTaiVe || 0,
                    luotThich: data.luotThich || 0,
                    ngayDang: data.ngayDang
                        ? new Date(data.ngayDang.seconds * 1000).toLocaleString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                          })
                        : 'Không xác định',
                    uRL: data.uRL || '#',
                });

                // Set images
                setImages(
                    data.previewImages && Array.isArray(data.previewImages) && data.previewImages.length > 0
                        ? data.previewImages
                        : Array(5).fill('/images/no-image.jpg'),
                );

                setLoading(false);
            } catch (err) {
                setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
                setLoading(false);
                console.error('Error fetching document:', err);
            }
        };

        fetchData();
    }, [id]);

    const handleSendMessage = () => {
        if (newMessage.trim()) {
            const newChat = {
                user: 'Người dùng',
                message: newMessage,
                timestamp: new Date().toLocaleString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                }),
                likes: 0,
                avatar: '/images/no-image.jpg',
            };
            setChatMessages([...chatMessages, newChat]);
            setNewMessage('');
        }
    };

    const handleImageClick = (index) => {
        setCurrentImageIndex(index);
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
    };

    const handlePrevImage = () => {
        setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const handleNextImage = () => {
        setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    if (loading) {
        return <div>Đang tải dữ liệu...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    if (!documentData) {
        return <div>Không tìm thấy tài liệu.</div>;
    }

    return (
        <div className={cx('wrapper')}>
            {/* Breadcrumb */}
            <div className={cx('link')}>
                <Link to="/">Trang chủ</Link> / <Link to="/documents">Chi tiết</Link>
            </div>

            <div>
                <div>
                    <div className={cx('introduce')}>
                        <h4 className={cx('title')}>{documentData.tenTaiLieu}</h4>
                        <p className={cx('file-type')}>{documentData.loai}</p>
                    </div>

                    <div className={cx('description')}>
                        <h4 className={cx('section-title')}>Mô tả</h4>
                        <p className={cx('des')}>{documentData.moTa}</p>
                    </div>

                    {/* Images */}
                    <div className={cx('infomation')}>
                        <p className={cx('section-title')}>Hình ảnh chương về tài liệu</p>
                        <div className={cx('grid')}>
                            <div className={cx('grid-column', 'left-column')}>
                                {images.slice(0, 2).map((image, index) => (
                                    <div key={index} className={cx('grid-item')}>
                                        <img
                                            src={image}
                                            alt={`Preview ${index + 1}`}
                                            className={cx('grid-image')}
                                            onClick={() => handleImageClick(index)}
                                            onError={(e) => {
                                                e.target.src = '/images/no-image.jpg';
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className={cx('grid-column', 'right-column')}>
                                {images.slice(2, 5).map((image, index) => (
                                    <div key={index + 2} className={cx('grid-item')}>
                                        <img
                                            src={image}
                                            alt={`Preview ${index + 3}`}
                                            className={cx('grid-image')}
                                            onClick={() => handleImageClick(index + 2)}
                                            onError={(e) => {
                                                e.target.src = '/images/no-image.jpg';
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Full-Screen Image Slide Modal */}
                    <Modal open={openModal} onClose={handleCloseModal}>
                        <Box className={cx('modal-content')}>
                            <IconButton className={cx('modal-close')} onClick={handleCloseModal}>
                                <CloseIcon style={{ color: 'white' }} />
                            </IconButton>
                            <Box className={cx('modal-carousel')}>
                                <IconButton
                                    onClick={handlePrevImage}
                                    className={cx('carousel-arrow')}
                                    style={{ color: 'white' }}
                                >
                                    <ChevronLeftIcon />
                                </IconButton>
                                <Box className={cx('modal-image-container')}>
                                    <img
                                        src={images[currentImageIndex]}
                                        alt={`Slide ${currentImageIndex + 1}`}
                                        className={cx('modal-image')}
                                        onError={(e) => {
                                            e.target.src = '/images/no-image.jpg';
                                        }}
                                    />
                                </Box>
                                <IconButton
                                    onClick={handleNextImage}
                                    className={cx('carousel-arrow')}
                                    style={{ color: 'white' }}
                                >
                                    <ChevronRightIcon />
                                </IconButton>
                            </Box>
                            <Box className={cx('modal-thumbnails')}>
                                {images.map((image, index) => (
                                    <img
                                        key={index}
                                        src={image}
                                        alt={`Thumbnail ${index + 1}`}
                                        className={cx('modal-thumbnail', { active: index === currentImageIndex })}
                                        onClick={() => setCurrentImageIndex(index)}
                                        onError={(e) => {
                                            e.target.src = '/images/no-image.jpg';
                                        }}
                                    />
                                ))}
                            </Box>
                        </Box>
                    </Modal>

                    <div className={cx('group-btn')}>
                        <button className={cx('report-btn')}>Báo cáo</button>
                        <button className={cx('download-btn')}>
                            <a href={documentData.uRL} target="_blank" rel="noopener noreferrer">
                                Tải xuống
                            </a>
                        </button>
                    </div>

                    {/* Chat */}
                    <div className={cx('chat-section')}>
                        <p className={cx('chat-title')}>Bình luận ({chatMessages.length})</p>

                        <div className={cx('chat-input')}>
                            <img src="/images/no-image.jpg" alt="User Avatar" />
                            <input
                                placeholder="Nhập bình luận của bạn..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                            />
                            <button onClick={handleSendMessage} className={cx('send-btn')}>
                                Gửi
                            </button>
                        </div>

                        <div className={cx('chat-messages')}>
                            {chatMessages.map((msg, index) => (
                                <div key={index} className={cx('chat-message')}>
                                    <img className={cx('avatar')} src={msg.avatar} alt={`${msg.user}'s avatar`} />
                                    <div className={cx('message-content')}>
                                        <p className={cx('message-user')}>{msg.user}</p>
                                        <p className={cx('message-timestamp')}>{msg.timestamp}</p>
                                        <p className={cx('message-text')}>{msg.message}</p>
                                        <p className={cx('message-actions')}>
                                            <Button
                                                size="small"
                                                startIcon={<ThumbUpIcon />}
                                                className={cx('action-btn')}
                                            >
                                                Thích ({msg.likes})
                                            </Button>
                                            <Button size="small" startIcon={<ReplyIcon />} className={cx('action-btn')}>
                                                Trả lời
                                            </Button>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Detail;
