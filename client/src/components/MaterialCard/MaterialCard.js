import React from 'react';
import classNames from 'classnames/bind';
import styles from './MaterialCard.module.scss';
import { Link } from 'react-router-dom';

const cx = classNames.bind(styles);

// Using same normalization function as in FilterSubject
const normalizeString = (str) => {
    if (!str) return '';
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
};

function MaterialCard({ data, type = 'document' }) {
    const { id, image, title, subject, facultyName } = data;

    // Don't normalize here - send the original values and let FilterSubject handle normalization
    const displayFacultyName = facultyName || 'Khoa không xác định';
    const displayTitle = title || 'Môn học không xác định';

    // Add console logs to see what's being passed
    console.log('MaterialCard data:', {
        type,
        id,
        title: displayTitle,
        facultyName: displayFacultyName,
    });

    return (
        <div className={cx('wrapper')}>
            <div className={cx('card')}>
                <div className={cx('card-image')}>
                    <img src={image} alt={displayTitle} onError={(e) => (e.target.src = '/images/no-image.jpg')} />
                    {type === 'document' && <span className={cx('label')}>hot</span>}
                    <button className={cx('favorite')}>
                        <img src="/images/Action_Add_favourite.svg" alt="Add to favorite" />
                    </button>
                </div>

                <div className={cx('card-info')}>
                    <Link
                        to={
                            type === 'document'
                                ? `/filterDepartment?course=${encodeURIComponent(displayFacultyName)}`
                                : `/filterSubject?course=${encodeURIComponent(displayFacultyName)}`
                        }
                        className={cx('card-faculty')}
                    >
                        {displayFacultyName}
                    </Link>

                    {type !== 'document' ? (
                        <Link
                            to={
                                type === 'document'
                                    ? `/material/${id}`
                                    : `/filterSubject?keyword=${encodeURIComponent(displayTitle)}`
                            }
                            className={cx('card-title')}
                        >
                            {displayTitle}
                        </Link>
                    ) : (
                        <span
                            to={
                                type === 'document'
                                    ? `/material/${id}`
                                    : `/filterSubject?keyword=${encodeURIComponent(displayTitle)}`
                            }
                            className={cx('card-title')}
                        >
                            {displayTitle}
                        </span>
                    )}

                    {type === 'document' && (
                        <>
                            <div className={cx('card-details')}>
                                <span className={cx('detail-label')}>Môn</span>
                                <Link
                                    to={`/filterDepartment?subject=${encodeURIComponent(
                                        subject?.name || '',
                                    )}&course=${encodeURIComponent(displayFacultyName)}`}
                                    className={cx('detail-value')}
                                >
                                    {subject?.name || ''}
                                </Link>
                            </div>
                            <div className={cx('card-format')}>{data.type}</div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MaterialCard;
