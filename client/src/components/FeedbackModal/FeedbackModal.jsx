import React, { useState } from 'react';
import classNames from 'classnames/bind';
import { Modal, Tag, Upload, Input, Checkbox, Image } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperclip } from '@fortawesome/free-solid-svg-icons';
import styles from './FeedbackModal.module.scss';

const { TextArea } = Input;
const { Dragger } = Upload;
const cx = classNames.bind(styles);

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

  const disabled = !confirm || !content.trim() || fileList.length === 0;

  const handleChangeUpload = ({ fileList: list }) => {
    // Do not auto-upload; keep in state to submit later
    setFileList(list);
  };

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

  const handleSubmit = () => {
    onSubmit?.({
      content: content.trim(),
      files: fileList.map((f) => f.originFileObj || f),
      confirm,
    });
  };

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
                <span className={cx('feedback__time-value')}>{checkinTime}</span>
              </li>
              <li className={cx('feedback__row-item')}>
                <span className={cx('feedback__label')}>Check-out:</span>
                <span className={cx('feedback__time-value')}>{checkoutTime}</span>
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
