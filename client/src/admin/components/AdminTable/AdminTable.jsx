import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Table } from 'antd';
import classNames from 'classnames/bind';
import styles from './AdminTable.module.scss';

const cx = classNames.bind(styles);

const columnKey = (column = {}) =>
  column.key ?? (Array.isArray(column.dataIndex) ? column.dataIndex.join('.') : column.dataIndex);

function AdminTable({ columns, dataSource, columnRenderers, className, wrapperClassName, sortIcon, ...tableProps }) {
  const enhancedColumns = useMemo(
    () =>
      columns.map((column) => {
        const key = columnKey(column);
        const normalizedColumn = { ...column };
        const renderer = column.render || (key && columnRenderers?.[key]);

        if (renderer) {
          normalizedColumn.render = (value, record, index) =>
            renderer({ value, record, index, column: normalizedColumn, columnKey: key });
        }

        if (!normalizedColumn.sortIcon && typeof sortIcon === 'function') {
          normalizedColumn.sortIcon = (config) => sortIcon({ ...config, column: normalizedColumn });
        }

        return normalizedColumn;
      }),
    [columns, columnRenderers, sortIcon],
  );

  return (
    <div className={cx('admin-table', wrapperClassName)}>
      <Table
        className={cx('admin-table__table', className)}
        columns={enhancedColumns}
        dataSource={dataSource}
        {...tableProps}
      />
    </div>
  );
}

AdminTable.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.object).isRequired,
  dataSource: PropTypes.arrayOf(PropTypes.object),
  columnRenderers: PropTypes.object,
  className: PropTypes.string,
  wrapperClassName: PropTypes.string,
  sortIcon: PropTypes.func,
};

AdminTable.defaultProps = {
  dataSource: [],
  columnRenderers: undefined,
  className: undefined,
  wrapperClassName: undefined,
  sortIcon: undefined,
};

export default AdminTable;
