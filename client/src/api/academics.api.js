import http from '@utils/http';

export const ACADEMICS_QUERY_KEY = ['academics'];

const academicsApi = {
  async listSemesters() {
    const { data } = await http.get('/academics/semesters');
    return {
      academicYears: data.academicYears ?? [],
      semesters: data.semesters ?? [],
    };
  },

  async listAcademicYears() {
    const { data } = await http.get('/academics/years');
    return data.academicYears ?? [];
  },

  async resolve(date) {
    const { data } = await http.get('/academics/resolve', {
      params: { date },
    });
    return data;
  },
};

export default academicsApi;
