import classNames from 'classnames/bind';
import styles from './Loading.module.scss';

const cx = classNames.bind(styles);

function Loading() {
    return (
        <div className={cx('loading-container')}>
            <div className={cx('spinner')}></div>
            <p>Vui lòng đợi giây lát</p>
        </div>
    );
}

export default Loading;
