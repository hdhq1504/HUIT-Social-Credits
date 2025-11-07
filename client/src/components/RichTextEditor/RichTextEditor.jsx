import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import styles from './RichTextEditor.module.scss';

const cx = classNames.bind(styles);

const toolbarOptions = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ align: [] }],
  ['link', 'image'],
  ['clean'],
];

function RichTextEditor({ value, onChange, placeholder, className, readOnly }) {
  const modules = useMemo(
    () => ({
      toolbar: toolbarOptions,
    }),
    [],
  );

  const formats = useMemo(
    () => ['header', 'bold', 'italic', 'underline', 'strike', 'list', 'bullet', 'align', 'link', 'image'],
    [],
  );

  return (
    <div className={cx('editor', className, { 'editor--readonly': readOnly })}>
      <ReactQuill
        theme="snow"
        value={value || ''}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={readOnly}
      />
    </div>
  );
}

RichTextEditor.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  readOnly: PropTypes.bool,
};

RichTextEditor.defaultProps = {
  value: '',
  onChange: () => {},
  placeholder: '',
  className: '',
  readOnly: false,
};

export default RichTextEditor;
