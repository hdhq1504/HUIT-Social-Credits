import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import styles from './Alert.module.scss';

const cx = classNames.bind(styles);

const Alert = ({ message, type = 'info', showIcon = false, onClose }) => {
    return (
        <div className={cx('alert', `alert-${type}`)}>
            <div className={cx('alert-content')}>
                {showIcon && (
                    <span className={cx('alert-icon')}>
                        {type === 'success' && <CheckCircle />}
                        {type === 'danger' && <AlertTriangle />}
                        {type === 'info' && <Info />}
                    </span>
                )}
                <span className={cx('alert-message')}>{message}</span>
            </div>
            <button className={cx('alert-close')} onClick={onClose}>
                <X size={16} />
            </button>
        </div>
    );
};

Alert.propTypes = {
    message: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['success', 'danger', 'info']),
    showIcon: PropTypes.bool,
    onClose: PropTypes.func.isRequired,
};

export default Alert;

// const [showAlert, setShowAlert] = useState(true);
// {showAlert && (
//     <Alert
//         message="Đổi mật khẩu thành công"
//         type="success"
//         showIcon
//         onClose={() => setShowAlert(false)}
//     />
// )}
