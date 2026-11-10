import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';

import Field from '../../../../components/ui/Field';
import FileInput from '../../../../components/ui/FileInput';
import FilterSelect from '../../../../components/ui/FilterSelect';
import SectionHeader from '../../../../components/ui/SectionHeader';
import Spinner from '../../../../components/ui/Spinner';
import ToggleSwitch from '../../../../components/ui/ToggleSwitch';
import {
  getArticleBySlug,
  getArticles,
  updateArticle,
} from '../../../../services/articleApi';
import { adminArticleSchema } from '../../../../validation/admin.schema';

const statusOptions = [
  { value: 'draft', label: 'پیش‌نویس' },
  { value: 'published', label: 'منتشر شده' },
  { value: 'archived', label: 'آرشیو شده' },
];

const categoryOptions = [
  { value: '', label: 'انتخاب دسته‌بندی' },
  { value: 'python', label: 'پایتون' },
  { value: 'frontend', label: 'فرانت‌اند' },
  { value: 'backend', label: 'بک‌اند' },
  { value: 'design', label: 'طراحی' },
  { value: 'data', label: 'علم داده' },
];

const inputClass =
  'w-full rounded-xl bg-[#E4E9F2] px-12 py-10 text-[11px] text-[#1C2B4A] placeholder-[#8A96B0] shadow-[inset_-2px_-2px_4px_0px_#FFFFFFCC,_inset_2px_2px_5px_0px_#A3B1C666] outline-none transition';

function PanelAdminArticleEdit() {
  const [searchParams] = useSearchParams();
  const slugParam = searchParams.get('slug');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: articlesList, isLoading: listLoading } = useQuery({
    queryKey: ['articles'],
    queryFn: () => getArticles({ limit: 50 }),
    enabled: !slugParam,
  });

  const fallbackSlug =
    slugParam ||
    (Array.isArray(articlesList?.data) && articlesList.data[0]?.slug) ||
    (Array.isArray(articlesList) && articlesList[0]?.slug) ||
    '';

  const { data: articleDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['article', fallbackSlug],
    queryFn: () => getArticleBySlug(fallbackSlug),
    enabled: Boolean(fallbackSlug),
  });

  const articleObj = articleDetail?.data || articleDetail || {};
  const tagsArray = Array.isArray(articleObj.tags) ? articleObj.tags : [];

  const { register, handleSubmit, control, setValue } = useForm({
    resolver: zodResolver(adminArticleSchema),
    values: {
      title: articleObj.title || 'مقاله تخصصی کدکدا',
      slug: articleObj.slug || fallbackSlug || 'article-slug',
      excerpt: articleObj.excerpt || 'خلاصه مقاله آموزشی برنامه‌نویسی.',
      content:
        articleObj.content_markdown ||
        articleObj.content ||
        'متن مقاله آموزشی...',
      category_id: tagsArray[0] || 'frontend',
      status: 'published',
      tags: tagsArray.join(', '),
      is_published: true,
    },
  });

  const watched = useWatch({ control });
  const [slugTouched, setSlugTouched] = useState(true);
  const [coverName, setCoverName] = useState('article-cover.jpg');

  const canSubmit =
    (watched.title || '').trim() !== '' &&
    (watched.slug || '').trim() !== '' &&
    (watched.content || '').trim() !== '';

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

  const updateMutation = useMutation({
    mutationFn: (data) => {
      const parsedTags = (data.tags || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      return updateArticle(articleObj.id || fallbackSlug, {
        title: data.title,
        slug: data.slug,
        content_markdown: data.content,
        tags: parsedTags,
      });
    },
    onSuccess: () => {
      toast.success('تغییرات مقاله با موفقیت ذخیره شد.');
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      navigate('/panel-admin/articles');
    },
    onError: (err) => {
      toast.error(err?.message || 'خطا در بروزرسانی مقاله.');
    },
  });

  const onSubmit = (data) => {
    updateMutation.mutate(data);
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
            ویرایش مقاله
          </h1>
          <p className="pt-8 text-[12px] text-[#8A96B0]">
            شناسه مقاله:{' '}
            <span className="text-primary-600 font-black">
              #{articleObj.id || '—'}
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
          <Field label="عنوان مقاله" required>
            <input
              type="text"
              value={watched.title || ''}
              onChange={handleTitleChange}
              placeholder="عنوان مقاله"
              className={inputClass}
            />
          </Field>
          <Field
            label="اسلاگ (Slug)"
            required
            hint="در URL مقاله استفاده می‌شود"
          >
            <input
              type="text"
              dir="ltr"
              value={watched.slug || ''}
              onChange={(e) => {
                setSlugTouched(true);
                setValue('slug', e.target.value, { shouldValidate: true });
              }}
              placeholder="article-slug"
              className={inputClass}
            />
          </Field>
        </div>
        <Field
          label="خلاصه مقاله"
          className="mt-20"
          hint="حداکثر ۲ خط، در کارت مقاله نمایش داده می‌شود"
        >
          <textarea
            rows={3}
            {...register('excerpt')}
            placeholder="خلاصه‌ای کوتاه از محتوای مقاله..."
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
        <SectionHeader title="محتوای مقاله" />
        <Field
          label="متن مقاله"
          required
          hint="متن اصلی مقاله را وارد کنید (Markdown یا HTML پشتیبانی می‌شود)"
        >
          <textarea
            rows={14}
            {...register('content')}
            placeholder="متن کامل مقاله را اینجا بنویسید..."
            className={`${inputClass} resize-y`}
          />
        </Field>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
        className="mt-20 rounded-2xl bg-[#EDF1F8] p-20 shadow-[-4px_-4px_12px_0px_#FFFFFFE5,_6px_6px_16px_0px_#A3B1C680]"
      >
        <SectionHeader title="تنظیمات و رسانه" />
        <div className="grid grid-cols-1 gap-20 md:grid-cols-2">
          <Field
            label="تصویر کاور"
            hint={
              coverName
                ? 'برای تغییر، فایل جدید انتخاب کنید'
                : 'JPG یا PNG، حداکثر ۲ مگابایت'
            }
          >
            <FileInput
              fileName={coverName}
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setCoverName(f.name);
              }}
            />
          </Field>
          <Field label="دسته‌بندی">
            <FilterSelect
              options={categoryOptions}
              value={watched.category_id || 'frontend'}
              onChange={(v) => setValue('category_id', v)}
            />
          </Field>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-20 md:grid-cols-2">
          <Field label="وضعیت انتشار">
            <FilterSelect
              options={statusOptions}
              value={watched.status || 'published'}
              onChange={(v) => setValue('status', v)}
            />
          </Field>
          <Field label="برچسب‌ها" hint="با کاما جدا کنید">
            <input
              type="text"
              {...register('tags')}
              placeholder="react, performance, frontend"
              className={inputClass}
            />
          </Field>
        </div>

        <div className="mt-20">
          <ToggleSwitch
            checked={Boolean(watched.is_published)}
            onChange={(v) => setValue('is_published', v)}
            label="مقاله منتشر شود"
            description="در صورت خاموش بودن به‌عنوان پیش‌نویس ذخیره می‌شود"
          />
        </div>
      </motion.div>

      <div className="mt-20 flex flex-col-reverse gap-12 sm:flex-row sm:justify-end">
        <Link
          to="/panel-admin/articles"
          className="rounded-xl bg-[#EDF1F8] px-20 py-12 text-center text-[11px] font-bold text-[#8A96B0] shadow-[-3px_-3px_7px_0px_#FFFFFFE5,_4px_4px_10px_0px_#A3B1C673] transition duration-200 hover:text-[#1C2B4A]"
        >
          انصراف
        </Link>
        <button
          type="submit"
          disabled={!canSubmit || updateMutation.isPending}
          className={`to-primary-600 rounded-xl bg-gradient-to-br from-[#1E4D9C] px-20 py-12 text-[11px] font-black text-white shadow-[3px_3px_8px_0px_#193B734D] transition duration-200 ${canSubmit && !updateMutation.isPending ? 'cursor-pointer hover:brightness-110' : 'cursor-not-allowed opacity-50'}`}
        >
          {updateMutation.isPending ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
        </button>
      </div>
    </form>
  );
}

export default PanelAdminArticleEdit;
