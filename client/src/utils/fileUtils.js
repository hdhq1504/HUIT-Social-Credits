// utils/fileUtils.js
export const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)}MB`;
};

export const getFileIcon = (fileName) => {
    if (!fileName) return '/images/file-icon.svg';

    const extension = fileName.split('.').pop().toLowerCase();
    if (extension === 'pdf') {
        return '/images/pdf-icon.svg';
    } else if (['doc', 'docx'].includes(extension)) {
        return '/images/doc-icon.svg';
    } else if (['xls', 'xlsx'].includes(extension)) {
        return '/images/excel-icon.svg';
    }
    return '/images/file-icon.svg';
};
