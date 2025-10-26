import React, { createContext, useContext, useState } from 'react';

const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  const [pageName, setPageName] = useState('Bảng điều khiển');
  return <AdminContext.Provider value={{ pageName, setPageName }}>{children}</AdminContext.Provider>;
};

// Hook dùng trong mọi component con
// eslint-disable-next-line react-refresh/only-export-components
export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin phải được sử dụng trong AdminProvider');
  }
  return context;
};
