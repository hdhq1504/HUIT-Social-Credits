import React from 'react';
import AdminNavbar from './AdminNavbar';
import { useAdmin } from './adminContext';

const AdminBodyContent = ({ children }) => {
  const { pageName } = useAdmin();

  return (
    <div
      className="absolute bg-gray-50 rounded-lg shadow-sm"
      style={{
        width: '1040px',
        height: '760px',
        top: '72px',
        left: '240px',
        padding: '20px',
        gap: '20px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Thanh navbar admin (breadcrumb + nút Add New) */}
      <AdminNavbar pageName={pageName} />

      {/* Nội dung trang con */}
      <div className="flex-1 overflow-y-auto bg-white rounded-lg shadow p-4">{children}</div>
    </div>
  );
};

export default AdminBodyContent;
