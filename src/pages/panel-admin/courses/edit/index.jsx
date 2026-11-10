import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';

import ChapterCard from '../../../../components/ui/ChapterCard';
import Field from '../../../../components/ui/Field';
import FileInput from '../../../../components/ui/FileInput';
import FilterSelect from '../../../../components/ui/FilterSelect';
import SectionHeader from '../../../../components/ui/SectionHeader';
import Spinner from '../../../../components/ui/Spinner';
import ToggleSwitch from '../../../../components/ui/ToggleSwitch';
import {
  addChapter as addChapterApi,
  getCourseBySlug,
  getCourses,
} from '../../../../services/courseApi';
import { adminCourseCreateSchema } from '../../../../validation/admin.schema';

const levelOptions = [
  { value: '', label: 'انتخاب سطح دوره' },
  { value: 'beginner', label: 'مبتدی' },
  { value: 'intermediate', label: 'متوسط' },
  { value: 'advanced', label: 'پیشرفته' },
];

const statusOptions = [
  { value: 'draft', label: 'پیش‌نویس' },
  { value: 'published', label: 'منتشر شده' },
  { value: 'archived', label: 'آرشیو شده' },
];

const categoryOptions = [
  { value: '', label: 'انتخاب دسته‌بندی' },
  { value: '1', label: 'پایتون' },
  { value: '2', label: 'فرانت‌اند' },
  { value: '3', label: 'بک‌اند' },
  { value: '4', label: 'طراحی' },
  { value: '5', label: 'علم داده' },
];

const teacherOptions = [
  { value: '', label: 'انتخاب مدرس' },
  { value: '1', label: 'مریم احمدی' },
  { value: '2', label: 'داود بهمنی' },
  { value: '3', label: 'سارا محمدی' },
  { value: '4', label: 'علی رضایی' },
];

const inputClass =
  'w-full rounded-xl bg-[#E4E9F2] px-12 py-10 text-[11px] text-[#1C2B4A] placeholder-[#8A96B0] shadow-[inset_-2px_-2px_4px_0px_#FFFFFFCC,_inset_2px_2px_5px_0px_#A3B1C666] outline-none transition';

function PanelAdminCourseEdit() {
  const [searchParams] = useSearchParams();
  const slugParam = searchParams.get('slug');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: coursesList, isLoading: listLoading } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: () => getCourses({ limit: 50 }),
    enabled: !slugParam,
  });

  const fallbackSlug =
    slugParam ||
    (Array.isArray(coursesList?.data) && coursesList.data[0]?.slug) ||
    (Array.isArray(coursesList) && coursesList[0]?.slug) ||
    '';

  const { data: courseDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['course', fallbackSlug],
    queryFn: () => getCourseBySlug(fallbackSlug),
    enabled: Boolean(fallbackSlug),
  });

  const courseObj = courseDetail?.data || courseDetail || {};

  const { register, handleSubmit, control, setValue } = useForm({
    resolver: zodResolver(adminCourseCreateSchema),
    values: {
      title: courseObj.title || 'دوره جامع برنامه‌نویسی',
      slug: courseObj.slug || fallbackSlug || 'course-slug',
      description:
        courseObj.description || 'توضیحات جامع دوره و سرفصل‌های آموزشی.',
      duration: courseObj.duration || '۲۸ ساعت',
      status: courseObj.is_published === false ? 'draft' : 'published',
      level: courseObj.level || 'advanced',
      has_support: true,
      is_active: courseObj.is_published ?? true,
      price: String(courseObj.price ?? 1500000),
      discount_price: '',
      category_id: '2',
      teacher_id: '2',
    },
  });

  const watched = useWatch({ control });
  const [slugTouched, setSlugTouched] = useState(true);
  const [coverImgName, setCoverImgName] = useState(
    courseObj.thumbnail_url || 'course-cover.jpg',
  );
  const [coverVideoName, setCoverVideoName] = useState('course-intro.mp4');
  const [newChapterTitle, setNewChapterTitle] = useState('');

  const chapters = (
    Array.isArray(courseObj.chapters) ? courseObj.chapters : []
  ).map((ch, idx) => ({
    id: ch.id || idx + 1,
    title: ch.title || `فصل ${idx + 1}`,
    sort_order: ch.order_index || idx + 1,
    episodes: (Array.isArray(ch.episodes) ? ch.episodes : []).map(
      (ep, epIdx) => ({
        id: ep.id || epIdx + 1,
        title: ep.title || `جلسه ${epIdx + 1}`,
        duration: ep.duration_seconds
          ? `${Math.max(1, Math.round(ep.duration_seconds / 60))} دقیقه`
          : '۱۰ دقیقه',
        video: ep.video_url || 'video.mp4',
        is_free: Boolean(ep.is_free_preview),
        sort_order: ep.order_index || epIdx + 1,
      }),
    ),
  }));

  const canSubmit =
    (watched.title || '').trim() !== '' &&
    (watched.slug || '').trim() !== '' &&
    (watched.description || '').trim() !== '' &&
    (watched.level || '') !== '' &&
    String(watched.price ?? '').trim() !== '';

  const slugify = (text) =>
    text
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\u0600-\u06FF-]/g, '');

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setValue('title', title, { shouldValidate: true });
    if (!slugTouched) {
      setValue('slug', slugify(title), { shouldValidate: true });
    }
  };

  const addChapterMutation = useMutation({
    mutationFn: (title) =>
      addChapterApi(courseObj.id, {
        title,
        order_index: chapters.length + 1,
      }),
    onSuccess: () => {
      setNewChapterTitle('');
      queryClient.invalidateQueries({ queryKey: ['course', fallbackSlug] });
      toast.success('فصل جدید به دوره اضافه شد.');
    },
    onError: (err) => {
      toast.error(err?.message || 'خطا در افزودن فصل.');
    },
  });

  const handleAddChapter = () => {
    if (!newChapterTitle.trim() || !courseObj.id) return;
    addChapterMutation.mutate(newChapterTitle.trim());
  };

  const onSubmit = () => {
    queryClient.invalidateQueries({ queryKey: ['courses'] });
    queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
    toast.success('تغییرات دوره با موفقیت ذخیره شد.');
    navigate('/panel-admin/courses');
  };

  if (listLoading || detailLoading) {
    return <Spinner />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex flex-col gap-20 rounded-2xl bg-[#EDF1F8] p-20 shadow-[-4px_-4px_12px_0px_#FFFFFFE5,_6px_6px_16px_0px_#A3B1C680] sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="relative text-lg font-black text-[#1C2B4A]">
            ویرایش دوره
          </h1>
          <p className="pt-8 text-[12px] text-[#8A96B0]">
            شناسه دوره:{' '}
            <span className="text-primary-600 font-black">
              #{courseObj.id || '—'}
            </span>
          </p>
        </div>

        <span className="w-fit rounded-full bg-[#FFF3DC] px-14 py-6 text-[10px] font-bold text-[#B07D00] shadow-[inset_-2px_-2px_4px_0px_#FFFFFFCC,_inset_2px_2px_5px_0px_#A3B1C666]">
          حالت ویرایش
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.05, ease: 'easeOut' }}
        className="mt-20 rounded-2xl bg-[#EDF1F8] p-20 shadow-[-4px_-4px_12px_0px_#FFFFFFE5,_6px_6px_16px_0px_#A3B1C680]"
      >
        <SectionHeader title="اطلاعات پایه" />
        <div className="grid grid-cols-1 gap-20 md:grid-cols-2">
          <Field label="عنوان دوره" required>
            <input
              type="text"
              value={watched.title || ''}
              onChange={handleTitleChange}
              placeholder="عنوان دوره"
              className={inputClass}
            />
          </Field>
          <Field
            label="اسلاگ (Slug)"
            required
            hint="در URL دوره استفاده می‌شود"
          >
            <input
              type="text"
              dir="ltr"
              value={watched.slug || ''}
              onChange={(e) => {
                setSlugTouched(true);
                setValue('slug', e.target.value, { shouldValidate: true });
              }}
              placeholder="course-slug"
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="توضیحات" required className="mt-20">
          <textarea
            rows={5}
            {...register('description')}
            placeholder="توضیحات کامل دوره، سرفصل‌ها، مخاطب هدف..."
            className={`${inputClass} resize-none`}
          />
        </Field>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
        className="mt-20 rounded-2xl bg-[#EDF1F8] p-20 shadow-[-4px_-4px_12px_0px_#FFFFFFE5,_6px_6px_16px_0px_#A3B1C680]"
      >
        <SectionHeader title="جزئیات دوره" />
        <div className="grid grid-cols-1 gap-20 md:grid-cols-3">
          <Field label="سطح دوره" required>
            <FilterSelect
              options={levelOptions}
              value={watched.level || 'advanced'}
              onChange={(v) => setValue('level', v)}
            />
          </Field>
          <Field label="مدت زمان">
            <input
              type="text"
              {...register('duration')}
              placeholder="مثلاً ۲۸ ساعت"
              className={inputClass}
            />
          </Field>
          <Field label="وضعیت">
            <FilterSelect
              options={statusOptions}
              value={watched.status || 'published'}
              onChange={(v) => setValue('status', v)}
            />
          </Field>
        </div>
        <div className="mt-20 grid grid-cols-1 gap-20 md:grid-cols-2">
          <Field label="قیمت (تومان)" required>
            <input
              type="number"
              {...register('price')}
              placeholder="۱۲۰۰۰۰۰"
              className={inputClass}
            />
          </Field>
          <Field
            label="قیمت با تخفیف (تومان)"
            hint="در صورت خالی بودن، بدون تخفیف نمایش داده می‌شود"
          >
            <input
              type="number"
              {...register('discount_price')}
              placeholder="۹۸۰۰۰۰"
              className={inputClass}
            />
          </Field>
        </div>
        <div className="mt-20 grid grid-cols-1 gap-20 md:grid-cols-2">
          <Field label="دسته‌بندی">
            <FilterSelect
              options={categoryOptions}
              value={watched.category_id || '2'}
              onChange={(v) => setValue('category_id', v)}
            />
          </Field>
          <Field label="مدرس">
            <FilterSelect
              options={teacherOptions}
              value={watched.teacher_id || '2'}
              onChange={(v) => setValue('teacher_id', v)}
            />
          </Field>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
        className="mt-20 rounded-2xl bg-[#EDF1F8] p-20 shadow-[-4px_-4px_12px_0px_#FFFFFFE5,_6px_6px_16px_0px_#A3B1C680]"
      >
        <SectionHeader title="رسانه و تنظیمات" />
        <div className="grid grid-cols-1 gap-20 md:grid-cols-2">
          <Field
            label="تصویر کاور"
            hint={
              coverImgName
                ? 'برای تغییر، فایل جدید انتخاب کنید'
                : 'JPG یا PNG، حداکثر ۲ مگابایت'
            }
          >
            <FileInput
              fileName={coverImgName}
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setCoverImgName(f.name);
              }}
            />
          </Field>
          <Field
            label="ویدیو کاور"
            hint={
              coverVideoName
                ? 'برای تغییر، فایل جدید انتخاب کنید'
                : 'ویدیوی معرفی کوتاه دوره'
            }
          >
            <FileInput
              fileName={coverVideoName}
              accept="video/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setCoverVideoName(f.name);
              }}
            />
          </Field>
        </div>
        <div className="mt-20 grid grid-cols-1 gap-20 md:grid-cols-2">
          <ToggleSwitch
            checked={Boolean(watched.has_support)}
            onChange={(v) => setValue('has_support', v)}
            label="پشتیبانی دارد"
            description="امکان ارسال تیکت برای دانشجویان"
          />
          <ToggleSwitch
            checked={Boolean(watched.is_active)}
            onChange={(v) => setValue('is_active', v)}
            label="دوره فعال باشد"
            description="در صورت غیرفعال بودن نمایش داده نمی‌شود"
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
        className="mt-20 rounded-2xl bg-[#EDF1F8] p-20 shadow-[-4px_-4px_12px_0px_#FFFFFFE5,_6px_6px_16px_0px_#A3B1C680]"
      >
        <SectionHeader title="محتوای دوره" />

        <div className="flex flex-col gap-12 sm:flex-row">
          <input
            type="text"
            value={newChapterTitle}
            onChange={(e) => setNewChapterTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddChapter();
              }
            }}
            placeholder={`عنوان فصل ${chapters.length + 1}...`}
            className={`${inputClass} flex-1`}
          />
          <button
            type="button"
            onClick={handleAddChapter}
            disabled={!newChapterTitle.trim() || addChapterMutation.isPending}
            className={`to-primary-600 inline-flex items-center justify-center gap-8 rounded-xl bg-gradient-to-br from-[#1E4D9C] px-20 py-10 text-[11px] font-black whitespace-nowrap text-white shadow-[3px_3px_8px_0px_#193B734D] transition duration-200 hover:brightness-110 ${!newChapterTitle.trim() ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-16 w-16"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            افزودن فصل
          </button>
        </div>
        <p className="mt-8 text-[10px] text-[#8A96B0]">
          ترتیب فصل به‌صورت خودکار تعیین می‌شود (فصل {chapters.length + 1})
        </p>
      </motion.div>

      {chapters.length > 0 && (
        <div className="mt-20 flex flex-col gap-20">
          {chapters.map((chapter, idx) => (
            <ChapterCard key={chapter.id} chapter={chapter} index={idx} />
          ))}
        </div>
      )}

      <div className="mt-20 flex flex-col-reverse gap-12 sm:flex-row sm:justify-end">
        <Link
          to="/panel-admin/courses"
          className="rounded-xl bg-[#EDF1F8] px-20 py-12 text-center text-[11px] font-bold text-[#8A96B0] shadow-[-3px_-3px_7px_0px_#FFFFFFE5,_4px_4px_10px_0px_#A3B1C673] transition duration-200 hover:text-[#1C2B4A]"
        >
          انصراف
        </Link>
        <button
          type="submit"
          disabled={!canSubmit}
          className={`to-primary-600 rounded-xl bg-gradient-to-br from-[#1E4D9C] px-20 py-12 text-[11px] font-black text-white shadow-[3px_3px_8px_0px_#193B734D] transition duration-200 ${canSubmit ? 'cursor-pointer hover:brightness-110' : 'cursor-not-allowed opacity-50'}`}
        >
          ذخیره تغییرات
        </button>
      </div>
    </form>
  );
}

export default PanelAdminCourseEdit;
