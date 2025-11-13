import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { Input, Select, Button } from 'antd';
import classNames from 'classnames/bind';
import styles from './AdminSearchBar.module.scss';

const cx = classNames.bind(styles);

const renderControl = (control, size, zone) => {
  if (!control) return null;

  if (React.isValidElement(control)) {
    const element = control;
    const mergedClassName = cx(
      zone === 'filter' ? 'admin-search__control' : 'admin-search__action',
      element.props.className,
    );
    return React.cloneElement(element, {
      className: mergedClassName,
      size: element.props.size ?? size,
    });
  }

  if (typeof control !== 'object') return null;

  const { kind = zone === 'filter' ? 'select' : 'button', props = {}, label, icon, render } = control;

  if (typeof render === 'function') {
    return render({
      size,
      zone,
      className: cx(zone === 'filter' ? 'admin-search__control' : 'admin-search__action'),
    });
  }

  if (kind === 'select') {
    const { className, size: propSize, ...rest } = props;
    return (
      <Select
        {...rest}
        size={propSize ?? size}
        className={cx('admin-search__control', 'admin-search__select', className)}
      />
    );
  }

  if (kind === 'input') {
    const { className, size: propSize, ...rest } = props;
    return <Input {...rest} size={propSize ?? size} className={cx('admin-search__control', className)} />;
  }

  if (kind === 'button') {
    const { className, size: propSize, children, ...rest } = props;
    const content =
      children ?? (
        <>
          {icon ? <span className={cx('admin-search__action-icon')}>{icon}</span> : null}
          {label ? <span>{label}</span> : null}
        </>
      );
    return (
      <Button {...rest} size={propSize ?? size} className={cx('admin-search__action', className)}>
        {content}
      </Button>
    );
  }

  return null;
};

function AdminSearchBar({
  search,
  filters = [],
  actions = [],
  children,
  onSubmit,
  className,
  appearance = 'surface',
  size = 'large',
}) {
  const handleSubmit = useCallback(
    (event) => {
      event?.preventDefault?.();
      onSubmit?.(event);
    },
    [onSubmit],
  );

  const searchInput = (() => {
    if (!search) return null;
    const { className: searchClassName, size: searchSize, onPressEnter, allowClear = true, ...rest } = search;
    const handlePressEnter = (event) => {
      onPressEnter?.(event);
      if (!event.defaultPrevented) {
        onSubmit?.(event);
      }
    };
    return (
      <Input
        {...rest}
        allowClear={allowClear}
        size={searchSize ?? size}
        onPressEnter={handlePressEnter}
        className={cx('admin-search__control', 'admin-search__search', searchClassName)}
      />
    );
  })();

  return (
    <form
      className={cx('admin-search', `admin-search--${appearance}`, className)}
      onSubmit={handleSubmit}
      role="search"
    >
      <div className={cx('admin-search__main')}>
        {searchInput}
        {filters.length ? (
          <div className={cx('admin-search__filters')}>
            {filters.map((filter, index) => {
              const key = filter?.key ?? index;
              const element = renderControl(filter, size, 'filter');
              return element ? (
                <div key={key} className={cx('admin-search__filter')}>
                  {element}
                </div>
              ) : null;
            })}
          </div>
        ) : null}
        {children ? <div className={cx('admin-search__extra')}>{children}</div> : null}
      </div>

      {actions.length ? (
        <div className={cx('admin-search__actions')}>
          {actions.map((action, index) => {
            const key = action?.key ?? index;
            const element = renderControl(action, size, 'action');
            return element ? (
              <div key={key} className={cx('admin-search__action-item')}>
                {element}
              </div>
            ) : null;
          })}
        </div>
      ) : null}
    </form>
  );
}

AdminSearchBar.propTypes = {
  search: PropTypes.object,
  filters: PropTypes.arrayOf(PropTypes.any),
  actions: PropTypes.arrayOf(PropTypes.any),
  children: PropTypes.node,
  onSubmit: PropTypes.func,
  className: PropTypes.string,
  appearance: PropTypes.oneOf(['surface', 'subtle']),
  size: PropTypes.oneOf(['small', 'middle', 'large']),
};

export default AdminSearchBar;
