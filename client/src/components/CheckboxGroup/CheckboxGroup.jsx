import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown, faFilter } from '@fortawesome/free-solid-svg-icons';
import { Checkbox } from 'antd';
import styles from './CheckboxGroup.module.scss';

const cx = classNames.bind(styles);

function CheckboxGroup({ options, selectedValues, onChange, title = 'Lọc kết quả nhanh', sectionLabel = 'Loại' }) {
  const allOpt = options.find((o) => String(o.value) === 'Tất cả') || null;
  const childOptions = allOpt ? options.filter((o) => o !== allOpt) : options;
  const selectedChildren = selectedValues.filter((v) => String(v) !== 'Tất cả');
  const allChecked = childOptions.length > 0 && selectedChildren.length === childOptions.length;
  const indeterminate = selectedChildren.length > 0 && selectedChildren.length < childOptions.length;

  const handleAllChange = (checked) => {
    if (checked) {
      const allValues = childOptions.map((o) => o.value);
      onChange(allOpt ? ['Tất cả', ...allValues] : allValues);
    } else {
      onChange([]);
    }
  };

  const handleChildChange = (list) => {
    if (allOpt) {
      if (list.length === childOptions.length) {
        onChange(['Tất cả', ...list]);
      } else {
        onChange(list);
      }
    } else {
      onChange(list);
    }
  };

  return (
    <div className={cx('checkbox-filter')}>
      <div className={cx('checkbox-filter__header')}>
        <div className={cx('checkbox-filter__header-icon')}>
          <FontAwesomeIcon icon={faFilter} />
        </div>
        <div className={cx('checkbox-filter__header-title')}>{title}</div>
      </div>

      <div className={cx('checkbox-filter__section')}>
        <div className={cx('checkbox-filter__section-header')}>
          <div className={cx('checkbox-filter__section-label')}>{sectionLabel}</div>
          <div className={cx('checkbox-filter__section-chevron')}>
            <FontAwesomeIcon icon={faCaretDown} />
          </div>
        </div>

        <div className={cx('checkbox-filter__options')}>
          {allOpt && (
            <label className={cx('checkbox-filter__option', 'checkbox-filter__option--all')}>
              <Checkbox
                className={cx('checkbox-filter__checkbox')}
                indeterminate={indeterminate}
                checked={allChecked}
                onChange={(e) => handleAllChange(e.target.checked)}
              >
                <span className={cx('checkbox-filter__option-text')}>{allOpt.label ?? 'Tất cả'}</span>
              </Checkbox>
            </label>
          )}

          <Checkbox.Group
            className={cx('checkbox-filter__group')}
            value={selectedChildren}
            onChange={handleChildChange}
          >
            {childOptions.map((o) => (
              <label key={String(o.value)} className={cx('checkbox-filter__option')}>
                <Checkbox className={cx('checkbox-filter__checkbox')} value={o.value} disabled={o.disabled}>
                  <span className={cx('checkbox-filter__option-text')}>{o.label ?? String(o.value)}</span>
                </Checkbox>
              </label>
            ))}
          </Checkbox.Group>
        </div>
      </div>
    </div>
  );
}

CheckboxGroup.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.node,
      disabled: PropTypes.bool,
    }),
  ).isRequired,
  selectedValues: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])).isRequired,
  onChange: PropTypes.func.isRequired,
  title: PropTypes.node,
  sectionLabel: PropTypes.node,
};

export default CheckboxGroup;
