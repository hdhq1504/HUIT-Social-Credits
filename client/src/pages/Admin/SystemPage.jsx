import React from 'react';
import styles from './styles/AdminPage.module.scss';

export default function SystemPage() {
  return (
    <div className={styles.pageContainer}>
      <h1>Quản lý hệ thống</h1>
      <p>Trang cấu hình người dùng, phân quyền tài khoản và thiết lập hệ thống quản trị.</p>
    </div>
  );
}
