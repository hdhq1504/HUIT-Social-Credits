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
