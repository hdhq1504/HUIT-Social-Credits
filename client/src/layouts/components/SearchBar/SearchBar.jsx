import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './SearchBar.module.scss';

const cx = classNames.bind(styles);

function SearchBar() {
  const [keyword, setKeyword] = useState('');
  const navigate = useNavigate();

  const handleSearch = () => {
    // Điều hướng đến trang FilterBook với query string
    navigate(`/`);
  };

  return (
    <div className={cx('wrapper')}>
      <div className={cx('search-form')}>
        <input
          type="text"
          className={cx('search-input')}
          placeholder="Nhập từ khóa"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />

        <button className={cx('search-button')} onClick={handleSearch}>
          <i className="fas fa-search"></i> Tìm kiếm
        </button>
      </div>
    </div>
  );
}

export default SearchBar;
