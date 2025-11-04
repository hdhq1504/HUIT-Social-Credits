import React, { useState } from 'react';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { Input, Button, Select } from 'antd';
import styles from './SearchBar.module.scss';

const cx = classNames.bind(styles);

const { Option } = Select;

function SearchBar({ variant = 'home', onSubmit, onFilterChange }) {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('all');
  const [status, setStatus] = useState('all');

  const handleRunSearch = () => {
    onSubmit?.(query.trim());
  };

  const handleEnter = (e) => {
    if (e.key === 'Enter') handleRunSearch();
  };

  return (
    <div className={cx('searchBarContainer')}>
      {variant === 'home' ? (
        <div className={cx('homeSearch')}>
          <Input
            placeholder="Nhập từ khóa (ví dụ: Hiến máu, Mùa hè xanh...)"
            size="large"
            className={cx('searchInput')}
            allowClear
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleEnter}
            aria-label="Tìm kiếm hoạt động"
          />
          <Button type="primary" size="large" className={cx('searchButton')} onClick={handleRunSearch}>
            <FontAwesomeIcon icon={faSearch} />
            <span className={cx('searchButtonText')}>Tìm kiếm</span>
          </Button>
        </div>
      ) : (
        <div className={cx('listSearch')}>
          <Input
            placeholder="Nhập từ khóa"
            size="large"
            className={cx('searchInput')}
            allowClear
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleEnter}
            aria-label="Tìm kiếm hoạt động"
          />

          <Select
            value={group}
            size="large"
            className={cx('dropdown')}
            onChange={(val) => {
              setGroup(val);
              onFilterChange?.({ group: val, status });
            }}
            aria-label="Lọc theo nhóm"
          >
            <Option value="all">Tất cả nhóm</Option>
            <Option value="mua-he-xanh">Mùa hè xanh</Option>
            <Option value="hien-mau">Hiến máu</Option>
            <Option value="dia-chi-do">Địa chỉ đỏ</Option>
            <Option value="ho-tro">Hỗ trợ</Option>
            <Option value="xuan-tinh-nguyen">Xuân tình nguyện</Option>
          </Select>

          <Select
            value={status}
            size="large"
            className={cx('dropdown')}
            onChange={(val) => {
              setStatus(val);
              onFilterChange?.({ group, status: val });
            }}
            aria-label="Lọc theo trạng thái"
          >
            <Option value="all">Tất cả trạng thái</Option>
            <Option value="upcoming">Sắp diễn ra</Option>
            <Option value="ongoing">Đang diễn ra</Option>
            <Option value="ended">Đã kết thúc</Option>
          </Select>

          <Button type="primary" size="large" className={cx('filterButton')} onClick={handleRunSearch}>
            <FontAwesomeIcon icon={faSearch} />
            Lọc
          </Button>
        </div>
      )}
    </div>
  );
}

export default SearchBar;
