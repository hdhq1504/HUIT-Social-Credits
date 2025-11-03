import React from 'react';
import { CheckCircle, UserPlus, PlusCircle } from 'lucide-react';

export const chartData = {
  2022: [
    { name: 'T1', group1: 5, group2: 3 },
    { name: 'T2', group1: 8, group2: 6 },
    { name: 'T3', group1: 12, group2: 9 },
    { name: 'T4', group1: 14, group2: 11 },
    { name: 'T5', group1: 18, group2: 14 },
    { name: 'T6', group1: 20, group2: 15 },
    { name: 'T7', group1: 25, group2: 19 },
    { name: 'T8', group1: 26, group2: 18 },
    { name: 'T9', group1: 23, group2: 17 },
    { name: 'T10', group1: 20, group2: 14 },
    { name: 'T11', group1: 15, group2: 10 },
    { name: 'T12', group1: 12, group2: 8 },
  ],
  2023: [
    { name: 'T1', group1: 7, group2: 5 },
    { name: 'T2', group1: 10, group2: 7 },
    { name: 'T3', group1: 14, group2: 10 },
    { name: 'T4', group1: 18, group2: 13 },
    { name: 'T5', group1: 21, group2: 16 },
    { name: 'T6', group1: 23, group2: 17 },
    { name: 'T7', group1: 27, group2: 20 },
    { name: 'T8', group1: 28, group2: 22 },
    { name: 'T9', group1: 24, group2: 18 },
    { name: 'T10', group1: 19, group2: 15 },
    { name: 'T11', group1: 16, group2: 12 },
    { name: 'T12', group1: 13, group2: 9 },
  ],
};

export const recentActivities = [
  {
    icon: <CheckCircle color="#0b8b4b" size={18} />,
    title: 'Hoạt động "Hiến máu nhân đạo"',
    desc: '120 sinh viên đã tham gia thành công.',
    time: '2 giờ trước',
  },
  {
    icon: <UserPlus color="#f7931e" size={18} />,
    title: '45 sinh viên mới đăng ký tham gia',
    desc: 'Hoạt động "Dọn dẹp môi trường" có thêm 45 sinh viên đăng ký.',
    time: '4 giờ trước',
  },
  {
    icon: <PlusCircle color="#ff5200" size={18} />,
    title: 'Tạo hoạt động mới "Hội thảo kỹ năng mềm"',
    desc: 'Khoa CNTT tạo hoạt động mới với sức chứa 200 người.',
    time: '8 giờ trước',
  },
];

// Dữ liệu cho khối 'Hoạt động sắp diễn ra' (Upcoming Activities)
export const upcomingEvents = [
  {
    title: 'Hiến máu nhân đạo',
    location: 'Khoa Y - Hội trường A',
    date: '15/12/2023',
    participants: 120,
  },
  {
    title: 'Dọn dẹp môi trường',
    location: 'Câu lạc bộ Xanh - Công viên trung tâm',
    date: '18/12/2023',
    participants: 85,
  },
  {
    title: 'Tình nguyện mùa đông',
    location: 'Đoàn thanh niên - Vùng cao Sapa',
    date: '22/12/2023',
    participants: 45,
  },
];

// Dữ liệu cho khối 'Phản hồi chờ xử lý' (Pending Feedback)
export const pendingFeedback = [
  {
    name: 'Nguyễn Văn D',
    avatar: 'https://i.pravatar.cc/100?img=12',
    message: 'Thắc mắc về điểm số hoạt động hiến máu',
    time: '2 giờ trước',
  },
  {
    name: 'Trần Thị E',
    avatar: 'https://i.pravatar.cc/100?img=32',
    message: 'Yêu cầu xác nhận tham gia hoạt động tình nguyện',
    time: '5 giờ trước',
  },
  {
    name: 'Lê Minh Khoa',
    avatar: 'https://i.pravatar.cc/100?img=47',
    message: 'Phản hồi về lịch tham gia hoạt động môi trường',
    time: '8 giờ trước',
  },
  {
    name: 'Phạm Quỳnh Anh',
    avatar: 'https://i.pravatar.cc/100?img=65',
    message: 'Thắc mắc về minh chứng điểm rèn luyện',
    time: '1 ngày trước',
  },
];
