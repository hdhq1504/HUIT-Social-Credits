import React, { useState } from 'react';
import classNames from 'classnames/bind';
import styles from './Dropdown.module.scss';
import { FaFilter } from 'react-icons/fa';

const cx = classNames.bind(styles);

function Dropdown({ options, label, withIcon }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(label || 'Select an option');

  const toggleDropdown = () => setIsOpen(!isOpen);
  const handleSelect = (option) => {
    setSelected(option);
    setIsOpen(false);
  };

  return (
    <div className={cx('dropdown')}>
      <div className={cx('dropdown__toggle')} onClick={toggleDropdown}>
        {withIcon && <FaFilter className={cx('dropdown__icon')} />}
        {selected}
        <img className={cx('dropdown__arrow')} src="/images/Dropdown.svg" alt="" />
      </div>

      {isOpen && (
        <ul className={cx('dropdown__menu')}>
          {options.map((option, index) => (
            <li key={index} className={cx('dropdown__item')} onClick={() => handleSelect(option)}>
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Dropdown;
