import React, { useId } from 'react';
import classNames from 'classnames/bind';
import styles from './InputField.module.scss';

const cx = classNames.bind(styles);

function InputField({ id, name, label, required, hint, icon, className, inputClassName, ...restProps }) {
  const { required: restRequired, ...inputProps } = restProps;
  const isRequired = restRequired ?? required ?? false;

  const generatedId = useId().replace(/[:]/g, '');
  const fieldId = id ?? (name ? `${name}-${generatedId}` : `input-${generatedId}`);

  return (
    <div className={cx('input-field', className)}>
      {label && (
        <label className={cx('input-field__label')} htmlFor={fieldId}>
          <span>{label}</span>
          {isRequired && (
            <span className={cx('input-field__required')} aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <div className={cx('input-field__control')}>
        <input
          id={fieldId}
          name={name}
          className={cx(
            'input-field__input',
            {
              'input-field__input--has-icon': Boolean(icon),
            },
            inputClassName,
          )}
          required={isRequired}
          aria-required={isRequired || undefined}
          {...inputProps}
        />
        {icon && <span className={cx('input-field__icon')}>{icon}</span>}
      </div>

      {hint && <p className={cx('input-field__hint')}>{hint}</p>}
    </div>
  );
}

export default InputField;
