import React from 'react';
import classNames from 'classnames/bind';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { Input, Select, Button, Row, Col, Form } from 'antd';
import styles from './SearchBar.module.scss';

const cx = classNames.bind(styles);

function SearchBar({
  variant = 'list',
  groups = [],
  statuses = [],
  onSubmit,
  placeholder = 'Nhập từ khóa',
  defaultValues = {},
}) {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();

  const initial = {
    keyword: defaultValues.keyword || '',
    group: defaultValues.group || undefined,
    status: defaultValues.status || undefined,
  };

  const handleFinish = (values) => {
    onSubmit?.(values);

    const params = new URLSearchParams({
      keyword: values.keyword || '',
      group: values.group || '',
      status: values.status || '',
    });
    const to = variant === 'home' ? `/activities?${params.toString()}` : `${location.pathname}?${params.toString()}`;

    navigate(to);
  };

  const isHome = variant === 'home';

  return (
    <div className={cx('search-bar', { 'search-bar--home': isHome, 'search-bar--list': !isHome })}>
      <Form
        form={form}
        layout="vertical"
        initialValues={initial}
        onFinish={handleFinish}
        className={cx('search-bar__form')}
      >
        <Row gutter={[16, 16]} align="middle" justify="space-between" wrap>
          <Col xs={24} md={isHome ? 20 : 12}>
            <Form.Item name="keyword" className={cx('search-bar__item')} noStyle>
              <Input size="large" placeholder={placeholder} className={cx('search-bar__input')} allowClear />
            </Form.Item>
          </Col>

          {!isHome && (
            <>
              <Col xs={12} md={4}>
                <Form.Item name="group" className={cx('searchbar__item')} noStyle>
                  <Select
                    size="large"
                    style={{ width: 185 }}
                    placeholder="Nhóm hoạt động"
                    options={groups.map((g) => ({ value: g, label: g }))}
                    className={cx('search-bar__select')}
                    allowClear
                  />
                </Form.Item>
              </Col>

              <Col xs={12} md={4}>
                <Form.Item name="status" className={cx('search-bar__item')} noStyle>
                  <Select
                    size="large"
                    style={{ width: 185 }}
                    placeholder="Trạng thái"
                    options={statuses.map((s) => ({ value: s, label: s }))}
                    className={cx('search-bar__select')}
                    allowClear
                  />
                </Form.Item>
              </Col>
            </>
          )}

          <Col xs={24} md={isHome ? 4 : 2}>
            <Form.Item noStyle>
              <Button
                htmlType="submit"
                size="large"
                block
                className={cx('search-bar__button', {
                  'search-bar__button--orange': true,
                })}
                icon={<FontAwesomeIcon icon={faSearch} />}
              >
                {isHome ? 'Tìm kiếm' : 'Lọc'}
              </Button>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </div>
  );
}

export default SearchBar;
