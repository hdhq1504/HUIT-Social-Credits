import DOMPurify from 'dompurify';

export const sanitizeHtml = (value) => {
  if (typeof value !== 'string') return '';
  return DOMPurify.sanitize(value, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target', 'rel', 'style', 'class'],
  });
};

export default sanitizeHtml;
