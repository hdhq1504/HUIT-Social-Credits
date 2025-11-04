import React, { useState } from 'react';
import { X, Save, Info, User, CalendarDays, RefreshCw, Image, Settings, FileText } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { vi } from 'date-fns/locale';
import { format } from 'date-fns';
import classNames from 'classnames/bind';
import styles from './ActivitiesAddEditPage.module.scss';

const cx = classNames.bind(styles);
const today = format(new Date(), 'dd/MM/yyyy');

const ActivitiesAddEditPage = ({ onBackToList }) => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [registerStart, setRegisterStart] = useState(null);
  const [registerEnd, setRegisterEnd] = useState(null);

  return (
    <div className={cx('activities')}>
      {/* Header */}
      <header className={cx('activities__header')}>
        <h1 className={cx('activities__title')}>Tạo hoạt động mới</h1>
        <div className={cx('activities__actions')}>
          <button className={cx('activities__btn', 'activities__btn--cancel')} onClick={onBackToList}>
            <X size={18} /> Hủy
          </button>
          <button className={cx('activities__btn', 'activities__btn--save')}>
            <Save size={18} /> Lưu hoạt động
          </button>
        </div>
      </header>

      {/* Form container */}
      <div className={cx('activities__container')}>
        {/* Left column */}
        <div className={cx('activities__left')}>
          {/* Thông tin cơ bản */}
          <section className={cx('activities__section')}>
            <div className={cx('activities__section-header')}>
              <Info size={18} />
              <h3>Thông tin cơ bản</h3>
            </div>

            <div className={cx('activities__group')}>
              <label>
                Tên hoạt động <span className={cx('activities__required')}>*</span>
              </label>
              <input type="text" placeholder="Nhập tên hoạt động..." />
            </div>

            <div className={cx('activities__row')}>
              <div className={cx('activities__group')}>
                <label>
                  Nhóm hoạt động <span className={cx('activities__required')}>*</span>
                </label>
                <select>
                  <option>Chọn nhóm hoạt động</option>
                  <option>Nhóm 1</option>
                  <option>Nhóm 2</option>
                </select>
              </div>
              <div className={cx('activities__group')}>
                <label>
                  Số điểm <span className={cx('activities__required')}>*</span>
                </label>
                <input type="number" placeholder="Nhập số điểm..." />
              </div>
            </div>

            <div className={cx('activities__row')}>
              <div className={cx('activities__group')}>
                <label>
                  Ngày bắt đầu <span className={cx('activities__required')}>*</span>
                </label>
                <DatePicker
                  selected={startDate}
                  onChange={setStartDate}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="dd/MM/yyyy"
                  className={cx('activities__input')}
                  locale={vi}
                  isClearable
                />
              </div>
              <div className={cx('activities__group')}>
                <label>
                  Ngày kết thúc <span className={cx('activities__required')}>*</span>
                </label>
                <DatePicker
                  selected={endDate}
                  onChange={setEndDate}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="dd/MM/yyyy"
                  className={cx('activities__input')}
                  locale={vi}
                  isClearable
                />
              </div>
            </div>

            <div className={cx('activities__row')}>
              <div className={cx('activities__group')}>
                <label>
                  Giờ bắt đầu <span className={cx('activities__required')}>*</span>
                </label>
                <DatePicker
                  selected={startTime}
                  onChange={setStartTime}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={5}
                  timeFormat="HH:mm"
                  dateFormat="HH:mm"
                  placeholderText="--:--"
                  className={cx('activities__input')}
                  locale={vi}
                  isClearable
                />
              </div>
              <div className={cx('activities__group')}>
                <label>
                  Giờ kết thúc <span className={cx('activities__required')}>*</span>
                </label>
                <DatePicker
                  selected={endTime}
                  onChange={setEndTime}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={5}
                  timeFormat="HH:mm"
                  dateFormat="HH:mm"
                  placeholderText="--:--"
                  className={cx('activities__input')}
                  locale={vi}
                  isClearable
                />
              </div>
            </div>

            <div className={cx('activities__group')}>
              <label>
                Địa điểm <span className={cx('activities__required')}>*</span>
              </label>
              <input type="text" placeholder="Nhập địa điểm tổ chức..." />
            </div>
          </section>

          {/* Cài đặt đăng ký */}
          <section className={cx('activities__section')}>
            <div className={cx('activities__section-header')}>
              <Settings size={18} />
              <h3>Cài đặt đăng ký</h3>
            </div>

            <div className={cx('activities__row')}>
              <div className={cx('activities__group')}>
                <label>
                  Số lượng tham gia <span className={cx('activities__required')}>*</span>
                </label>
                <input type="number" placeholder="0" />
              </div>
              <div className={cx('activities__group')}>
                <label>
                  Phương thức điểm danh <span className={cx('activities__required')}>*</span>
                </label>
                <select>
                  <option>Chọn phương thức</option>
                  <option>QR Code</option>
                  <option>Thủ công</option>
                </select>
              </div>
            </div>

            <div className={cx('activities__row')}>
              <div className={cx('activities__group')}>
                <label>
                  Hạn đăng ký <span className={cx('activities__required')}>*</span>
                </label>
                <DatePicker
                  selected={registerStart}
                  onChange={setRegisterStart}
                  showTimeSelect
                  timeIntervals={5}
                  timeFormat="HH:mm"
                  dateFormat="dd/MM/yyyy HH:mm"
                  placeholderText="dd/MM/yyyy --:--"
                  className={cx('activities__input')}
                  locale={vi}
                  isClearable
                />
              </div>
              <div className={cx('activities__group')}>
                <label>
                  Hạn hủy đăng ký <span className={cx('activities__required')}>*</span>
                </label>
                <DatePicker
                  selected={registerEnd}
                  onChange={setRegisterEnd}
                  showTimeSelect
                  timeIntervals={5}
                  timeFormat="HH:mm"
                  dateFormat="dd/MM/yyyy HH:mm"
                  placeholderText="dd/MM/yyyy --:--"
                  className={cx('activities__input')}
                  locale={vi}
                  isClearable
                />
              </div>
            </div>
          </section>

          {/* Thông tin chi tiết */}
          <section className={cx('activities__section')}>
            <div className={cx('activities__section-header')}>
              <FileText size={18} />
              <h3>Thông tin chi tiết</h3>
            </div>

            <div className={cx('activities__group')}>
              <label>Mô tả hoạt động</label>
              <textarea placeholder="Mô tả chi tiết về hoạt động..." />
            </div>

            <div className={cx('activities__row')}>
              <div className={cx('activities__group')}>
                <label>Quyền lợi</label>
                <textarea placeholder="Các quyền lợi..." />
              </div>
              <div className={cx('activities__group')}>
                <label>Trách nhiệm</label>
                <textarea placeholder="Các nhiệm vụ cần thực hiện..." />
              </div>
            </div>
          </section>

          {/* Upload hình ảnh */}
          <section className={cx('activities__section')}>
            <div className={cx('activities__section-header')}>
              <Image size={18} />
              <h3>Hình ảnh đại diện</h3>
            </div>
            <div className={cx('activities__upload')}>
              <p>Kéo thả hoặc chọn file</p>
              <small>Hỗ trợ JPG, PNG ≤ 10MB</small>
            </div>
          </section>
        </div>

        {/* Right column / status */}
        <aside className={cx('activities__right')}>
          <div className={cx('activities__status')}>
            <div className={cx('activities__status-header')}>
              <Info size={16} />
              <h3>Thông tin trạng thái</h3>
            </div>

            <div className={cx('activities__status-item')}>
              <div className={cx('activities__status-icon', 'activities__status-icon--blue')}>
                <User size={16} />
              </div>
              <div>
                <span>Người tạo</span>
                <p>Admin HUIT</p>
              </div>
            </div>

            <div className={cx('activities__status-item')}>
              <div className={cx('activities__status-icon', 'activities__status-icon--green')}>
                <CalendarDays size={16} />
              </div>
              <div>
                <span>Ngày tạo</span>
                <p>{today}</p>
              </div>
            </div>

            <div className={cx('activities__status-item')}>
              <div className={cx('activities__status-icon', 'activities__status-icon--orange')}>
                <RefreshCw size={16} />
              </div>
              <div>
                <span>Cập nhật lần cuối</span>
                <p className={cx('activities__status-text--muted')}>Chưa có</p>
              </div>
            </div>

            <hr className={cx('activities__divider')} />

            <h4>Gợi ý</h4>
            <div className={cx('activities__tip', 'activities__tip--green')}>
              <div className={cx('activities__tip-icon', 'activities__tip-icon--green')}>✓</div>
              <p>Thêm hình ảnh giúp thu hút sinh viên hơn.</p>
            </div>
            <div className={cx('activities__tip', 'activities__tip--yellow')}>
              <div className={cx('activities__tip-icon', 'activities__tip-icon--yellow')}>⚠</div>
              <p>Kiểm tra kỹ thời gian và địa điểm trước khi lưu.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ActivitiesAddEditPage;
