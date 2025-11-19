import React from 'react';
import classNames from 'classnames/bind';
import TeacherNavbar from '../TeacherNavbar/TeacherNavbar';
import styles from './TeacherBodyContent.module.scss';

const cx = classNames.bind(styles);

function TeacherBodyContent({ pageTitle, actions, breadcrumbs, children }) {
  return (
    <main className={cx('teacher-body')}>
      <div className={cx('teacher-body__content')}>
        <TeacherNavbar pageTitle={pageTitle} actions={actions} breadcrumbs={breadcrumbs} />
        {children}
      </div>
    </main>
  );
}

export default TeacherBodyContent;
