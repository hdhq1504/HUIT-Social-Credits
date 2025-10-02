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
    <div className={cx('wrapper')}>
      <div className={cx('header')}>
        <div className={cx('headerIcon')}>
          <FontAwesomeIcon icon={faFilter} />
        </div>
        <div className={cx('headerTitle')}>{title}</div>
      </div>

      <div className={cx('section')}>
        <div className={cx('sectionHeader')}>
          <div className={cx('sectionLabel')}>{sectionLabel}</div>
          <div className={cx('sectionChevron')}>
            <FontAwesomeIcon icon={faCaretDown} />
          </div>
        </div>

        <div className={cx('options')}>
          {allOpt && (
            <label className={cx('optionRow', 'optionAll')}>
              <Checkbox
                className={cx('checkbox')}
                indeterminate={indeterminate}
                checked={allChecked}
                onChange={(e) => handleAllChange(e.target.checked)}
              >
                <span className={cx('optionText')}>{allOpt.label ?? 'Tất cả'}</span>
              </Checkbox>
            </label>
          )}

          <Checkbox.Group className={cx('checkboxGroup')} value={selectedChildren} onChange={handleChildChange}>
            {childOptions.map((o) => (
              <label key={String(o.value)} className={cx('optionRow')}>
                <Checkbox className={cx('checkbox')} value={o.value} disabled={o.disabled}>
                  <span className={cx('optionText')}>{o.label ?? String(o.value)}</span>
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
