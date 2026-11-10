import apiClient from './apiClient';
import { enToFaDigits } from './courseApi';

const DEFAULT_UUID = '00000000-0000-0000-0000-000000000001';

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

const normalizeArticle = (raw) => {
  if (!raw) return null;
  const rawStatus = raw.status || 'published';
  let statusLabel = 'منتشر شده';
  let statusClass = 'bg-[#DCFCE7] text-[#15803D]';

  if (rawStatus === 'draft') {
    statusLabel = 'پیش‌نویس';
    statusClass = 'bg-[#FFF3DC] text-[#B07D00]';
  } else if (rawStatus === 'archived') {
    statusLabel = 'آرشیو شده';
    statusClass = 'bg-[#ECEFF4] text-[#8A96B0]';
  }

  const readMinutes = Number(raw.read_time_minutes ?? 8);

  return {
    ...raw,
    id: raw.id,
    title: raw.title,
    slug: raw.slug,
    excerpt: raw.excerpt || '',
    content: raw.content_markdown || raw.content || '',
    content_markdown: raw.content_markdown || raw.content || '',
    author: raw.author?.full_name || raw.author_name || 'تیم تحریریه کدکدا',
    category: raw.category?.name || raw.category_name || 'آموزشی',
    categoryClass: 'bg-[#DCE5F4] text-[#193B73]',
    rawStatus,
    status: statusLabel,
    statusClass,
    views: enToFaDigits((raw.views_count ?? 0).toLocaleString('en-US')),
    date: formatPersianDate(raw.published_at || raw.created_at),
    readTime: `${enToFaDigits(readMinutes)} دقیقه`,
    gradient: 'from-[#1E4D9C] to-primary-600',
  };
};

const getArticles = async (params = {}) => {
  const response = await apiClient.get('/articles', { params });
  const payload = response.data;
  const rawItems = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload)
      ? payload
      : [];

  return {
    items: rawItems.map(normalizeArticle),
    page: payload?.page || 1,
    limit: payload?.limit || 10,
    total_items: payload?.total_items ?? rawItems.length,
    total_pages: payload?.total_pages || 1,
  };
};

const getArticleBySlug = async (slug) => {
  const response = await apiClient.get(`/articles/${slug}`);
  const raw = response.data?.article || response.data;
  return normalizeArticle(raw);
};

const isValidUUID = (val) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    String(val || '').trim(),
  );

const createArticle = async (data) => {
  const tagsArray = Array.isArray(data.tags)
    ? data.tags
    : String(data.tags || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

  const payload = {
    author_id: isValidUUID(data.author_id) ? data.author_id : DEFAULT_UUID,
    category_id: isValidUUID(data.category_id)
      ? data.category_id
      : DEFAULT_UUID,
    title: data.title?.trim(),
    slug: data.slug?.trim(),
    excerpt: data.excerpt?.trim() || '',
    content_markdown: (data.content_markdown || data.content || '').trim(),
    read_time_minutes: Math.max(1, Number(data.read_time_minutes || 8)),
    status: data.is_published === false ? 'draft' : data.status || 'published',
    tags: tagsArray,
  };

  if (data.cover_url?.trim()) {
    payload.cover_url = data.cover_url.trim();
  }

  const response = await apiClient.post('/admin/articles', payload);
  return response.data;
};

const updateArticle = async (id, data) => {
  const tagsArray = Array.isArray(data.tags)
    ? data.tags
    : String(data.tags || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

  const payload = {
    title: data.title?.trim(),
    slug: data.slug?.trim(),
    excerpt: data.excerpt?.trim(),
    content_markdown: (data.content_markdown || data.content || '').trim(),
    status: data.is_published === false ? 'draft' : data.status || 'published',
    tags: tagsArray,
  };

  if (isValidUUID(data.category_id)) {
    payload.category_id = data.category_id;
  }

  const response = await apiClient.put(`/admin/articles/${id}`, payload);
  return response.data;
};

export {
  createArticle,
  getArticleBySlug,
  getArticles,
  normalizeArticle,
  updateArticle,
};
