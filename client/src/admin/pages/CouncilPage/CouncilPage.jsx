import { useContext, useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import classNames from 'classnames/bind';
import { Input, Select, Tag } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFilePdf, faFileExcel } from '@fortawesome/free-solid-svg-icons';
import { AdminPageContext } from '@/admin/contexts/AdminPageContext';
import AdminTable from '@/admin/components/AdminTable/AdminTable';
import councilApi, { COUNCIL_QUERY_KEYS } from '@/api/council.api';
import academicsApi, { ACADEMICS_QUERY_KEY } from '@/api/academics.api';
import studentsApi from '@/api/students.api';
import useToast from '@/components/Toast/Toast';
import useDebounce from '@/hooks/useDebounce';
import styles from './CouncilPage.module.scss';

const cx = classNames.bind(styles);
const { Option } = Select;
const PAGE_SIZE = 20;

function CouncilPage() {
  const [filters, setFilters] = useState({ facultyCode: null, search: '', namHocId: null, hocKyId: null });
  const [pagination, setPagination] = useState({ current: 1, pageSize: PAGE_SIZE });
  const { contextHolder, open: openToast } = useToast();
  const { setPageActions } = useContext(AdminPageContext);
  const debouncedSearch = useDebounce(filters.search, 400);

  const { data: facultiesData } = useQuery({
    queryKey: ['faculties'],
    queryFn: studentsApi.getFaculties,
    staleTime: 5 * 60 * 1000,
  });

  const { data: academics } = useQuery({
    queryKey: ACADEMICS_QUERY_KEY,
    queryFn: academicsApi.listSemesters,
    staleTime: 5 * 60 * 1000,
  });

  const queryFilters = useMemo(
    () => ({
      ...filters,
      search: debouncedSearch,
    }),
    [filters, debouncedSearch],
  );

  const { data, isLoading } = useQuery({
    queryKey: COUNCIL_QUERY_KEYS.students(queryFilters),
    queryFn: () => councilApi.getStudents(queryFilters),
  });

  const exportPdfMutation = useMutation({
    mutationFn: () => councilApi.exportPdf(queryFilters),
    onSuccess: () => {
      openToast({ message: 'Xuất PDF thành công!', variant: 'success' });
    },
    onError: (error) => {
      openToast({ message: error.response?.data?.error || 'Không thể xuất PDF.', variant: 'danger' });
    },
  });

  const exportExcelMutation = useMutation({
    mutationFn: () => councilApi.exportExcel(queryFilters),
    onSuccess: () => {
      openToast({ message: 'Xuất Excel thành công!', variant: 'success' });
    },
    onError: (error) => {
      openToast({ message: error.response?.data?.error || 'Không thể xuất Excel.', variant: 'danger' });
    },
  });

  useEffect(() => {
    setPageActions([
      {
        key: 'export-pdf',
        label: 'Xuất PDF',
        icon: <FontAwesomeIcon icon={faFilePdf} />,
        type: 'primary',
        className: 'admin-navbar__btn--primary',
        onClick: () => exportPdfMutation.mutate(),
        loading: exportPdfMutation.isPending,
      },
      {
        key: 'export-excel',
        label: 'Xuất Excel',
        icon: <FontAwesomeIcon icon={faFileExcel} />,
        type: 'primary',
        className: 'admin-navbar__btn--primary',
        onClick: () => exportExcelMutation.mutate(),
        loading: exportExcelMutation.isPending,
      },
    ]);
    return () => setPageActions(null);
  }, [setPageActions, exportPdfMutation, exportExcelMutation]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, [debouncedSearch, filters.facultyCode, filters.namHocId, filters.hocKyId]);

  const students = data?.students ?? [];

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value || null }));
  };

  const columns = useMemo(
    () => [
      {
        title: 'STT',
        key: 'index',
        width: 60,
        align: 'center',
      },
      {
        title: 'MSSV',
        dataIndex: 'studentCode',
        key: 'studentCode',
        width: 110,
      },
      {
        title: 'Họ tên',
        dataIndex: 'fullName',
        key: 'fullName',
        width: 200,
      },
      {
        title: 'Lớp',
        dataIndex: 'classCode',
        key: 'classCode',
        width: 90,
        align: 'center',
      },
      {
        title: 'Điểm N1',
        dataIndex: 'groupOnePoints',
        key: 'groupOnePoints',
        width: 80,
        align: 'center',
      },
      {
        title: 'Tổng điểm N1',
        dataIndex: 'groupOneTotalEffective',
        key: 'groupOneTotalEffective',
        width: 100,
        align: 'center',
      },
      {
        title: 'Kết quả N1',
        dataIndex: 'groupOneResult',
        key: 'groupOneResult',
        width: 120,
        align: 'center',
      },
      {
        title: 'Điểm N2,3',
        dataIndex: 'groupTwoThreePoints',
        key: 'groupTwoThreePoints',
        width: 95,
        align: 'center',
      },
      {
        title: 'Dư N1',
        dataIndex: 'groupOneOverflow',
        key: 'groupOneOverflow',
        width: 75,
        align: 'center',
      },
      {
        title: 'Tổng điểm N2,3',
        dataIndex: 'groupTwoThreeTotalEffective',
        key: 'groupTwoThreeTotalEffective',
        width: 115,
        align: 'center',
      },
      {
        title: 'Kết quả N2,3',
        dataIndex: 'groupTwoThreeResult',
        key: 'groupTwoThreeResult',
        width: 120,
        align: 'center',
      },
      {
        title: 'Kết quả đánh giá',
        dataIndex: 'overallResult',
        key: 'overallResult',
        width: 150,
        align: 'center',
      },
      {
        title: 'Đợt cấp CN',
        dataIndex: 'certificationDate',
        key: 'certificationDate',
        width: 130,
        align: 'center',
      },
    ],
    [],
  );

  const columnRenderers = useMemo(
    () => ({
      index: ({ index }) => (pagination.current - 1) * pagination.pageSize + index + 1,
      groupOneResult: ({ value }) => (
        <Tag
          className={cx(
            'council-page__status-tag',
            value === 'Đạt' ? 'council-page__status-tag--success' : 'council-page__status-tag--error',
          )}
        >
          {value}
        </Tag>
      ),
      groupTwoThreeResult: ({ value }) => (
        <Tag
          className={cx(
            'council-page__status-tag',
            value === 'Đạt' ? 'council-page__status-tag--success' : 'council-page__status-tag--error',
          )}
        >
          {value}
        </Tag>
      ),
      overallResult: ({ value }) => (
        <Tag
          className={cx(
            'council-page__status-tag',
            value === 'Đủ điều kiện' ? 'council-page__status-tag--success' : 'council-page__status-tag--warning',
          )}
        >
          {value}
        </Tag>
      ),
      certificationDate: ({ value }) =>
        value || <Tag className={cx('council-page__status-tag', 'council-page__status-tag--default')}>Chưa cấp CN</Tag>,
    }),
    [pagination],
  );

  const yearOptions = academics?.academicYears ?? [];
  const semesterOptions = academics?.semesters ?? [];
  const facultyOptions = facultiesData ?? [];

  return (
    <div className={cx('council-page')}>
      {contextHolder}

      <div className={cx('council-page__filter-bar')}>
        <Input
          placeholder="Tìm kiếm sinh viên..."
          className={cx('council-page__filter-search')}
          prefix={<FontAwesomeIcon icon={faSearch} />}
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          allowClear
        />
        <Select
          placeholder="Khoa"
          className={cx('council-page__filter-select')}
          value={filters.facultyCode}
          onChange={(value) => handleFilterChange('facultyCode', value)}
          allowClear
        >
          <Option value={null}>Tất cả các khoa</Option>
          {facultyOptions.map((faculty) => (
            <Option key={faculty.maKhoa} value={faculty.maKhoa}>
              {faculty.tenKhoa}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="Năm học"
          className={cx('council-page__filter-select')}
          value={filters.namHocId}
          onChange={(value) => handleFilterChange('namHocId', value)}
          allowClear
        >
          <Option value={null}>Tất cả năm học</Option>
          {yearOptions.map((year) => (
            <Option key={year.id} value={year.id}>
              {year.code}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="Học kỳ"
          className={cx('council-page__filter-select')}
          value={filters.hocKyId}
          onChange={(value) => handleFilterChange('hocKyId', value)}
          allowClear
        >
          <Option value={null}>Tất cả học kỳ</Option>
          {semesterOptions.map((semester) => (
            <Option key={semester.id} value={semester.id}>
              {semester.label}
            </Option>
          ))}
        </Select>
      </div>

      <div className={cx('council-page__content')}>
        <div className={cx('council-page__content-header')}>
          <h3>Kết quả đạt chứng chỉ sinh viên</h3>
          <div className={cx('council-page__stats')}>
            Tổng số: <strong>{students.length}</strong>
            {filters.facultyCode && (
              <span className={cx('council-page__qualified')}>
                {' · '}Đủ điều kiện:{' '}
                <strong>{students.filter((s) => s.overallResult === 'Đủ điều kiện').length}</strong>
              </span>
            )}
          </div>
        </div>
        <AdminTable
          rowKey={(record, index) => `${record.studentCode}-${index}`}
          dataSource={students}
          columns={columns}
          columnRenderers={columnRenderers}
          loading={isLoading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: students.length,
            onChange: (page, pageSize) => {
              setPagination({ current: page, pageSize });
            },
            showSizeChanger: false,
          }}
          className={cx('council-page__table')}
        />
      </div>
    </div>
  );
}

export default CouncilPage;
