import { createSlice } from '@reduxjs/toolkit';

// Khôi phục trạng thái từ localStorage khi khởi động
const initialState = {
    isLoggedIn: localStorage.getItem('isLoggedIn') === 'true' || false,
    user: JSON.parse(localStorage.getItem('user')) || null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        login: (state, action) => {
            state.isLoggedIn = true;
            state.user = action.payload;
            // Lưu vào localStorage
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('user', JSON.stringify(action.payload));
        },
        logout: (state) => {
            state.isLoggedIn = false;
            state.user = null;
            // Xóa khỏi localStorage
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('user');
            localStorage.removeItem('accessToken');
        },
    },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
