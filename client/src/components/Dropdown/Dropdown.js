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
            <div className={cx('dropdown-toggle')} onClick={toggleDropdown}>
                {withIcon && <FaFilter className={cx('icon')} />}
                {selected}
                <img className={cx('arrow')} src="/images/Dropdown.svg" alt="" />
            </div>

            {isOpen && (
                <ul className={cx('dropdown-menu')}>
                    {options.map((option, index) => (
                        <li key={index} className={cx('dropdown-item')} onClick={() => handleSelect(option)}>
                            {option}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default Dropdown;

// cách sử dụng
/* <div style={{ padding: '20px' }}>
    <Dropdown options={['Option 1', 'Option 2', 'Option 3']} label="Dropdown" />
    <Dropdown options={['Filter 1', 'Filter 2', 'Filter 3']} label="Dropdown" withIcon />
</div>; */
