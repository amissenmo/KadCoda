import apiClient from './apiClient';
import { enToFaDigits, formatToman } from './courseApi';

const formatPersianDate = (isoString) => {
  if (!isoString) return '—';
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(isoString));
  } catch {
    return String(isoString);
  }
};

const getPlatformMetrics = async () => {
  const response = await apiClient.get('/admin/dashboard');
  const metrics = response.data?.metrics || response.data || {};
  return {
    total_users: Number(metrics.total_users ?? 0),
    total_courses: Number(metrics.total_courses ?? 0),
    total_enrollments: Number(metrics.total_enrollments ?? 0),
    total_articles: Number(metrics.total_articles ?? 0),
    open_tickets_count: Number(metrics.open_tickets_count ?? 0),
    total_revenue: Number(metrics.total_revenue ?? 0),
    monthly_stats: Array.isArray(metrics.monthly_stats)
      ? metrics.monthly_stats
      : [],
  };
};

const normalizeAdminUser = (raw) => {
  if (!raw) return null;
  const roleVal = raw.role || 'student';
  let roleLabel = 'دانشجو';
  let roleClass = 'bg-[#DCE5F4] text-[#193B73]';
  let color = 'from-[#1E4D9C] to-primary-600';

  if (roleVal === 'instructor' || roleVal === 'teacher') {
    roleLabel = 'مدرس';
    roleClass = 'bg-[#FFF3DC] text-[#B07D00]';
    color = 'from-[#B07D00] to-[#F7B928]';
  } else if (roleVal === 'admin') {
    roleLabel = 'مدیر';
    roleClass = 'bg-[#FEE2E2] text-[#B91C1C]';
    color = 'from-[#7F1D1D] to-[#EF4444]';
  }

  const name = raw.full_name || raw.name || 'کاربر کدکدا';

  return {
    ...raw,
    id: raw.id,
    name,
    full_name: name,
    email: raw.email || '—',
    rawEmail: raw.email || '',
    role: roleVal,
    roleLabel,
    roleClass,
    mobile: enToFaDigits(raw.mobile || ''),
    rawMobile: raw.mobile || '',
    courses: enToFaDigits(raw.courses_count ?? raw.enrollments?.length ?? 0),
    joined: formatPersianDate(raw.created_at),
    avatar: name.trim().charAt(0) || 'ک',
    color,
    status: raw.status || 'active',
    bio: raw.bio || '',
    is_verified: Boolean(raw.is_verified ?? true),
    has_support_access: Boolean(raw.has_support_access ?? true),
  };
};

const listUsers = async (params = {}) => {
  const response = await apiClient.get('/admin/users', { params });
  const payload = response.data;
  const rawItems = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload)
      ? payload
      : [];

  return {
    items: rawItems.map(normalizeAdminUser),
    page: payload?.page || 1,
    limit: payload?.limit || 20,
    total_items: payload?.total_items ?? rawItems.length,
    total_pages: payload?.total_pages || 1,
  };
};

const updateUser = async (id, data) => {
  const payload = {
    full_name: data.full_name ?? data.name,
    email: data.email,
    mobile: data.mobile,
    role: data.role,
    status: data.status,
    bio: data.bio,
    is_verified: data.is_verified,
    has_support_access: data.has_support_access,
  };
  if (data.password?.trim()) {
    payload.password = data.password.trim();
  }

  const response = await apiClient.put(`/admin/users/${id}`, payload);
  return response.data;
};

const normalizeTransaction = (raw) => {
  if (!raw) return null;
  const rawStatus = raw.status || 'pending';
  let statusLabel = 'در انتظار';
  let statusClass = 'bg-[#FFF3DC] text-[#B07D00]';

  if (rawStatus === 'paid' || rawStatus === 'completed') {
    statusLabel = 'موفق';
    statusClass = 'bg-[#DCFCE7] text-[#15803D]';
  } else if (rawStatus === 'failed' || rawStatus === 'refunded') {
    statusLabel = 'ناموفق';
    statusClass = 'bg-[#FEE2E2] text-[#B91C1C]';
  }

  const numericAmount = Number(
    raw.final_amount ?? raw.total_amount ?? raw.amount ?? 0,
  );

  return {
    ...raw,
    id: raw.tracking_code || raw.gateway_ref_id || raw.id,
    tracking_code: raw.tracking_code || raw.gateway_ref_id || raw.id,
    rawId: raw.id,
    student: raw.user?.full_name || raw.student || 'دانشجوی کدکدا',
    mobile: enToFaDigits(raw.user?.mobile || raw.mobile || '—'),
    rawMobile: raw.user?.mobile || raw.mobile || '—',
    course: raw.course?.title || raw.course || 'دوره آموزشی',
    rawAmount: numericAmount,
    amount: formatToman(numericAmount),
    rawStatus,
    status: statusLabel,
    statusClass,
    date: formatPersianDate(raw.paid_at || raw.created_at),
  };
};

const listTransactions = async (params = {}) => {
  const response = await apiClient.get('/admin/transactions', { params });
  const payload = response.data;
  const rawItems = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload)
      ? payload
      : [];

  const items = rawItems.map(normalizeTransaction);
  const computedTotal = items
    .filter((tx) => tx.rawStatus === 'paid' || tx.rawStatus === 'completed')
    .reduce((acc, tx) => acc + (tx.rawAmount || 0), 0);
  const totalAmount = Number(
    payload?.total_revenue ?? payload?.total_amount ?? computedTotal,
  );

  return {
    items,
    page: payload?.page || 1,
    limit: payload?.limit || 20,
    total_items: payload?.total_items ?? rawItems.length,
    total_pages: payload?.total_pages || 1,
    total_amount: totalAmount,
    total_revenue: totalAmount,
  };
};

const getFinancialReport = async (params = {}) => {
  const response = await apiClient.get('/admin/reports/finance', {
    params: { limit: 200, ...params },
  });
  const payload = response.data;
  const rawItems = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload)
      ? payload
      : [];

  const items = rawItems.map(normalizeTransaction);
  const computedTotal = items
    .filter((tx) => tx.rawStatus === 'paid' || tx.rawStatus === 'completed')
    .reduce((acc, tx) => acc + (tx.rawAmount || 0), 0);
  const totalAmount = Number(
    payload?.total_revenue ?? payload?.total_amount ?? computedTotal,
  );

  return {
    items,
    page: payload?.page || 1,
    limit: payload?.limit || 200,
    total_items: payload?.total_items ?? rawItems.length,
    total_pages: payload?.total_pages || 1,
    total_amount: totalAmount,
    total_revenue: totalAmount,
  };
};

const normalizeDiscount = (raw) => {
  if (!raw) return null;
  const used = Number(raw.used_count ?? raw.used ?? 0);
  const total = Number(raw.max_uses ?? raw.total ?? 100) || 100;
  return {
    ...raw,
    id: raw.id,
    code: raw.code,
    percent: Number(raw.percent ?? 0),
    used,
    total,
    active: Boolean(raw.is_active ?? raw.active ?? true),
    startDate: formatPersianDate(raw.created_at),
    endDate: raw.expires_at ? formatPersianDate(raw.expires_at) : 'بدون انقضا',
  };
};

const listDiscounts = async () => {
  const response = await apiClient.get('/admin/discounts');
  const rawItems = Array.isArray(response.data?.items)
    ? response.data.items
    : Array.isArray(response.data)
      ? response.data
      : [];
  return rawItems.map(normalizeDiscount);
};

const createDiscount = async (data) => {
  const payload = {
    code: String(data.code || '')
      .trim()
      .toUpperCase(),
    percent: Math.min(
      100,
      Math.max(1, Number(data.percent ?? data.amount ?? 10)),
    ),
    max_discount_amount: Number(
      data.max_discount_amount ?? data.max_discount ?? 0,
    ),
    max_uses: Number(data.max_uses ?? data.usage_limit ?? 0),
    expires_at: data.expires_at || data.end_date || '',
    is_active: Boolean(data.is_active ?? true),
  };
  const response = await apiClient.post('/admin/discounts', payload);
  return response.data;
};

export {
  createDiscount,
  formatPersianDate,
  getFinancialReport,
  getPlatformMetrics,
  listDiscounts,
  listTransactions,
  listUsers,
  normalizeAdminUser,
  normalizeDiscount,
  normalizeTransaction,
  updateUser,
};
