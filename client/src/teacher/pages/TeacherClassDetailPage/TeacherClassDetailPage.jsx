import React, { useContext, useEffect } from 'react';
import classNames from 'classnames/bind';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, Empty, Spin } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faGraduationCap,
  faChevronRight,
  faCalendarAlt,
  faClipboardList,
} from '@fortawesome/free-solid-svg-icons';
import { TeacherPageContext } from '@/teacher/contexts/TeacherPageContext';
import { ROUTE_PATHS, buildPath } from '@/config/routes.config';
import teacherApi from '@/api/teacher.api';
import styles from './TeacherClassDetailPage.module.scss';

const cx = classNames.bind(styles);

export default function TeacherClassDetailPage() {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useContext(TeacherPageContext);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Trang chủ', path: ROUTE_PATHS.TEACHER.DASHBOARD },
      { label: 'Lớp chủ nhiệm', path: ROUTE_PATHS.TEACHER.CLASSES },
    ]);
    return () => setBreadcrumbs(null);
  }, [setBreadcrumbs]);

  const { data: classData, isLoading } = useQuery({
    queryKey: ['teacher', 'my-classes'],
    queryFn: teacherApi.getMyClasses,
  });

  const classes = classData?.classes || [];
  const activityCount = classData?.activityCount ?? 0;

  const handleClassClick = (classId) => {
    navigate(buildPath.teacherClassStudents(classId));
  };

  if (isLoading) {
    return (
      <div className={cx('teacher-classes__loading')}>
        <Spin size="large" />
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className={cx('teacher-classes')}>
        <div className={cx('teacher-classes__header')}>
          <h2>Lớp Chủ Nhiệm</h2>
          <p className={cx('teacher-classes__subtitle')}>Danh sách các lớp bạn đang làm chủ nhiệm</p>
        </div>
        <Empty description="Bạn chưa được phân công làm chủ nhiệm lớp nào" />
      </div>
    );
  }

  // Tính toán năm nhập học mới nhất
  const latestEnrollmentYear = Math.max(...classes.map((item) => item.namNhapHoc));

  return (
    <div className={cx('teacher-classes')}>
      <div className={cx('teacher-classes__stats')}>
        <div className={cx('teacher-classes__stat-card')}>
          <div className={cx('teacher-classes__stat-icon', 'teacher-classes__stat-icon--total')}>
            <FontAwesomeIcon icon={faGraduationCap} />
          </div>
          <div className={cx('teacher-classes__stat-content')}>
            <p>Tổng số lớp chủ nhiệm</p>
            <h3>{classes.length}</h3>
          </div>
        </div>
        <div className={cx('teacher-classes__stat-card')}>
          <div className={cx('teacher-classes__stat-icon', 'teacher-classes__stat-icon--total-students')}>
            <FontAwesomeIcon icon={faClipboardList} />
          </div>
          <div className={cx('teacher-classes__stat-content')}>
            <p>Tổng số hoạt động đã tạo</p>
            <h3>{activityCount}</h3>
          </div>
        </div>
        <div className={cx('teacher-classes__stat-card')}>
          <div className={cx('teacher-classes__stat-icon', 'teacher-classes__stat-icon--latest-year')}>
            <FontAwesomeIcon icon={faCalendarAlt} />
          </div>
          <div className={cx('teacher-classes__stat-content')}>
            <p>Năm nhập học mới nhất</p>
            <h3>{latestEnrollmentYear}</h3>
          </div>
        </div>
      </div>

      <div className={cx('teacher-classes__grid')}>
        {classes.map((classItem) => (
          <Card
            key={classItem.id}
            className={cx('teacher-classes__card')}
            hoverable
            onClick={() => handleClassClick(classItem.id)}
          >
            <div className={cx('teacher-classes__card-header')}>
              <div className={cx('teacher-classes__card-icon')}>
                <FontAwesomeIcon icon={faGraduationCap} />
              </div>
              <div className={cx('teacher-classes__card-title')}>
                <h3>{classItem.maLop}</h3>
                <p>{classItem.tenLop}</p>
              </div>
            </div>

            <div className={cx('teacher-classes__card-body')}>
              <div className={cx('teacher-classes__card-info')}>
                <span className={cx('teacher-classes__card-label')}>Khoa:</span>
                <span className={cx('teacher-classes__card-value')}>{classItem.nganhHoc?.khoa?.tenKhoa}</span>
              </div>
              <div className={cx('teacher-classes__card-info')}>
                <span className={cx('teacher-classes__card-label')}>Ngành:</span>
                <span className={cx('teacher-classes__card-value')}>{classItem.nganhHoc?.tenNganh}</span>
              </div>
              <div className={cx('teacher-classes__card-info')}>
                <span className={cx('teacher-classes__card-label')}>Năm nhập học:</span>
                <span className={cx('teacher-classes__card-value')}>{classItem.namNhapHoc}</span>
              </div>
              <div className={cx('teacher-classes__card-info')}>
                <span className={cx('teacher-classes__card-label')}>
                  <FontAwesomeIcon icon={faUsers} /> Sĩ số:
                </span>
                <span className={cx('teacher-classes__card-value', 'teacher-classes__card-value--highlight')}>
                  {classItem.studentCount} sinh viên
                </span>
              </div>
            </div>

            <div className={cx('teacher-classes__card-footer')}>
              <span>Xem danh sách sinh viên</span>
              <FontAwesomeIcon icon={faChevronRight} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
