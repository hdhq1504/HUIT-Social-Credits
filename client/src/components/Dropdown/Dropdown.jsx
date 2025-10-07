import React, { useEffect, useId, useMemo, useState } from 'react';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import styles from './Dropdown.module.scss';

const cx = classNames.bind(styles);

function normaliseOption(option) {
  if (typeof option === 'string') {
    return { label: option, value: option };
  }

  if (option && typeof option === 'object') {
    const { label, value, disabled } = option;
    return {
      label: label ?? String(value ?? ''),
      value: value ?? label ?? '',
      disabled: Boolean(disabled),
    };
  }

  return { label: String(option ?? ''), value: option };
}

function Dropdown({ options = [], label, withIcon = false, onSelect }) {
  const items = useMemo(() => options.map(normaliseOption), [options]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('Select an option');

  const listboxId = useId().replace(/[:]/g, '');

  useEffect(() => {
    setSelectedLabel((current) => {
      if (label && current !== label) {
        return label;
      }

      const hasCurrent = items.some((option) => option.label === current);
      if (!hasCurrent) {
        return label ?? items[0]?.label ?? 'Select an option';
      }

      return current;
    });
  }, [items, label]);

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  const closeDropdown = () => setIsOpen(false);

  const handleSelect = (option) => {
    if (option.disabled) return;
    setSelectedLabel(option.label);
    onSelect?.(option.value, option);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      closeDropdown();
    }
  };

  const isMenuOpen = isOpen && items.length > 0;

  return (
    <div className={cx('dropdown')} onKeyDown={handleKeyDown}>
      <button
        type="button"
        className={cx('dropdown__toggle', { 'dropdown__toggle--open': isMenuOpen })}
        onClick={toggleDropdown}
        aria-haspopup="listbox"
        aria-expanded={isMenuOpen}
        aria-controls={`dropdown-${listboxId}`}
      >
        <span className={cx('dropdown__toggle-content')}>
          {withIcon && (
            <span className={cx('dropdown__icon')} aria-hidden="true">
              <FontAwesomeIcon icon={faFilter} />
            </span>
          )}
          <span className={cx('dropdown__label')}>{selectedLabel}</span>
        </span>
        <span className={cx('dropdown__arrow')} aria-hidden="true">
          <FontAwesomeIcon icon={faChevronDown} />
        </span>
      </button>

      <ul
        id={`dropdown-${listboxId}`}
        className={cx('dropdown__menu', { 'dropdown__menu--open': isMenuOpen })}
        role="listbox"
      >
        {items.map((option) => (
          <li key={String(option.value)} className={cx('dropdown__item')}>
            <button
              type="button"
              className={cx('dropdown__option')}
              role="option"
              aria-selected={selectedLabel === option.label}
              onClick={() => handleSelect(option)}
              disabled={option.disabled}
            >
              {option.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Dropdown;
