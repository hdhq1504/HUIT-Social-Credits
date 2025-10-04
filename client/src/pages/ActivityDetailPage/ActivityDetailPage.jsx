import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import { ConfigProvider, Row, Col, Typography } from 'antd';
import SearchBar from '@layouts/components/SearchBar/SearchBar';
import { mockApi } from '../../utils/mockAPI';
import styles from './ActivityDetailPage.module.scss';

const cx = classNames.bind(styles);

const { Title, Text } = Typography;

function ActivityDetailPage() {
  const { id } = useParams();
  const [activity, setActivity] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const all = await mockApi.getActivities();
      const found = all.find((a) => a.id === id);
      setActivity(found);
    };
    fetchData();
  }, [id]);

  return (
    <section className={cx('activity-detail-page')}>
      <div className={cx('activity-detail-page__search')}>
        <SearchBar
          variant="list"
          groups={['Tất cả', 'Địa chỉ đỏ', 'Mùa hè xanh', 'Xuân tình nguyện', 'Hiến máu', 'Hỗ trợ']}
          statuses={['Sắp diễn ra', 'Đang diễn ra', 'Đã kết thúc']}
          onSubmit={(query) => console.log('List filter search:', query)}
        />
      </div>

      <div className={cx('activity-detail-page__container')}>
        <nav className={cx('activity-detail-page__breadcrumb')}>
          <Link to="/">Trang chủ</Link> / <Link to="/list-activities">Hoạt động</Link> / <span>{activity.title}</span>
        </nav>

        <div className={cx('activity-detail-page__layout')}>
          <div className={cx('activity-detail-page__card')}>
            <div className={cx('activity-detail-page__header')}>
              <div className={cx('activity-detail-page__title')}>{activity.title}</div>
            </div>
            <div className={cx('activity-detail-page__group')}>
              <div className={cx('activity-detail-page__group-badge')}>
                <span>Nhóm 2,3</span>
              </div>
            </div>
          </div>

          <Row gutter={[24, 24]}>
            {/* Content 9/12 */}
            <Col xs={24} lg={18} className={cx('activity-detail-page__content-column')}>
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  padding: 32,
                  background: 'var(--White, white)',
                  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.06)',
                  borderRadius: 12,
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  alignItems: 'flex-start',
                  gap: 24,
                  display: 'inline-flex',
                }}
              >
                <div
                  style={{
                    alignSelf: 'stretch',
                    justifyContent: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    color: 'var(--Primary, #00008B)',
                    fontSize: 18,
                    fontFamily: 'Montserrat',
                    fontWeight: '600',
                    wordWrap: 'break-word',
                  }}
                >
                  Mô tả
                </div>
                <div
                  style={{
                    alignSelf: 'stretch',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    alignItems: 'flex-start',
                    gap: 16,
                    display: 'flex',
                  }}
                >
                  <div
                    style={{
                      alignSelf: 'stretch',
                      flexDirection: 'column',
                      justifyContent: 'flex-start',
                      alignItems: 'flex-start',
                      gap: 8,
                      display: 'flex',
                    }}
                  >
                    <div
                      style={{
                        alignSelf: 'stretch',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        alignItems: 'flex-start',
                        display: 'flex',
                      }}
                    >
                      <div
                        style={{
                          alignSelf: 'stretch',
                          textAlign: 'justify',
                          justifyContent: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          color: 'var(--Text-Black, #212121)',
                          fontSize: 16,
                          fontFamily: 'Montserrat',
                          fontWeight: '400',
                          wordWrap: 'break-word',
                        }}
                      >
                        Chiến dịch "Sạch biển xanh - Tương lai bền vững" là hoạt động tình nguyện ý nghĩa nhằm góp phần
                        bảo vệ môi trường biển và nâng cao ý thức cộng đồng về vấn đề ô nhiễm rác thải nhựa. Đây là cơ
                        hội tuyệt vời để các bạn sinh viên thể hiện tinh thần trách nhiệm với xã hội và môi trường.
                      </div>
                    </div>
                    <div
                      style={{
                        alignSelf: 'stretch',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        alignItems: 'flex-start',
                        display: 'flex',
                      }}
                    >
                      <div
                        style={{
                          alignSelf: 'stretch',
                          textAlign: 'justify',
                          justifyContent: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          color: 'var(--Text-Black, #212121)',
                          fontSize: 16,
                          fontFamily: 'Montserrat',
                          fontWeight: '400',
                          wordWrap: 'break-word',
                        }}
                      >
                        Hoạt động sẽ diễn ra tại bãi biển Cửa Lò, Nghệ An - một trong những bãi biển đẹp nhất miền
                        Trung. Chúng ta sẽ cùng nhau thu gom rác thải, tuyên truyền ý thức bảo vệ môi trường cho du
                        khách và cộng đồng địa phương.
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      alignSelf: 'stretch',
                      flexDirection: 'column',
                      justifyContent: 'flex-start',
                      alignItems: 'flex-start',
                      gap: 12,
                      display: 'flex',
                    }}
                  >
                    <div
                      style={{
                        alignSelf: 'stretch',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        alignItems: 'flex-start',
                        display: 'flex',
                      }}
                    >
                      <div
                        style={{
                          justifyContent: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          color: 'var(--Dark, black)',
                          fontSize: 14,
                          fontFamily: 'Montserrat',
                          fontWeight: '700',
                          wordWrap: 'break-word',
                        }}
                      >
                        Quyền lợi khi tham gia:
                      </div>
                    </div>
                    <div
                      style={{
                        alignSelf: 'stretch',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        alignItems: 'flex-start',
                        gap: 10,
                        display: 'flex',
                      }}
                    >
                      <div
                        style={{
                          width: 436.66,
                          flexDirection: 'column',
                          justifyContent: 'flex-start',
                          alignItems: 'flex-start',
                          gap: 8,
                          display: 'flex',
                        }}
                      >
                        <div
                          style={{
                            alignSelf: 'stretch',
                            justifyContent: 'flex-start',
                            alignItems: 'center',
                            display: 'inline-flex',
                          }}
                        >
                          <div
                            style={{
                              paddingTop: 7.5,
                              paddingBottom: 4.5,
                              paddingRight: 12,
                              flexDirection: 'column',
                              justifyContent: 'flex-start',
                              alignItems: 'flex-start',
                              display: 'inline-flex',
                            }}
                          >
                            <div data-variant="9" style={{ width: 16, height: 16, position: 'relative' }}>
                              <div
                                style={{
                                  width: 16,
                                  height: 16,
                                  left: 0,
                                  top: 0,
                                  position: 'absolute',
                                  background: 'var(--Success, #198754)',
                                }}
                              />
                            </div>
                          </div>
                          <div
                            style={{
                              justifyContent: 'center',
                              display: 'flex',
                              flexDirection: 'column',
                              color: 'var(--Text-Black, #212121)',
                              fontSize: 16,
                              fontFamily: 'Montserrat',
                              fontWeight: '400',
                              wordWrap: 'break-word',
                            }}
                          >
                            Nhận 60 điểm hoạt động CTXH
                          </div>
                        </div>
                        <div
                          style={{
                            alignSelf: 'stretch',
                            justifyContent: 'flex-start',
                            alignItems: 'center',
                            display: 'inline-flex',
                          }}
                        >
                          <div
                            style={{
                              paddingTop: 7.5,
                              paddingBottom: 4.5,
                              paddingRight: 12,
                              flexDirection: 'column',
                              justifyContent: 'flex-start',
                              alignItems: 'flex-start',
                              display: 'inline-flex',
                            }}
                          >
                            <div data-variant="10" style={{ width: 16, height: 16, position: 'relative' }}>
                              <div
                                style={{
                                  width: 16,
                                  height: 16,
                                  left: 0,
                                  top: 0,
                                  position: 'absolute',
                                  background: 'var(--Success, #198754)',
                                }}
                              />
                            </div>
                          </div>
                          <div
                            style={{
                              justifyContent: 'center',
                              display: 'flex',
                              flexDirection: 'column',
                              color: 'var(--Text-Black, #212121)',
                              fontSize: 16,
                              fontFamily: 'Montserrat',
                              fontWeight: '400',
                              wordWrap: 'break-word',
                            }}
                          >
                            Được cấp giấy chứng nhận tham gia từ Ban tổ chức
                          </div>
                        </div>
                        <div
                          style={{
                            alignSelf: 'stretch',
                            justifyContent: 'flex-start',
                            alignItems: 'center',
                            display: 'inline-flex',
                          }}
                        >
                          <div
                            style={{
                              paddingTop: 7.5,
                              paddingBottom: 4.5,
                              paddingRight: 12,
                              flexDirection: 'column',
                              justifyContent: 'flex-start',
                              alignItems: 'flex-start',
                              display: 'inline-flex',
                            }}
                          >
                            <div data-variant="11" style={{ width: 16, height: 16, position: 'relative' }}>
                              <div
                                style={{
                                  width: 16,
                                  height: 16,
                                  left: 0,
                                  top: 0,
                                  position: 'absolute',
                                  background: 'var(--Success, #198754)',
                                }}
                              />
                            </div>
                          </div>
                          <div
                            style={{
                              justifyContent: 'center',
                              display: 'flex',
                              flexDirection: 'column',
                              color: 'var(--Text-Black, #212121)',
                              fontSize: 16,
                              fontFamily: 'Montserrat',
                              fontWeight: '400',
                              wordWrap: 'break-word',
                            }}
                          >
                            Hỗ trợ chi phí ăn uống và di chuyển 100%
                          </div>
                        </div>
                        <div
                          style={{
                            alignSelf: 'stretch',
                            justifyContent: 'flex-start',
                            alignItems: 'center',
                            display: 'inline-flex',
                          }}
                        >
                          <div
                            style={{
                              paddingTop: 7.5,
                              paddingBottom: 4.5,
                              paddingRight: 12,
                              flexDirection: 'column',
                              justifyContent: 'flex-start',
                              alignItems: 'flex-start',
                              display: 'inline-flex',
                            }}
                          >
                            <div data-variant="12" style={{ width: 16, height: 16, position: 'relative' }}>
                              <div
                                style={{
                                  width: 16,
                                  height: 16,
                                  left: 0,
                                  top: 0,
                                  position: 'absolute',
                                  background: 'var(--Success, #198754)',
                                }}
                              />
                            </div>
                          </div>
                          <div
                            style={{
                              justifyContent: 'center',
                              display: 'flex',
                              flexDirection: 'column',
                              color: 'var(--Text-Black, #212121)',
                              fontSize: 16,
                              fontFamily: 'Montserrat',
                              fontWeight: '400',
                              wordWrap: 'break-word',
                            }}
                          >
                            Nhận áo đồng phục và các vật phẩm kỷ niệm
                          </div>
                        </div>
                        <div
                          style={{
                            alignSelf: 'stretch',
                            justifyContent: 'flex-start',
                            alignItems: 'center',
                            display: 'inline-flex',
                          }}
                        >
                          <div
                            style={{
                              paddingTop: 7.5,
                              paddingBottom: 4.5,
                              paddingRight: 12,
                              flexDirection: 'column',
                              justifyContent: 'flex-start',
                              alignItems: 'flex-start',
                              display: 'inline-flex',
                            }}
                          >
                            <div data-variant="13" style={{ width: 16, height: 16, position: 'relative' }}>
                              <div
                                style={{
                                  width: 16,
                                  height: 16,
                                  left: 0,
                                  top: 0,
                                  position: 'absolute',
                                  background: 'var(--Success, #198754)',
                                }}
                              />
                            </div>
                          </div>
                          <div
                            style={{
                              justifyContent: 'center',
                              display: 'flex',
                              flexDirection: 'column',
                              color: 'var(--Text-Black, #212121)',
                              fontSize: 16,
                              fontFamily: 'Montserrat',
                              fontWeight: '400',
                              wordWrap: 'break-word',
                            }}
                          >
                            Cơ hội giao lưu, kết nối với sinh viên các trường
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      alignSelf: 'stretch',
                      flexDirection: 'column',
                      justifyContent: 'flex-start',
                      alignItems: 'flex-start',
                      gap: 12,
                      display: 'flex',
                    }}
                  >
                    <div
                      style={{
                        alignSelf: 'stretch',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        alignItems: 'flex-start',
                        display: 'flex',
                      }}
                    >
                      <div
                        style={{
                          justifyContent: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          color: 'var(--Dark, black)',
                          fontSize: 14,
                          fontFamily: 'Montserrat',
                          fontWeight: '700',
                          wordWrap: 'break-word',
                        }}
                      >
                        Trách nhiệm của người tham gia:
                      </div>
                    </div>
                    <div
                      style={{
                        alignSelf: 'stretch',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        alignItems: 'flex-start',
                        gap: 8,
                        display: 'flex',
                      }}
                    >
                      <div
                        style={{
                          alignSelf: 'stretch',
                          justifyContent: 'flex-start',
                          alignItems: 'center',
                          display: 'inline-flex',
                        }}
                      >
                        <div
                          style={{
                            paddingTop: 7.5,
                            paddingBottom: 4.5,
                            paddingRight: 12,
                            flexDirection: 'column',
                            justifyContent: 'flex-start',
                            alignItems: 'flex-start',
                            display: 'inline-flex',
                          }}
                        >
                          <div data-variant="14" style={{ width: 16, height: 16, position: 'relative' }}>
                            <div
                              style={{
                                width: 16,
                                height: 14,
                                left: 0,
                                top: 1,
                                position: 'absolute',
                                background: 'var(--Warning, #DC7700)',
                              }}
                            />
                          </div>
                        </div>
                        <div
                          style={{
                            justifyContent: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            color: 'var(--Text-Black, #212121)',
                            fontSize: 16,
                            fontFamily: 'Montserrat',
                            fontWeight: '400',
                            wordWrap: 'break-word',
                          }}
                        >
                          Tham gia đầy đủ các hoạt động theo lịch trình
                        </div>
                      </div>
                      <div
                        style={{
                          alignSelf: 'stretch',
                          justifyContent: 'flex-start',
                          alignItems: 'center',
                          display: 'inline-flex',
                        }}
                      >
                        <div
                          style={{
                            paddingTop: 7.5,
                            paddingBottom: 4.5,
                            paddingRight: 12,
                            flexDirection: 'column',
                            justifyContent: 'flex-start',
                            alignItems: 'flex-start',
                            display: 'inline-flex',
                          }}
                        >
                          <div data-variant="15" style={{ width: 16, height: 16, position: 'relative' }}>
                            <div
                              style={{
                                width: 16,
                                height: 14,
                                left: 0,
                                top: 1,
                                position: 'absolute',
                                background: 'var(--Warning, #DC7700)',
                              }}
                            />
                          </div>
                        </div>
                        <div
                          style={{
                            justifyContent: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            color: 'var(--Text-Black, #212121)',
                            fontSize: 16,
                            fontFamily: 'Montserrat',
                            fontWeight: '400',
                            wordWrap: 'break-word',
                          }}
                        >
                          Tuân thủ nghiêm túc các quy định an toàn
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Col>

            {/* Sidebar 3/12 */}
            <Col xs={24} lg={6}></Col>
          </Row>
        </div>
      </div>
    </section>
  );
}

export default ActivityDetailPage;
