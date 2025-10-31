import classNames from 'classnames/bind';
import styles from './Loading.module.scss';

const cx = classNames.bind(styles);

function Loading({ fullscreen = true, message = 'Vui lòng đợi giây lát' }) {
  return (
    <section
      className={cx('loading-page', { 'loading-page--inline': !fullscreen })}
      aria-busy="true"
      aria-live="polite"
    >
      <div className={cx('loading-page__spinner')} role="presentation" />
      <p className={cx('loading-page__message')}>{message}</p>
    </section>
  );
}

export default Loading;
