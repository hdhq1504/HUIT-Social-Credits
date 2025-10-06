import React from 'react';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { Input, Button, Select } from 'antd';
import styles from './SearchBar.module.scss';

const cx = classNames.bind(styles);

const { Search } = Input;
const { Option } = Select;

function SearchBar({ variant = 'home', onSearch, onFilter }) {
  const handleSearch = (value) => {
    if (onSearch) onSearch(value);
    console.log('Search:', value);
  };

  return (
    <div className={cx('searchBarContainer')}>
      {variant === 'home' ? (
        <div className={cx('homeSearch')}>
          <Input placeholder="Nhập tìm kiếm" size="large" onSearch={handleSearch} className={cx('searchInput')} />;
          <Button
            type="primary"
            size="large"
            className={cx('searchButton')}
            onClick={() => console.log('Filter clicked')}
          >
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
            onPressEnter={(e) => handleSearch(e.target.value)}
          />

          <Select
            defaultValue="Tất cả nhóm"
            size="large"
            className={cx('dropdown')}
            onChange={(val) => onFilter?.('group', val)}
          >
            <Option value="all">Tất cả nhóm</Option>
            <Option value="mua-he-xanh">Mùa hè xanh</Option>
            <Option value="hien-mau">Hiến máu</Option>
            <Option value="dia-chi-do">Địa chỉ đỏ</Option>
          </Select>

          <Select
            defaultValue="Tất cả trạng thái"
            size="large"
            className={cx('dropdown')}
            onChange={(val) => onFilter?.('status', val)}
          >
            <Option value="all">Tất cả trạng thái</Option>
            <Option value="upcoming">Sắp diễn ra</Option>
            <Option value="ongoing">Đang diễn ra</Option>
            <Option value="ended">Đã kết thúc</Option>
          </Select>

          <Button
            type="primary"
            size="large"
            className={cx('filterButton')}
            onClick={() => console.log('Filter clicked')}
          >
            <FontAwesomeIcon icon={faSearch} />
            Lọc
          </Button>
        </div>
      )}
    </div>
  );
}

export default SearchBar;
