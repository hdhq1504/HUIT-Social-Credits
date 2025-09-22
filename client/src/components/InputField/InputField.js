import React from 'react';
import classNames from 'classnames/bind';
import styles from './InputField.module.scss';

const cx = classNames.bind(styles);

function InputField({ label, required, ...props }) {
    return (
        <div className={cx('input-container')}>
            <label className={cx('input-label')}>
                {label} {required && <span className={cx('required')}>*</span>}
            </label>
            <input className={cx('input-field')} {...props} />
        </div>
    );
}

export default InputField;

// Cách sử dụng
/* <div
    style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        padding: '20px',
        border: '1px dashed purple',
    }}
>
    <InputField label="Label" />
    <InputField label="Label" required />
    <InputField label="Label" />
    <InputField label="Label" required />
</div>; */
