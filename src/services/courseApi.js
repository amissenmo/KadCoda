import apiClient from './apiClient';

const enToFaDigits = (str) =>
  String(str).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);

const faToEnDigits = (str) =>
  String(str)
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));

const parseNumericPrice = (val) => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const cleaned = faToEnDigits(String(val)).replace(/[^\d]/g, '');
  return Number(cleaned) || 0;
};

const formatToman = (num) => {
  const safe = Number(num) || 0;
  return enToFaDigits(safe.toLocaleString('en-US'));
};

const DEFAULT_INSTRUCTOR = {
  initial: 'ام',
  name: 'امیرحسین مرادی',
  role: 'توسعه‌دهنده ارشد بک‌اند و مشاور پیاده‌سازی سیستم‌های هوش مصنوعی',
  bio: '"من معتقدم برنامه‌نویسی یک مهارت تئوریک نیست؛ بلکه یک هنر برای حل مشکلات واقعی دنیاست..."',
  highlights: [
    {
      id: 'exp',
      label: 'سابقه توسعه',
      value: '+۷ سال تخصصی',
      icon: 'briefcase',
    },
    {
      id: 'students',
      label: 'دانشجویان آکادمی',
      value: '+۳,۰۰۰ نفر',
      icon: 'academic',
    },
  ],
};

const DEFAULT_REQUIREMENTS = {
  title: 'برای این دوره به چه چیزهایی نیاز دارید؟',
  description:
    'این دوره از سطح صفر مطلق شروع می‌شود؛ یعنی هیچ نیازی به داشتن پیش‌زمینه قبلی در برنامه‌نویسی یا مهندسی کامپیوتر ندارید. تنها ملزومات شما عبارتند از:',
  items: [
    'یک سیستم کامپیوتری معمولی (ویندوز، مک یا لینوکس)',
    'آشنایی اولیه با کارکرد عمومی کامپیوتر و اینترنت',
    'اشتیاق به حل چالش‌ها و پشتکار مستمر',
  ],
};

const DEFAULT_TABS = [
  { id: 'curriculum', label: 'سرفصل ها' },
  { id: 'about-instructor', label: 'درباره مدرس' },
  { id: 'requirements', label: 'پیش‌نیازها' },
  { id: 'License', label: 'لایسنس دوره' },
];

const DEFAULT_PURCHASE_FEATURES = [
  'دسترسی دائمی به کل محتوا بدون محدودیت زمانی',
  'پشتیبانی تلگرامی و تیکتی مستقیم با خود مدرس',
  'دریافت گواهی پایان دوره رسمی کد کدا',
];

const normalizeCourse = (raw) => {
  if (!raw) return null;

  const originalPriceNum = parseNumericPrice(
    raw.original_price ?? raw.pricing?.originalPrice ?? raw.price,
  );
  const finalPriceNum = parseNumericPrice(
    raw.final_price ?? raw.pricing?.finalPrice ?? raw.price,
  );
  const effectiveFinal = finalPriceNum || originalPriceNum;

  const discountPercent =
    originalPriceNum > effectiveFinal && originalPriceNum > 0
      ? Math.round(
          ((originalPriceNum - effectiveFinal) / originalPriceNum) * 100,
        )
      : 0;

  const hours = raw.total_hours ?? raw.hours ?? 0;
  const studentsCount = raw.students_count ?? 210;

  const chaptersSource = Array.isArray(raw.chapters)
    ? raw.chapters
    : Array.isArray(raw.curriculum)
      ? raw.curriculum
      : [];

  const curriculum = chaptersSource.map((ch, idx) => {
    const episodes = Array.isArray(ch.episodes)
      ? ch.episodes
      : Array.isArray(ch.lessons)
        ? ch.lessons
        : [];
    const indexStr = ch.index || enToFaDigits(String(idx + 1).padStart(2, '0'));
    const meta =
      ch.meta || `${enToFaDigits(episodes.length)} جلسه • ویدیویی باکیفیت`;

    return {
      id: ch.id || idx + 1,
      index: indexStr,
      title: ch.title,
      meta,
      lessons: episodes.map((ep, epIdx) => ({
        id: ep.id || epIdx + 1,
        title: ep.title,
        duration: ep.duration || '۱۵:۰۰',
        video_url: ep.video_url || '',
        is_free: Boolean(ep.is_free),
      })),
    };
  });

  const instructorObj = raw.instructor
    ? {
        initial:
          raw.instructor.initial ||
          (raw.instructor.full_name || raw.instructor.name || 'کد')
            .slice(0, 2)
            .trim(),
        name:
          raw.instructor.full_name ||
          raw.instructor.name ||
          DEFAULT_INSTRUCTOR.name,
        role: raw.instructor.role || DEFAULT_INSTRUCTOR.role,
        bio: raw.instructor.bio || DEFAULT_INSTRUCTOR.bio,
        highlights: Array.isArray(raw.instructor.highlights)
          ? raw.instructor.highlights
          : DEFAULT_INSTRUCTOR.highlights,
      }
    : DEFAULT_INSTRUCTOR;

  const prerequisiteItems = Array.isArray(raw.prerequisites)
    ? raw.prerequisites
    : Array.isArray(raw.requirements?.items)
      ? raw.requirements.items
      : DEFAULT_REQUIREMENTS.items;

  const highlightsList =
    Array.isArray(raw.highlights) && raw.highlights.length > 0
      ? raw.highlights
      : [
          'پروژه‌محور و متناسب با نیاز بازار کار',
          'دسترسی دائمی به به‌روزرسانی‌ها',
          'پشتیبانی مستقیم با مدرس',
          'مناسب برای ورود به بازار کار',
        ];

  const licenseKey = raw.license_key ?? raw.licenseKey ?? '';
  const isPurchased = Boolean(
    raw.is_purchased ?? raw.isPurchased ?? licenseKey,
  );

  return {
    ...raw,
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    description: raw.description,
    course_type: raw.course_type || (raw.isPresential ? 'online' : 'offline'),
    image: raw.cover_url || raw.image || '/images/react.png',
    cover_url: raw.cover_url || raw.image || '/images/react.png',
    hours,
    total_hours: hours,
    original_price: originalPriceNum,
    final_price: effectiveFinal,
    price:
      effectiveFinal > 0
        ? `${formatToman(effectiveFinal)} تومان`
        : raw.price || 'رایگان',
    isPurchased,
    is_purchased: isPurchased,
    licenseKey,
    license_key: licenseKey,
    highlights: highlightsList,
    prerequisites: prerequisiteItems,
    stats: Array.isArray(raw.stats)
      ? raw.stats
      : [
          {
            id: 'status',
            label: 'وضعیت دوره',
            value: 'تکمیل شده / آماده مشاهده',
            indicator: { type: 'dot', className: 'bg-[#22C55E]' },
          },
          {
            id: 'duration',
            label: 'مدت زمان دوره',
            value: `${enToFaDigits(hours)} ساعت خالص`,
            indicator: { type: 'icon', name: 'clock' },
          },
          {
            id: 'students',
            label: 'تعداد ثبت‌نامی‌ها',
            value: `${enToFaDigits(studentsCount)} دانشجو`,
            indicator: { type: 'badge', content: 'محبوب' },
          },
          {
            id: 'access',
            label: 'روش مشاهده',
            value: 'اسپات‌پلیر / دانلودی',
            indicator: { type: 'icon', name: 'computer' },
          },
          {
            id: 'updated',
            label: 'بروزرسانی',
            value: 'آبان ۱۴۰۴',
            indicator: { type: 'icon', name: 'calendar' },
          },
          {
            id: 'rating',
            label: 'امتیاز دوره',
            value: '۵ از ۵ (ارزشمند)',
            indicator: { type: 'rating', content: '⭐⭐⭐⭐⭐' },
          },
        ],
    pricing: {
      originalPrice: `${formatToman(originalPriceNum || effectiveFinal)} تومان`,
      discountLabel:
        discountPercent > 0
          ? `${enToFaDigits(discountPercent)}٪ تخفیف ویژه`
          : raw.pricing?.discountLabel || null,
      finalPrice: formatToman(effectiveFinal),
      currency: 'تومان',
    },
    purchaseFeatures: raw.purchaseFeatures || DEFAULT_PURCHASE_FEATURES,
    curriculum,
    chapters: chaptersSource,
    instructor: instructorObj,
    requirements: {
      title: raw.requirements?.title || DEFAULT_REQUIREMENTS.title,
      description:
        raw.requirements?.description || DEFAULT_REQUIREMENTS.description,
      items: prerequisiteItems,
    },
    tabs: raw.tabs || DEFAULT_TABS,
  };
};

const getCourses = async (params = {}) => {
  const response = await apiClient.get('/courses', { params });
  const payload = response.data;
  const rawItems = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload)
      ? payload
      : [];

  return {
    items: rawItems.map(normalizeCourse),
    page: payload?.page || 1,
    limit: payload?.limit || rawItems.length || 12,
    total_items: payload?.total_items ?? rawItems.length,
    total_pages: payload?.total_pages || 1,
  };
};

const getCourseBySlug = async (slug) => {
  const response = await apiClient.get(`/courses/${slug}`);
  const rawCourse = response.data?.course || response.data;
  return normalizeCourse(rawCourse);
};

const getUserEnrolledCourses = async () => {
  const response = await apiClient.get('/user/courses');
  return response.data?.items || [];
};

const DEFAULT_REFERENCE_UUID = '00000000-0000-0000-0000-000000000001';
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const createCourse = async (data) => {
  const originalPrice = parseNumericPrice(
    data.original_price ?? data.price ?? 0,
  );
  const discountPrice = parseNumericPrice(
    data.final_price ?? data.discount_price ?? 0,
  );
  const finalPrice = discountPrice > 0 ? discountPrice : originalPrice;
  const hoursNum = parseNumericPrice(data.total_hours ?? data.duration ?? 20);

  const instructorId = UUID_PATTERN.test(
    String(data.instructor_id || data.teacher_id || '').trim(),
  )
    ? String(data.instructor_id || data.teacher_id).trim()
    : DEFAULT_REFERENCE_UUID;

  const categoryId = UUID_PATTERN.test(String(data.category_id || '').trim())
    ? String(data.category_id).trim()
    : DEFAULT_REFERENCE_UUID;

  const payload = {
    instructor_id: instructorId,
    category_id: categoryId,
    title: data.title?.trim(),
    slug: data.slug?.trim(),
    description: data.description?.trim(),
    course_type: data.course_type || 'offline',
    original_price: originalPrice,
    final_price: finalPrice,
    total_hours: hoursNum,
    status: data.is_active === false ? 'draft' : data.status || 'published',
    prerequisites: Array.isArray(data.prerequisites) ? data.prerequisites : [],
    highlights: Array.isArray(data.highlights) ? data.highlights : [],
  };

  if (data.cover_url?.trim()) {
    payload.cover_url = data.cover_url.trim();
  }
  if (data.preview_video_url?.trim()) {
    payload.preview_video_url = data.preview_video_url.trim();
  }

  const response = await apiClient.post('/admin/courses', payload);
  return response.data;
};

const addChapter = async (courseId, data) => {
  const payload = {
    title: data.title?.trim(),
    sort_order: Number(data.sort_order ?? 1),
  };
  const response = await apiClient.post(
    `/admin/courses/${courseId}/chapters`,
    payload,
  );
  return response.data;
};

const addEpisode = async (chapterId, data) => {
  const videoUrl =
    data.video_url?.trim() ||
    (typeof data.video === 'string' && data.video.startsWith('http')
      ? data.video
      : 'https://cdn.kadcoda.ir/videos/sample-episode.mp4');

  const payload = {
    title: data.title?.trim(),
    duration: data.duration?.trim() || '۱۵ دقیقه',
    video_url: videoUrl,
    is_free: Boolean(data.is_free),
    sort_order: Number(data.sort_order ?? 1),
  };
  const response = await apiClient.post(
    `/admin/chapters/${chapterId}/episodes`,
    payload,
  );
  return response.data;
};

export {
  addChapter,
  addEpisode,
  createCourse,
  enToFaDigits,
  faToEnDigits,
  formatToman,
  getCourseBySlug,
  getCourses,
  getUserEnrolledCourses,
  normalizeCourse,
  parseNumericPrice,
};
