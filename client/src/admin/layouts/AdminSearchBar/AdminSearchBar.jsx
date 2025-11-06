import React, { useMemo, useState, useCallback } from 'react';
import { Input, Button, Select } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames/bind';
import styles from './AdminSearchBar.module.scss';

const cx = classNames.bind(styles);

function AdminSearchBar({
  onSubmit,
  defaultValues,
  termOptions = [
    { value: 'hk1', label: 'Học kỳ 1' },
    { value: 'hk2', label: 'Học kỳ 2' },
    { value: 'hk3', label: 'Học kỳ Hè' },
  ],
  yearOptions = [
    { value: '2024-2025', label: '2024–2025' },
    { value: '2025-2026', label: '2025–2026' },
  ],
  facultyOptions = [{ value: 'all', label: 'Tất cả khoa' }],
}) {
  const [query, setQuery] = useState(defaultValues?.query ?? '');
  const [term, setTerm] = useState(defaultValues?.term ?? undefined);
  const [year, setYear] = useState(defaultValues?.year ?? undefined);
  const [faculty, setFaculty] = useState(defaultValues?.faculty ?? 'all');

  const payload = useMemo(() => ({ query: query.trim(), term, year, faculty }), [query, term, year, faculty]);

  const handleSubmit = useCallback(() => {
    onSubmit?.(payload);
  }, [onSubmit, payload]);

  return (
    <div className={cx('admin-search')}>
      <div className={cx('admin-search__compact')}>
        <Input
          size="large"
          allowClear
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onPressEnter={handleSubmit}
          placeholder="Tìm kiếm hoạt động..."
          className={cx('admin-search__input')}
          aria-label="Ô tìm kiếm hoạt động"
        />
      </div>

      <div className={cx('admin-search__filters')}>
        <Select
          size="large"
          placeholder="Chọn học kỳ"
          value={term}
          onChange={setTerm}
          options={termOptions}
          className={cx('admin-search__select')}
          aria-label="Lọc theo học kỳ"
          allowClear
        />
        <Select
          size="large"
          placeholder="Chọn năm học"
          value={year}
          onChange={setYear}
          options={yearOptions}
          className={cx('admin-search__select')}
          aria-label="Lọc theo năm học"
          allowClear
        />
        <Select
          size="large"
          value={faculty}
          onChange={setFaculty}
          options={facultyOptions}
          className={cx('admin-search__select')}
          aria-label="Lọc theo khoa"
        />

        <Button
          size="large"
          icon={<FontAwesomeIcon icon={faSearch} />}
          className={cx('admin-search__button')}
          onClick={handleSubmit}
        >
          Lọc
        </Button>
      </div>
    </div>
  );
}

export default AdminSearchBar;
