import React, { useMemo } from 'react';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faLeaf, faTint, faSeedling, faHandshakeAngle } from '@fortawesome/free-solid-svg-icons';
import Label from '@components/Label/Label';
import { useQuery } from '@tanstack/react-query';
import statsApi, { CATEGORY_QUERY_KEY } from '@api/stats.api';
import styles from './ActivityCategoriesSection.module.scss';

const cx = classNames.bind(styles);

// Preset hiển thị (icon + className) theo mã category.code
const CATEGORY_PRESETS = {
  DIA_CHI_DO: { icon: faHeart, className: 'activity-categories__item--red', description: 'Hoạt động bắt buộc' },
  MUA_HE_XANH: { icon: faLeaf, className: 'activity-categories__item--green', description: 'Bảo vệ môi trường' },
  HIEN_MAU: { icon: faTint, className: 'activity-categories__item--blood', description: 'Cứu người, cứu đời' },
  XUAN_TINH_NGUYEN: {
    icon: faSeedling,
    className: 'activity-categories__item--spring',
    description: 'Hoạt động mùa xuân',
  },
  HO_TRO: { icon: faHandshakeAngle, className: 'activity-categories__item--support', description: 'Hỗ trợ cộng đồng' },
};

// Dữ liệu dự phòng khi API không trả về gì
const FALLBACK_CATEGORIES = [
  { code: 'DIA_CHI_DO', name: 'Địa chỉ đỏ', description: CATEGORY_PRESETS.DIA_CHI_DO.description },
  { code: 'MUA_HE_XANH', name: 'Mùa hè xanh', description: CATEGORY_PRESETS.MUA_HE_XANH.description },
  { code: 'HIEN_MAU', name: 'Hiến máu', description: CATEGORY_PRESETS.HIEN_MAU.description },
  { code: 'XUAN_TINH_NGUYEN', name: 'Xuân tình nguyện', description: CATEGORY_PRESETS.XUAN_TINH_NGUYEN.description },
  { code: 'HO_TRO', name: 'Hỗ trợ', description: CATEGORY_PRESETS.HO_TRO.description },
];

function ActivityCategoriesSection() {
  // Query lấy categories; staleTime để tránh re-fetch quá thường xuyên
  const {
    data: categories,
    isLoading,
    isError,
  } = useQuery({
    queryKey: CATEGORY_QUERY_KEY,
    queryFn: statsApi.getCategories,
    staleTime: 5 * 60 * 1000,
  });

  // Memoize để tránh tính lại UI khi không cần thiết
  const displayCategories = useMemo(() => {
    if (Array.isArray(categories) && categories.length > 0) {
      return categories;
    }
    // Gắn activityCount null để component biết hiển thị "Đang tải..." hoặc "0 hoạt động"
    return FALLBACK_CATEGORIES.map((item) => ({ ...item, activityCount: null }));
  }, [categories]);

  return (
    <>
      {/* Label component tái sử dụng */}
      <Label
        title="Các hạng mục"
        highlight="hoạt động"
        subtitle="Khám phá các loại hoạt động cộng tác xã hội phong phú và đa dạng"
        leftDivider
        rightDivider
        showSubtitle
      />

      <div className={cx('activity-categories')}>
        {/* Thông báo khi fetch lỗi nhưng đã trả về fallback */}
        {isError && !isLoading && <div className={cx('activity-categories__status')}>Không thể tải danh mục.</div>}

        <div className={cx('activity-categories__list')}>
          {displayCategories.map((category) => {
            // Lấy preset theo code, fallback sang HO_TRO nếu không biết code
            const preset = CATEGORY_PRESETS[category.code] || CATEGORY_PRESETS.HO_TRO;
            const count = category.activityCount;
            // Nếu API chưa cung cấp activityCount, hiển thị "Đang tải..." khi loading
            const countLabel =
              typeof count === 'number' ? `${count} hoạt động` : isLoading ? 'Đang tải...' : '0 hoạt động';

            return (
              <div key={category.code} className={cx('activity-categories__item', preset.className)}>
                <div className={cx('activity-categories__icon')}>
                  <FontAwesomeIcon icon={preset.icon} />
                </div>
                <div className={cx('activity-categories__title')}>{category.name}</div>
                <div className={cx('activity-categories__subtitle')}>{category.description || preset.description}</div>
                <div className={cx('activity-categories__count')}>{countLabel}</div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default ActivityCategoriesSection;
