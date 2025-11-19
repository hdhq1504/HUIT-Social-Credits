import { createContext } from 'react';

export const TeacherPageContext = createContext({
  setPageActions: () => {},
  setBreadcrumbs: () => {},
});
