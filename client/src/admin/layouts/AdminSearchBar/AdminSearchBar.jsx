import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Input, Button, Select } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames/bind';
import styles from './AdminSearchBar.module.scss';

const cx = classNames.bind(styles);

function AdminSearchBar({
  onSubmit,
  defaultValues = {},
  filters = [],
  actions = [],
  searchPlaceholder = 'Tìm kiếm...',
  searchButtonLabel = 'Lọc',
  showSearchInput = true,
  className,
}) {
  const buildInitialValues = useCallback(() => {
    const base = { query: defaultValues?.query ?? '' };
    filters.forEach((filter) => {
      base[filter.key] = defaultValues?.[filter.key] ?? filter.defaultValue ?? undefined;
    });
    return base;
  }, [defaultValues, filters]);

  const [values, setValues] = useState(() => buildInitialValues());

  useEffect(() => {
    setValues(buildInitialValues());
  }, [buildInitialValues]);

  const payload = useMemo(() => {
    const normalized = { ...values };
    normalized.query = normalized.query?.trim?.() ?? '';
    return normalized;
  }, [values]);

  const handleChange = useCallback((key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = useCallback(() => {
    onSubmit?.(payload);
  }, [onSubmit, payload]);

  const renderFilter = (filter) => {
    if (!filter?.key) return null;
    if (typeof filter.render === 'function') {
      return (
        <div key={filter.key} className={cx('admin-search__filter')}>
          {filter.render({ value: values[filter.key], onChange: (value) => handleChange(filter.key, value) })}
        </div>
      );
    }
    if (filter.type === 'select') {
      return (
        <Select
          key={filter.key}
          size="large"
          placeholder={filter.placeholder}
          value={values[filter.key]}
          onChange={(value) => handleChange(filter.key, value)}
          options={filter.options}
          allowClear={filter.allowClear ?? true}
          className={cx('admin-search__select')}
          style={{ minWidth: filter.minWidth || 160 }}
        />
      );
    }
    if (filter.type === 'input') {
      return (
        <Input
          key={filter.key}
          size="large"
          allowClear
          placeholder={filter.placeholder}
          value={values[filter.key] ?? ''}
          onChange={(event) => handleChange(filter.key, event.target.value)}
          className={cx('admin-search__select')}
        />
      );
    }
    return null;
  };

  return (
    <div className={cx('admin-search', className)}>
      {showSearchInput && (
        <Input
          size="large"
          allowClear
          value={values.query || ''}
          onChange={(event) => handleChange('query', event.target.value)}
          onPressEnter={handleSubmit}
          placeholder={searchPlaceholder}
          className={cx('admin-search__input')}
          prefix={<FontAwesomeIcon icon={faSearch} />}
        />
      )}
      <div className={cx('admin-search__controls')}>
        <div className={cx('admin-search__filters')}>{filters.map((filter) => renderFilter(filter))}</div>
        <div className={cx('admin-search__actions')}>
          <Button
            size="large"
            icon={<FontAwesomeIcon icon={faSearch} />}
            className={cx('admin-search__button', 'admin-search__button--primary')}
            onClick={handleSubmit}
          >
            {searchButtonLabel}
          </Button>
          {actions.map((action) => (
            <Button
              key={action.key}
              size="large"
              type={action.type || 'default'}
              icon={action.icon}
              className={cx('admin-search__button', {
                'admin-search__button--ghost': action.variant === 'ghost',
                'admin-search__button--danger': action.variant === 'danger',
              })}
              onClick={() => action.onClick?.(payload)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminSearchBar;
