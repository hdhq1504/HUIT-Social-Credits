import classNames from 'classnames/bind';
import styles from './Loading.module.scss';

const cx = classNames.bind(styles);

function Loading() {
  return (
    <section className={cx('loading-page')} aria-busy="true" aria-live="polite">
      <div className={cx('loading-page__spinner')} role="presentation" />
      <p className={cx('loading-page__message')}>Vui lòng đợi giây lát</p>
    </section>
  );
}

export default Loading;
