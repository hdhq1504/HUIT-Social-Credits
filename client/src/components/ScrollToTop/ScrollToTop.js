import React, { useState, useEffect } from 'react';
import styles from './ScrollToTop.module.scss'; // Bạn sẽ cần tạo file CSS module này

const ScrollToTop = () => {
    const [isVisible, setIsVisible] = useState(false);

    // Kiểm tra vị trí scroll để hiển thị/ẩn nút
    useEffect(() => {
        const toggleVisibility = () => {
            // Hiển thị nút khi scroll xuống 300px
            if (window.pageYOffset > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        // Thêm event listener
        window.addEventListener('scroll', toggleVisibility);

        // Cleanup event listener khi component unmount
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    // Hàm xử lý khi nhấn nút để scroll lên đầu trang
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth', // Tạo hiệu ứng cuộn mượt
        });
    };

    return (
        <>
            {isVisible && (
                <button onClick={scrollToTop} className={styles.scrollToTop} aria-label="Scroll to top">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M12 19V5M5 12l7-7 7 7" />
                    </svg>
                </button>
            )}
        </>
    );
};

export default ScrollToTop;
