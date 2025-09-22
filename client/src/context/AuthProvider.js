import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login, logout } from '../redux/slices/authSlice'; // Sửa authSlide thành authSlice
import { auth, db } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthProvider = () => {
    const dispatch = useDispatch();
    const { isLoggedIn } = useSelector((state) => state.auth);

    useEffect(() => {
        // Kiểm tra trạng thái từ localStorage khi khởi động
        const storedIsLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const storedUser = JSON.parse(localStorage.getItem('user'));

        if (storedIsLoggedIn && storedUser && !isLoggedIn) {
            // Khôi phục trạng thái đăng nhập từ localStorage
            dispatch(login(storedUser));
        }

        // Lắng nghe trạng thái Firebase Authentication (dành cho Google/Facebook)
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    // Lấy thông tin bổ sung từ Firestore
                    const userDocRef = doc(db, 'users', user.uid);
                    const userDoc = await getDoc(userDocRef);

                    let userData = { email: user.email, uid: user.uid };
                    if (userDoc.exists()) {
                        const additionalData = userDoc.data();
                        userData = {
                            ...userData,
                            AnhDaiDien: additionalData.AnhDaiDien || '',
                            GioiTinh: additionalData.GioiTinh || '',
                            MaNguoiDung: additionalData.MaNguoiDung || '',
                            NgaySinh: additionalData.NgaySinh || '',
                            Sdt: additionalData.Sdt || '',
                            TenNguoiDung: additionalData.TenNguoiDung || '',
                            VaiTro: additionalData.VaiTro || '',
                            token: await user.getIdToken(),
                        };
                    } else {
                        console.warn('Không tìm thấy thông tin người dùng trong Firestore');
                    }

                    // Dispatch action login với thông tin đầy đủ
                    dispatch(login(userData));
                    localStorage.setItem('accessToken', userData.token);
                } catch (error) {
                    console.error('Lỗi khi lấy thông tin người dùng từ Firestore:', error);
                    dispatch(login({ email: user.email, uid: user.uid }));
                }
            } else {
                // Chỉ đăng xuất nếu không có trạng thái đăng nhập trong localStorage
                const storedIsLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
                if (!storedIsLoggedIn) {
                    dispatch(logout());
                }
            }
        });

        // Hủy lắng nghe khi component unmount
        return () => unsubscribe();
    }, [dispatch, isLoggedIn]);

    return null;
};

export default AuthProvider;
