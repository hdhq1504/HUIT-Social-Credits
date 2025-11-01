import React from 'react';
import styles from './styles/AdminPage.module.scss';

export default function CouncilPage() {
  return (
    <div className={styles.pageContainer}>
      <h1>Hội đồng xét điểm</h1>
      <p>Hội đồng xét điểm có thể duyệt, chỉnh sửa và xác nhận điểm công tác xã hội cho từng sinh viên.</p>
    </div>
  );
}
