import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { login } from '../redux/slices/authSlice';

function AuthProvider() {
  const dispatch = useDispatch();

  useEffect(() => {
    const storedIsLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const storedUser = localStorage.getItem('user');

    if (storedIsLoggedIn && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        dispatch(login(parsedUser));
      } catch (error) {
        console.warn('Không thể khôi phục người dùng từ localStorage:', error);
      }
    }
  }, [dispatch]);

  return null;
}

export default AuthProvider;
