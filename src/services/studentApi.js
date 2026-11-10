import apiClient from './apiClient';
import { getUserEnrolledCourses } from './courseApi';

const getDashboardStats = async () => {
  const response = await apiClient.get('/user/dashboard');
  const stats = response.data?.stats || response.data || {};
  return {
    enrolled_courses_count: Number(stats.enrolled_courses_count ?? 0),
    completed_courses_count: Number(stats.completed_courses_count ?? 0),
    in_progress_courses_count: Number(stats.in_progress_courses_count ?? 0),
    certificates_count: Number(stats.certificates_count ?? 0),
    active_tickets_count: Number(stats.active_tickets_count ?? 0),
    total_learning_hours: Number(stats.total_learning_hours ?? 0),
  };
};

const getProfile = async () => {
  const response = await apiClient.get('/user/profile');
  return response.data?.user || response.data || null;
};

const updateProfile = async (data) => {
  const payload = {
    full_name: data.full_name?.trim(),
    email: data.email?.trim() || '',
    bio: data.bio?.trim() ?? '',
  };

  if (data.avatar_url?.trim()) {
    payload.avatar_url = data.avatar_url.trim();
  }

  const response = await apiClient.put('/user/profile', payload);
  return response.data;
};

const changePassword = async (data) => {
  const payload = {
    current_password: data.current_password,
    new_password: data.new_password,
  };
  const response = await apiClient.put('/user/password', payload);
  return response.data;
};

export {
  changePassword,
  getDashboardStats,
  getProfile,
  getUserEnrolledCourses,
  updateProfile,
};
