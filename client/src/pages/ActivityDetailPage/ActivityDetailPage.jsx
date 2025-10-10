import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleCheck,
  faTriangleExclamation,
  faUserGraduate,
  faHeartPulse,
  faClock,
  faShieldHeart,
  faPhone,
  faEnvelope,
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons';
import { Row, Col, Tabs } from 'antd';
import Button from '@components/Button/Button';
import CardActivity from '@components/CardActivity/CardActivity';
import Label from '@components/Label/Label';
import { mockApi } from '@utils/mockAPI';
import styles from './ActivityDetailPage.module.scss';

const cx = classNames.bind(styles);

function ActivityDetailPage() {
  const { id } = useParams();
  const [activity, setActivity] = useState(null);
  const [relatedActivities, setRelatedActivities] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const all = await mockApi.getActivities();
      const found = all.find((a) => a.id === id);
      setActivity(found);

      // Get related activities (exclude current one, limit to 4)
      const related = all.filter((a) => a.id !== id).slice(0, 4);
      setRelatedActivities(related);
    };
    fetchData();
  }, [id]);

  const descriptionParagraphs = useMemo(
    () => [
      'Chiến dịch "Sạch biển xanh - Tương lai bền vững" là hoạt động tình nguyện ý nghĩa nhằm góp phần bảo vệ môi trường biển và nâng cao ý thức cộng đồng về vấn đề ô nhiễm rác thải nhựa. Đây là cơ hội tuyệt vời để các bạn sinh viên thể hiện tinh thần trách nhiệm với xã hội và môi trường.',
      'Hoạt động sẽ diễn ra tại bãi biển Cửa Lò, Nghệ An - một trong những bãi biển đẹp nhất miền Trung. Chúng ta sẽ cùng nhau thu gom rác thải, tuyên truyền ý thức bảo vệ môi trường cho du khách và cộng đồng địa phương.',
    ],
    [],
  );

  const benefitItems = useMemo(
    () => [
      'Nhận 60 điểm hoạt động CTXH',
      'Được cấp giấy chứng nhận tham gia từ Ban tổ chức',
      'Hỗ trợ chi phí ăn uống và di chuyển 100%',
      'Nhận áo đồng phục và các vật phẩm kỷ niệm',
      'Cơ hội giao lưu, kết nối với sinh viên các trường',
    ],
    [],
  );

  const responsibilityItems = useMemo(
    () => ['Tham gia đầy đủ các hoạt động theo lịch trình', 'Tuân thủ nghiêm túc các quy định an toàn'],
    [],
  );

  const requirementItems = useMemo(
    () => [
      { icon: 'faUserGraduate', text: 'Là sinh viên đang học tại các trường đại học, cao đẳng' },
      { icon: 'faHeartPulse', text: 'Không có các bệnh lý ảnh hưởng đến hoạt động ngoài trời' },
      { icon: 'faClock', text: 'Cam kết tham gia đầy đủ 2 ngày hoạt động (Thứ 7 - Chủ nhật)' },
      { icon: 'faShieldHeart', text: 'Có bảo hiểm y tế và cam kết tuân thủ các quy định an toàn' },
    ],
    [],
  );

  const guideSteps = useMemo(
    () => [
      {
        title: 'Bước 1: Đăng ký tham gia',
        content: 'Điền đầy đủ thông tin vào form đăng ký trực tuyến. Hạn đăng ký đến 23:59 ngày 15/03/2024.',
      },
      {
        title: 'Bước 2: Xác nhận thông tin',
        content: 'Ban tổ chức sẽ gửi email xác nhận trong vòng 24h. Kiểm tra email và xác nhận tham gia.',
      },
      {
        title: 'Bước 3: Tham gia briefing online',
        content: 'Tham dự buổi họp trực tuyến vào 19:00 ngày 18/03/2024 để nắm rõ lịch trình và quy định.',
      },
      {
        title: 'Bước 4: Chuẩn bị đồ dùng cá nhân',
        content: 'Mang theo giấy tờ tùy thân, thuốc cá nhân (nếu có), đồ bảo hộ cá nhân theo hướng dẫn.',
      },
    ],
    [],
  );

  const iconMap = {
    faUserGraduate,
    faHeartPulse,
    faClock,
    faShieldHeart,
  };

  const items = useMemo(
    () => [
      {
        key: '1',
        label: 'Giới thiệu chi tiết',
        children: (
          <div className={cx('activity-detail__tab-panel')}>
            <h4 className={cx('activity-detail__section-title')}>Yêu cầu tham gia</h4>
            <ul className={cx('activity-detail__requirement-list')}>
              {requirementItems.map((item, index) => (
                <li key={index} className={cx('activity-detail__requirement-item')}>
                  <FontAwesomeIcon icon={iconMap[item.icon]} className={cx('activity-detail__requirement-icon')} />
                  <span className={cx('activity-detail__requirement-text')}>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        ),
      },
      {
        key: '2',
        label: 'Hướng dẫn tham gia',
        children: (
          <div className={cx('activity-detail__tab-panel')}>
            <h4 className={cx('activity-detail__section-title')}>Quy trình đăng ký</h4>
            <div className={cx('activity-detail__guide-list')}>
              {guideSteps.map((step, index) => (
                <div key={index} className={cx('activity-detail__guide-item')}>
                  <h5 className={cx('activity-detail__guide-title')}>{step.title}</h5>
                  <p className={cx('activity-detail__guide-content')}>{step.content}</p>
                </div>
              ))}
            </div>
          </div>
        ),
      },
    ],
    [requirementItems, guideSteps],
  );

  return (
    <section className={cx('activity-detail')}>
      <div className={cx('activity-detail__container')}>
        <nav className={cx('activity-detail__breadcrumb')}>
          <Link to="/">Trang chủ</Link> / <Link to="/list-activities">Hoạt động</Link> / <span>Title</span>
        </nav>

        <div className={cx('activity-detail__layout')}>
          <div className={cx('activity-detail__card')}>
            <div className={cx('activity-detail__header')}>
              <div className={cx('activity-detail__title')}>Title</div>
            </div>
            <div className={cx('activity-detail__group')}>
              <div className={cx('activity-detail__group-badge')}>
                <span>Nhóm 2,3</span>
              </div>
            </div>
          </div>

          <Row gutter={[24, 24]}>
            <Col xs={24} lg={16} className={cx('activity-detail__content-column')}>
              <article className={cx('activity-detail__content', 'activity-detail__content--description')}>
                <h2 className={cx('activity-detail__content-title')}>Mô tả</h2>
                <div className={cx('activity-detail__content-body')}>
                  {descriptionParagraphs.map((paragraph) => (
                    <p key={paragraph} className={cx('activity-detail__paragraph')}>
                      {paragraph}
                    </p>
                  ))}
                </div>

                <section className={cx('activity-detail__benefit')}>
                  <h3 className={cx('activity-detail__benefit-title')}>Quyền lợi khi tham gia:</h3>
                  <ul className={cx('activity-detail__benefit-list')}>
                    {benefitItems.map((item) => (
                      <li key={item} className={cx('activity-detail__benefit-item')}>
                        <FontAwesomeIcon icon={faCircleCheck} className={cx('activity-detail__benefit-icon')} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className={cx('activity-detail__responsibility')}>
                  <h3 className={cx('activity-detail__responsibility-title')}>Trách nhiệm của người tham gia:</h3>
                  <ul className={cx('activity-detail__responsibility-list')}>
                    {responsibilityItems.map((item) => (
                      <li key={item} className={cx('activity-detail__responsibility-item')}>
                        <FontAwesomeIcon
                          icon={faTriangleExclamation}
                          className={cx('activity-detail__responsibility-icon')}
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </article>

              <article className={cx('activity-detail__content', 'activity-detail__content--rule')}>
                <Tabs defaultActiveKey="1" items={items} type="line" size="large" />
              </article>
            </Col>

            {/* Sidebar */}
            <Col xs={24} lg={8}>
              <aside className={cx('activity-detail__sidebar')}>
                <div className={cx('activity-detail__sidebar-points')}>
                  <div className={cx('activity-detail__points-value')}>60 điểm</div>
                  <div className={cx('activity-detail__points-label')}>Điểm hoạt động CTXH</div>
                </div>

                <div className={cx('activity-detail__sidebar-info')}>
                  <div className={cx('activity-detail__info-row')}>
                    <span className={cx('activity-detail__info-label')}>Ngày bắt đầu</span>
                    <span className={cx('activity-detail__info-value')}>15/03/2024</span>
                  </div>
                  <div className={cx('activity-detail__info-row')}>
                    <span className={cx('activity-detail__info-label')}>Ngày kết thúc</span>
                    <span className={cx('activity-detail__info-value')}>16/03/2024</span>
                  </div>
                  <div className={cx('activity-detail__info-row')}>
                    <span className={cx('activity-detail__info-label')}>Thời gian</span>
                    <span className={cx('activity-detail__info-value')}>06:00 - 18:00</span>
                  </div>
                  <div className={cx('activity-detail__info-row')}>
                    <span className={cx('activity-detail__info-label')}>Địa điểm</span>
                    <span className={cx('activity-detail__info-value')}>Bãi biển Cửa Lò</span>
                  </div>
                </div>

                <div className={cx('activity-detail__sidebar-registration')}>
                  <div className={cx('activity-detail__registration-header')}>
                    <span className={cx('activity-detail__registration-label')}>Số lượng đăng ký</span>
                    <span className={cx('activity-detail__registration-count')}>42/50</span>
                  </div>
                  <div className={cx('activity-detail__registration-progress')}>
                    <div className={cx('activity-detail__registration-bar')} style={{ width: '84%' }} />
                  </div>
                  <div className={cx('activity-detail__registration-remaining')}>Còn 8 chỗ trống</div>
                </div>

                <div className={cx('activity-detail__sidebar-deadline')}>
                  <div className={cx('activity-detail__info-row')}>
                    <span className={cx('activity-detail__info-label')}>Hạn đăng ký</span>
                    <span className={cx('activity-detail__info-value')}>12/03/2024 23:59</span>
                  </div>
                  <div className={cx('activity-detail__info-row')}>
                    <span className={cx('activity-detail__info-label')}>Hạn hủy đăng ký</span>
                    <span className={cx('activity-detail__info-value')}>12/03/2024 23:59</span>
                  </div>
                </div>

                <div className={cx('activity-detail__sidebar-checkin')}>
                  <div className={cx('activity-detail__checkin-label')}>Phương thức điểm danh</div>
                  <div className={cx('activity-detail__checkin-methods')}>
                    <span className={cx('activity-detail__checkin-badge', 'activity-detail__checkin-badge--qr')}>
                      QR Code
                    </span>
                    <span className={cx('activity-detail__checkin-badge', 'activity-detail__checkin-badge--checkin')}>
                      Check in
                    </span>
                  </div>
                </div>

                <button className={cx('activity-detail__sidebar-button')}>Đăng ký ngay</button>
              </aside>

              <aside className={cx('activity-detail__organizer')}>
                <h3 className={cx('activity-detail__organizer-title')}>Ban tổ chức</h3>

                <div className={cx('activity-detail__organizer-profile')}>
                  <img
                    src="https://placehold.co/48x48"
                    alt="Organizer avatar"
                    className={cx('activity-detail__organizer-avatar')}
                  />
                  <div className={cx('activity-detail__organizer-info')}>
                    <div className={cx('activity-detail__organizer-name')}>Thầy: Nguyễn Văn Minh</div>
                    <div className={cx('activity-detail__organizer-role')}>Trưởng ban tổ chức</div>
                  </div>
                </div>

                <div className={cx('activity-detail__organizer-contact')}>
                  <div className={cx('activity-detail__contact-item')}>
                    <FontAwesomeIcon icon={faPhone} className={cx('activity-detail__contact-icon')} />
                    <span className={cx('activity-detail__contact-text')}>0987.654.321</span>
                  </div>
                  <div className={cx('activity-detail__contact-item')}>
                    <FontAwesomeIcon icon={faEnvelope} className={cx('activity-detail__contact-icon')} />
                    <span className={cx('activity-detail__contact-text')}>minh.nv@huit.edu.vn</span>
                  </div>
                </div>

                <button className={cx('activity-detail__organizer-button')}>
                  <FontAwesomeIcon icon={faEnvelope} />
                  <span>Liên hệ ngay</span>
                </button>
              </aside>
            </Col>
          </Row>
        </div>

        <Label
          title="Hoạt động"
          highlight="liên quan"
          subtitle="Khám phá các hoạt động liên quan cùng nhóm để tích lũy điểm CTXH"
        />

        <div className={cx('activity-detail__related')}>
          <div className={cx('activity-detail__related-list')}>
            {relatedActivities.map((activity) => (
              <CardActivity key={activity.id} {...activity} variant="vertical" state="guest" />
            ))}
          </div>

          <div className={cx('activity-detail__related-actions')}>
            <Link to="/list-activities">
              <Button variant="primary">
                <span>Xem tất cả</span>
                <FontAwesomeIcon icon={faArrowRight} />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ActivityDetailPage;
