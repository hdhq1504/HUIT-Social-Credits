import React from 'react';
import styles from './styles/AdminPage.module.scss';

export default function FeedbackPage() {
  return (
    <div className={styles.pageContainer}>
      <h1>Phản hồi sinh viên</h1>
      <p>Trang này hiển thị danh sách các phản hồi, góp ý hoặc khiếu nại từ sinh viên.</p>
      <p>Quản trị viên có thể xem chi tiết và trả lời phản hồi trực tiếp tại đây.</p>
    </div>
  );
}
