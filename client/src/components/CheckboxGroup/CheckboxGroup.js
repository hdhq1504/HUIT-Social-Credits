import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from './CheckboxGroup.module.scss';

const cx = classNames.bind(styles);

function CheckboxGroup({ options, selectedValues, onChange }) {
    const handleChange = (value) => {
        if (selectedValues.includes(value)) {
            onChange(selectedValues.filter((item) => item !== value));
        } else {
            onChange([...selectedValues, value]);
        }
    };

    return (
        <div className={cx('checkbox-group')}>
            {options.map((option) => (
                <label key={option.value} className={cx('checkbox-label')}>
                    <input
                        type="checkbox"
                        value={option.value}
                        checked={selectedValues.includes(option.value)}
                        onChange={() => handleChange(option.value)}
                        className={cx('checkbox-input')}
                    />
                    <span className={cx('checkbox-custom')}></span>
                    <span className={cx('title')}>{option.label}</span>
                </label>
            ))}
        </div>
    );
}

CheckboxGroup.propTypes = {
    options: PropTypes.arrayOf(
        PropTypes.shape({
            value: PropTypes.string.isRequired,
            label: PropTypes.string,
        }),
    ).isRequired, // Danh sách checkbox (bắt buộc)
    selectedValues: PropTypes.arrayOf(PropTypes.string).isRequired, // Các giá trị được chọn (bắt buộc)
    onChange: PropTypes.func.isRequired, // Hàm xử lý sự kiện khi chọn checkbox (bắt buộc)
};

export default CheckboxGroup;

// cach su dung
// const [selectedItems, setSelectedItems] = useState([]);

// const options = [
//     { value: 'option1', label: 'Option 1' },
//     { value: 'option2', label: 'Option 2' },
//     { value: 'option3', label: 'Option 3' },
// ];

// <CheckboxGroup options={options} selectedValues={selectedItems} onChange={setSelectedItems} />
// <p>Selected: {selectedItems.join(", ")}</p>
