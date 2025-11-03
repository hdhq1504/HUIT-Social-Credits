import React, { useState } from 'react';
import layoutStyles from '../../styles/AdminPage.module.scss';
import styles from './A_Activities_AddEdit.module.scss';
import { X, Save, Info, User, CalendarDays, RefreshCw, Image, Settings, FileText } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { vi } from 'date-fns/locale';
import { format } from 'date-fns';

const today = format(new Date(), 'dd/MM/yyyy');

const ActivitiesAddEditPage = ({ onBackToList }) => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [registerStart, setRegisterStart] = useState(null);
  const [startTime, setStartTime] = useState(null);

  return (
    <div className={layoutStyles.container}>
      {/* Header */}
      <div className={layoutStyles.header}>
        <h1 className={layoutStyles.title}>Tạo hoạt động mới</h1>
        <div className={layoutStyles.actionButtons}>
          <button className={`${layoutStyles.actionButton} ${layoutStyles.cancelButton}`} onClick={onBackToList}>
            <X size={18} /> Hủy
          </button>
          <button className={`${layoutStyles.actionButton} ${layoutStyles.saveButton}`}>
            <Save size={18} /> Lưu hoạt động
          </button>
        </div>
      </div>

      {/* Form */}
      <div className={styles.activityForm}>
        {/* Cột trái */}
        <div className={styles.activityForm__left}>
          {/* --- Thông tin cơ bản --- */}
          <section className={styles.activitySection}>
            <div className={styles.activitySection__header}>
              <Info size={18} />
              <h3>Thông tin cơ bản</h3>
            </div>

            <div className={styles.activityForm__group}>
              <label>
                Tên hoạt động <span className={styles.activityForm__required}>*</span>
              </label>
              <input type="text" placeholder="Nhập tên hoạt động..." />
            </div>

            <div className={styles.activityForm__row}>
              <div className={styles.activityForm__group}>
                <label>
                  Nhóm hoạt động <span className={styles.activityForm__required}>*</span>
                </label>
                <select>
                  <option>Chọn nhóm hoạt động</option>
                  <option>Nhóm 1</option>
                  <option>Nhóm 2, 3</option>
                </select>
              </div>
              <div className={styles.activityForm__group}>
                <label>
                  Số điểm <span className={styles.activityForm__required}>*</span>
                </label>
                <input type="number" placeholder="Nhập số điểm..." />
              </div>
            </div>

            {/* Ngày bắt đầu - kết thúc */}
            <div className={styles.activityForm__row}>
              <div className={styles.activityForm__group}>
                <label>
                  Ngày bắt đầu <span className={styles.activityForm__required}>*</span>
                </label>
                <DatePicker
                  selected={startDate}
                  onChange={setStartDate}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="dd/MM/yyyy"
                  className={styles.activityForm__inputDate}
                  locale={vi}
                  isClearable
                />
              </div>
              <div className={styles.activityForm__group}>
                <label>
                  Ngày kết thúc <span className={styles.activityForm__required}>*</span>
                </label>
                <DatePicker
                  selected={endDate}
                  onChange={setEndDate}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="dd/MM/yyyy"
                  className={styles.activityForm__inputDate}
                  locale={vi}
                  isClearable
                />
              </div>
            </div>

            {/* Giờ bắt đầu - kết thúc */}
            <div className={styles.activityForm__row}>
              <div className={styles.activityForm__group}>
                <label>
                  Giờ bắt đầu <span className={styles.activityForm__required}>*</span>
                </label>
                <DatePicker
                  selected={startTime}
                  onChange={(time) => setStartTime(time)}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={5}
                  timeFormat="HH:mm"
                  dateFormat="HH:mm"
                  placeholderText="--:--"
                  className={styles.activityForm__inputDate}
                  locale={vi}
                  isClearable
                />
              </div>
              <div className={styles.activityForm__group}>
                <label>
                  Giờ kết thúc <span className={styles.activityForm__required}>*</span>
                </label>
                <DatePicker
                  selected={startTime}
                  onChange={(time) => setStartTime(time)}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={5}
                  timeFormat="HH:mm"
                  dateFormat="HH:mm"
                  placeholderText="--:--"
                  className={styles.activityForm__inputDate}
                  locale={vi}
                  isClearable
                />
              </div>
            </div>

            <div className={styles.activityForm__group}>
              <label>
                Địa điểm <span className={styles.activityForm__required}>*</span>
              </label>
              <input type="text" placeholder="Nhập địa điểm tổ chức..." />
            </div>
          </section>

          {/* --- Cài đặt đăng ký --- */}
          <section className={styles.activitySection}>
            <div className={styles.activitySection__header}>
              <Settings size={18} />
              <h3>Cài đặt đăng ký</h3>
            </div>

            <div className={styles.activityForm__row}>
              <div className={styles.activityForm__group}>
                <label>
                  Số lượng tham gia <span className={styles.activityForm__required}>*</span>
                </label>
                <input type="number" placeholder="0" />
              </div>
              <div className={styles.activityForm__group}>
                <label>
                  Phương thức điểm danh <span className={styles.activityForm__required}>*</span>
                </label>
                <select>
                  <option>Chọn phương thức</option>
                  <option>QR Code</option>
                  <option>Thủ công</option>
                </select>
              </div>
            </div>

            <div className={styles.activityForm__row}>
              <div className={styles.activityForm__group}>
                <label>
                  Hạn đăng ký <span className={styles.activityForm__required}>*</span>
                </label>
                <DatePicker
                  selected={registerStart}
                  onChange={setRegisterStart}
                  showTimeSelect
                  timeIntervals={5}
                  timeFormat="HH:mm"
                  dateFormat="dd/MM/yyyy HH:mm"
                  placeholderText="dd/MM/yyyy --:--"
                  className={styles.activityForm__inputDate}
                  locale={vi}
                  isClearable
                />
              </div>
              <div className={styles.activityForm__group}>
                <label>
                  Hạn hủy đăng ký <span className={styles.activityForm__required}>*</span>
                </label>
                <DatePicker
                  selected={registerStart}
                  onChange={setRegisterStart}
                  showTimeSelect
                  timeIntervals={5}
                  timeFormat="HH:mm"
                  dateFormat="dd/MM/yyyy HH:mm"
                  placeholderText="dd/MM/yyyy --:--"
                  className={styles.activityForm__inputDate}
                  locale={vi}
                  isClearable
                />
              </div>
            </div>
          </section>

          {/* --- Thông tin chi tiết --- */}
          <section className={styles.activitySection}>
            <div className={styles.activitySection__header}>
              <FileText size={18} />
              <h3>Thông tin chi tiết</h3>
            </div>

            <div className={styles.activityForm__group}>
              <label>Mô tả hoạt động</label>
              <textarea placeholder="Mô tả chi tiết về hoạt động..." />
            </div>

            <div className={styles.activityForm__row}>
              <div className={styles.activityForm__group}>
                <label>Quyền lợi</label>
                <textarea placeholder="Các quyền lợi mà sinh viên sẽ nhận được..." />
              </div>
              <div className={styles.activityForm__group}>
                <label>Trách nhiệm</label>
                <textarea placeholder="Các nhiệm vụ mà sinh viên khi tham gia cần thực hiện..." />
              </div>
            </div>

            <div className={styles.activityForm__row}>
              <div className={styles.activityForm__group}>
                <label>Yêu cầu tham gia</label>
                <textarea placeholder="Các yêu cầu đối với sinh viên tham gia..." />
              </div>
              <div className={styles.activityForm__group}>
                <label>Hướng dẫn tham gia</label>
                <textarea placeholder="Hướng dẫn chi tiết cho sinh viên..." />
              </div>
            </div>
          </section>

          {/* --- Hình ảnh đại diện --- */}
          <section className={styles.activitySection}>
            <div className={styles.activitySection__header}>
              <Image size={18} />
              <h3>Hình ảnh đại diện</h3>
            </div>

            <div className={styles.activityForm__upload}>
              <p>Kéo thả file hoặc chọn file</p>
              <small>Hỗ trợ JPG, PNG ≤ 10MB</small>
            </div>
          </section>
        </div>

        {/* --- Cột phải --- */}
        <div className={styles.activityForm__right}>
          <div className={styles.activityStatus}>
            <div className={styles.activityStatus__header}>
              <Info size={16} />
              <h3>Thông tin trạng thái</h3>
            </div>

            <div className={styles.activityStatus__item}>
              <div className={`${styles.activityStatus__icon} ${styles['activityStatus__icon--blue']}`}>
                <User size={16} />
              </div>
              <div>
                <span>Người tạo</span>
                <p>Admin HUIT</p>
              </div>
            </div>

            <div className={styles.activityStatus__item}>
              <div className={`${styles.activityStatus__icon} ${styles['activityStatus__icon--green']}`}>
                <CalendarDays size={16} />
              </div>
              <div>
                <span>Ngày tạo</span>
                <p>{today}</p>
              </div>
            </div>

            <div className={styles.activityStatus__item}>
              <div className={`${styles.activityStatus__icon} ${styles['activityStatus__icon--orange']}`}>
                <RefreshCw size={16} />
              </div>
              <div>
                <span>Cập nhật lần cuối</span>
                <p className={styles['activityStatus__text--muted']}>Chưa có</p>
              </div>
            </div>

            <hr className={styles.activityStatus__divider} />

            <h4>Gợi ý</h4>
            <div className={styles.activityStatus__tip + ' ' + styles['activityStatus__tip--green']}>
              <div className={styles['activityStatus__tipIcon--green']}>✓</div>
              <p>Hình ảnh đại diện sẽ giúp thu hút sinh viên tham gia hơn.</p>
            </div>
            <div className={styles.activityStatus__tip + ' ' + styles['activityStatus__tip--yellow']}>
              <div className={styles['activityStatus__tipIcon--yellow']}>⚠</div>
              <p>Kiểm tra kỹ thời gian và địa điểm trước khi lưu.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivitiesAddEditPage;
