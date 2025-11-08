export const normalizeStringItems = (value) => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === 'string') {
        const trimmed = item.trim();
        return trimmed || null;
      }

      if (item && typeof item === 'object') {
        const candidates = [item.text, item.description, item.content, item.title];
        const text = candidates.find((candidate) => typeof candidate === 'string');
        return text ? text.trim() : null;
      }

      return null;
    })
    .filter(Boolean);
};

export const normalizeGuideItems = (value) => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === 'string') {
        const trimmed = item.trim();
        return trimmed ? { title: null, content: trimmed } : null;
      }

      if (item && typeof item === 'object') {
        const titleCandidate =
          typeof item.title === 'string' ? item.title : typeof item.heading === 'string' ? item.heading : null;

        const contentCandidate =
          typeof item.content === 'string'
            ? item.content
            : typeof item.description === 'string'
              ? item.description
              : typeof item.text === 'string'
                ? item.text
                : null;

        const content = contentCandidate ? contentCandidate.trim() : null;
        if (!content) return null;

        const title = titleCandidate ? titleCandidate.trim() : null;
        return { title, content };
      }

      return null;
    })
    .filter(Boolean);
};

export default {
  normalizeStringItems,
  normalizeGuideItems,
};
