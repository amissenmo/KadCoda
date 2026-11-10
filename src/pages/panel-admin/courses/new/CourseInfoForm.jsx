import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { useForm, useWatch } from 'react-hook-form';
import { Link } from 'react-router';

import Field from '../../../../components/ui/Field';
import FileInput from '../../../../components/ui/FileInput';
import FilterSelect from '../../../../components/ui/FilterSelect';
import SectionHeader from '../../../../components/ui/SectionHeader';
import ToggleSwitch from '../../../../components/ui/ToggleSwitch';
import { adminCourseCreateSchema } from '../../../../validation/admin.schema';
import {
  categoryOptions,
  inputClass,
  levelOptions,
  slugify,
  statusOptions,
  teacherOptions,
} from './constants';

function CourseInfoForm({ onSubmit, isSubmitting = false }) {
  const [slugTouched, setSlugTouched] = useState(false);
  const [coverImgName, setCoverImgName] = useState('');
  const [coverVideoName, setCoverVideoName] = useState('');

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(adminCourseCreateSchema),
    defaultValues: {
      title: '',
      slug: '',
      description: '',
      duration: '',
      status: 'published',
      level: 'beginner',
      has_support: true,
      is_active: true,
      price: '',
      discount_price: '',
      category_id: '',
      teacher_id: '',
    },
  });

  const watched = useWatch({ control });

  const canSubmit =
    (watched.title || '').trim() !== '' &&
    (watched.slug || '').trim() !== '' &&
    (watched.description || '').trim() !== '' &&
    (watched.level || '') !== '' &&
    String(watched.price ?? '').trim() !== '';

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setValue('title', title, { shouldValidate: true });
    if (!slugTouched) {
      setValue('slug', slugify(title), { shouldValidate: true });
    }
  };

  const onValidSubmit = (data) => {
    onSubmit?.({
      ...data,
      cover_img_name: coverImgName,
      cover_video_name: coverVideoName,
    });
  };

  return (
    <form onSubmit={handleSubmit(onValidSubmit)}>
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="rounded-2xl bg-[#EDF1F8] p-20 shadow-[-4px_-4px_12px_0px_#FFFFFFE5,_6px_6px_16px_0px_#A3B1C680]"
      >
        <h1 className="relative text-lg font-black text-[#1C2B4A]">
          ساخت دوره جدید
          <span className="bg-secondary-300 absolute top-2 -left-10 h-16 w-4 rounded-full shadow-[0px_0px_6px_0px_#F7B928AA]"></span>
        </h1>
        <p className="pt-8 text-[12px] text-[#8A96B0]">
          اطلاعات دوره را وارد کنید و در مرحله بعد محتوای آن را بسازید
        </p>
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
              placeholder="مثلاً دوره جامع پایتون"
              className={inputClass}
            />
            {errors.title && (
              <span className="text-[10px] font-bold text-red-500">
                {errors.title.message}
              </span>
            )}
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
              placeholder="python-complete-course"
              className={inputClass}
            />
            {errors.slug && (
              <span className="text-[10px] font-bold text-red-500">
                {errors.slug.message}
              </span>
            )}
          </Field>
        </div>
        <Field label="توضیحات" required className="mt-20">
          <textarea
            rows={5}
            {...register('description')}
            placeholder="توضیحات کامل دوره، سرفصل‌ها، مخاطب هدف..."
            className={`${inputClass} resize-none`}
          />
          {errors.description && (
            <span className="text-[10px] font-bold text-red-500">
              {errors.description.message}
            </span>
          )}
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
              value={watched.level || 'beginner'}
              onChange={(v) => setValue('level', v, { shouldValidate: true })}
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
              onChange={(v) => setValue('status', v, { shouldValidate: true })}
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
            {errors.price && (
              <span className="text-[10px] font-bold text-red-500">
                {errors.price.message}
              </span>
            )}
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
              value={watched.category_id || ''}
              onChange={(v) => setValue('category_id', v)}
            />
          </Field>
          <Field label="مدرس">
            <FilterSelect
              options={teacherOptions}
              value={watched.teacher_id || ''}
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
          <Field label="تصویر کاور" hint="JPG یا PNG، حداکثر ۲ مگابایت">
            <FileInput
              fileName={coverImgName}
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setCoverImgName(f.name);
                }
              }}
            />
          </Field>
          <Field label="ویدیو کاور" hint="ویدیوی معرفی کوتاه دوره">
            <FileInput
              fileName={coverVideoName}
              accept="video/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setCoverVideoName(f.name);
                }
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

      <div className="mt-20 flex flex-col-reverse gap-12 sm:flex-row sm:justify-end">
        <Link
          to="/panel-admin/courses"
          className="rounded-xl bg-[#EDF1F8] px-20 py-12 text-center text-[11px] font-bold text-[#8A96B0] shadow-[-3px_-3px_7px_0px_#FFFFFFE5,_4px_4px_10px_0px_#A3B1C673] transition duration-200 hover:text-[#1C2B4A]"
        >
          انصراف
        </Link>
        <button
          type="submit"
          disabled={!canSubmit || isSubmitting}
          className={`to-primary-600 rounded-xl bg-gradient-to-br from-[#1E4D9C] px-20 py-12 text-[11px] font-black text-white shadow-[3px_3px_8px_0px_#193B734D] transition duration-200 ${
            canSubmit && !isSubmitting
              ? 'cursor-pointer hover:brightness-110'
              : 'cursor-not-allowed opacity-50'
          }`}
        >
          {isSubmitting ? 'در حال ایجاد دوره...' : 'ایجاد دوره و ادامه ←'}
        </button>
      </div>
    </form>
  );
}

export default CourseInfoForm;
