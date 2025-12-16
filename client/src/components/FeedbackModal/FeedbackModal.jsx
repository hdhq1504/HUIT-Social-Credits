import React, { useState } from 'react';
import classNames from 'classnames/bind';
import { Modal, Tag, Upload, Input, Checkbox, Image } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperclip } from '@fortawesome/free-solid-svg-icons';
import styles from './FeedbackModal.module.scss';

const { TextArea } = Input;
const { Dragger } = Upload;
const cx = classNames.bind(styles);

/**
 * Modal gửi phản hồi về điểm CTXH của hoạt động.
 * Cho phép sinh viên gửi nội dung phản hồi kèm minh chứng đính kèm.
 *
 * @param {Object} props - Props của component.
 * @param {boolean} props.open - Trạng thái hiển thị modal.
 * @param {Function} props.onSubmit - Callback khi gửi phản hồi (nhận { content, files, confirm }).
 * @param {Function} props.onCancel - Callback khi đóng modal.
 * @param {string} [props.campaignName=''] - Tên hoạt động.
 * @param {string} [props.groupLabel] - Nhãn nhóm hoạt động.
 * @param {string} [props.pointsLabel] - Nhãn điểm hiện tại.
 * @param {string} [props.checkinTime] - Thời gian check-in.
 * @param {string} [props.checkoutTime] - Thời gian check-out.
 * @param {boolean} [props.submitLoading=false] - Trạng thái loading khi gửi.
 * @returns {React.ReactElement} Component FeedbackModal.
 */
function FeedbackModal({
  open,
  onSubmit,
  onCancel,
  campaignName = '',
  groupLabel,
  pointsLabel,
  checkinTime,
  checkoutTime,
  submitLoading = false,
}) {
  /**
   * Chuyển file sang base64 để preview.
   */
  const getBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  const [content, setContent] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [fileList, setFileList] = useState([]);

  // Vô hiệu hóa submit nếu: chưa confirm, content trống, hoặc chưa có file đính kèm
  const disabled = !confirm || !content.trim() || fileList.length === 0;

  /**
   * Xử lý khi danh sách file upload thay đổi.
   * Không auto-upload, giữ list ở state để submit cùng form.
   */
  const handleChangeUpload = ({ fileList: list }) => {
    setFileList(list);
  };

  /**
   * Xử lý preview file đã upload.
   * Chuyển file sang base64 nếu chưa có preview URL.
   */
  const handlePreview = async (file) => {
    if (!file.url && !file.preview && file.originFileObj) {
      file.preview = await getBase64(file.originFileObj);
    }
    const src = file.url || file.preview;
    if (src) {
      setPreviewImage(src);
      setPreviewOpen(true);
    }
  };

  /**
   * Xử lý gửi phản hồi lên server.
   * Gọi parent callback với content, files và flag confirm.
   */
  const handleSubmit = () => {
    onSubmit?.({
      content: content.trim(),
      files: fileList.map((f) => f.originFileObj || f),
      confirm,
    });
  };

  // Normalize thời gian check-in/check-out để hiển thị
  const resolvedCheckinTime = checkinTime && checkinTime !== '--' ? checkinTime : 'Chưa điểm danh';
  const resolvedCheckoutTime = checkoutTime && checkoutTime !== '--' ? checkoutTime : 'Chưa điểm danh';

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      centered
      className={cx('feedback')}
      title={
        <div className={cx('feedback__header')}>
          <h3 className={cx('feedback__title')}>Gửi phản hồi điểm CTXH</h3>
        </div>
      }
    >
      <div className={cx('feedback__body')}>
        <div className={cx('feedback__campaign')}>
          <h4 className={cx('feedback__campaign-title')}>{campaignName}</h4>

          <div className={cx('feedback__info')}>
            <ul className={cx('feedback__row')}>
              <li className={cx('feedback__row-item')}>
                <span className={cx('feedback__label')}>Nhóm hoạt động:</span>
                {groupLabel && <Tag className={cx('feedback__tag-group')}>{groupLabel}</Tag>}
              </li>
              <li className={cx('feedback__row-item')}>
                <span className={cx('feedback__label')}>Điểm hiện tại:</span>
                {pointsLabel && <span className={cx('feedback__points-label')}>{pointsLabel}</span>}
              </li>
              <li className={cx('feedback__row-item')}>
                <span className={cx('feedback__label')}>Check-in:</span>
                <span className={cx('feedback__time-value')}>{resolvedCheckinTime}</span>
              </li>
              <li className={cx('feedback__row-item')}>
                <span className={cx('feedback__label')}>Check-out:</span>
                <span className={cx('feedback__time-value')}>{resolvedCheckoutTime}</span>
              </li>
            </ul>
          </div>

          <div className={cx('feedback__form')}>
            <label className={cx('feedback__form-label')}>
              Nội dung phản hồi <span className={cx('required')}>*</span>
            </label>
            <TextArea
              className={cx('feedback__textarea')}
              placeholder="Mô tả chi tiết vấn đề về điểm CTXH của hoạt động này..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              autoSize={{ minRows: 4, maxRows: 4 }}
            />

            <label className={cx('feedback__form-label', 'mt')}>
              Minh chứng đính kèm <span className={cx('required')}>*</span>
            </label>
            <Dragger
              className={cx('feedback__uploader')}
              name="files"
              multiple
              listType="picture-card"
              beforeUpload={() => false}
              onChange={handleChangeUpload}
              onPreview={handlePreview}
              fileList={fileList}
              accept=".jpg,.jpeg,.png,.pdf"
            >
              {fileList.length >= 8 ? null : (
                <div className={cx('feedback__upload-btn')}>
                  <p className={cx('feedback__uploader-icon')}>
                    <FontAwesomeIcon icon={faPaperclip} />
                  </p>
                  <p className={cx('ant-upload__text')}>Kéo thả hoặc chụp ảnh minh chứng tại đây</p>
                  <p className={cx('ant-upload__hint')}>Hỗ trợ JPG, PNG, PDF ≤ 10MB</p>
                </div>
              )}
            </Dragger>

            {previewImage && (
              <Image
                wrapperStyle={{ display: 'none' }}
                preview={{
                  visible: previewOpen,
                  onVisibleChange: (visible) => setPreviewOpen(visible),
                  afterOpenChange: (visible) => !visible && setPreviewImage(''),
                }}
                src={previewImage}
              />
            )}

            <Checkbox
              className={cx('feedback__checkbox')}
              checked={confirm}
              onChange={(e) => setConfirm(e.target.checked)}
            >
              Tôi xác nhận thông tin và minh chứng là chính xác
            </Checkbox>
          </div>
        </div>
      </div>

      <div className={cx('feedback__footer')}>
        <button
          className={cx('feedback__submit', disabled && 'feedback__submit--disabled')}
          onClick={handleSubmit}
          disabled={disabled || submitLoading}
        >
          {submitLoading ? 'Đang gửi...' : 'Gửi phản hồi'}
        </button>
        <button className={cx('feedback__cancel')} onClick={onCancel}>
          Hủy bỏ
        </button>
      </div>
    </Modal>
  );
}

export default FeedbackModal;
