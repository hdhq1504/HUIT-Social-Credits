import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from './RadioGroup.module.scss';

const cx = classNames.bind(styles);

function RadioGroup({ label, options, name, selectedValue, onChange }) {
    return (
        <div className={cx('radio-group')}>
            <span className={cx('label')}>{label}</span>
            <div className={cx('radio-options')}>
                {options.map((option) => (
                    <label key={option.value} className={cx('radio-label')}>
                        <input
                            type="radio"
                            name={name}
                            value={option.value}
                            checked={selectedValue === option.value}
                            onChange={() => onChange(option.value)}
                            className={cx('radio-input')}
                        />
                        <span className={cx('radio-custom')}></span>
                    </label>
                ))}
            </div>
        </div>
    );
}

RadioGroup.propTypes = {
    label: PropTypes.string, // Nhãn của nhóm radio
    name: PropTypes.string.isRequired, // Tên của nhóm radio (bắt buộc)
    options: PropTypes.arrayOf(
        PropTypes.shape({
            value: PropTypes.string.isRequired,
            label: PropTypes.string,
        }),
    ).isRequired, // Danh sách các lựa chọn radio (bắt buộc)
    selectedValue: PropTypes.string.isRequired, // Giá trị đang được chọn (bắt buộc)
    onChange: PropTypes.func.isRequired, // Hàm xử lý khi chọn radio (bắt buộc)
};

export default RadioGroup;

// cách sử dụng
// const [selectedRadio, setSelectedRadio] = useState('option1');

// const handleRadioChange = (value) => {
//     setSelectedRadio(value);
// };
// <RadioGroup
//     label="Radio:"
//     name="example"
//     options={[
//         { value: 'option1', label: 'Option 1' },
//         { value: 'option2', label: 'Option 2' },
//         { value: 'option3', label: 'Option 3' },
//     ]}
//     selectedValue={selectedRadio}
//     onChange={handleRadioChange}
// />;
