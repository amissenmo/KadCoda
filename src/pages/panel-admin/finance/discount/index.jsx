import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';

import Field from '../../../../components/ui/Field';
import FilterSelect from '../../../../components/ui/FilterSelect';
import SectionHeader from '../../../../components/ui/SectionHeader';
import ToggleSwitch from '../../../../components/ui/ToggleSwitch';
import { createDiscount } from '../../../../services/adminApi';
import { adminDiscountCreateSchema } from '../../../../validation/admin.schema';

const typeOptions = [
  { value: 'percent', label: 'درصدی' },
  { value: 'fixed', label: 'مبلغ ثابت (تومان)' },
];

const scopeOptions = [
  { value: 'all', label: 'همه دوره‌ها' },
  { value: 'specific', label: 'دوره‌های انتخابی' },
  { value: 'category', label: 'دسته‌بندی خاص' },
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

function PanelAdminDiscountCreate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [generated, setGenerated] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(adminDiscountCreateSchema),
    defaultValues: {
      code: '',
      type: 'percent',
      amount: '',
      max_discount: '',
      min_purchase: '',
      usage_limit: '100',
      per_user_limit: '1',
      scope: 'all',
      category_id: '',
      start_date: '',
      end_date: '',
      is_active: true,
    },
  });

  const watched = useWatch({ control });

  const canSubmit =
    (watched.code || '').trim() !== '' &&
    String(watched.amount ?? '').trim() !== '' &&
    (watched.start_date || '').trim() !== '' &&
    (watched.end_date || '').trim() !== '';

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setValue('code', code, { shouldValidate: true });
    setGenerated(true);
    setTimeout(() => setGenerated(false), 1500);
  };

  const createMutation = useMutation({
    mutationFn: (data) =>
      createDiscount({
        code: data.code.trim().toUpperCase(),
        percent: Math.min(Math.max(Number(data.amount) || 20, 1), 100),
        max_uses: Number(data.usage_limit) || 100,
        expires_at: data.end_date,
      }),
    onSuccess: () => {
      toast.success('کد تخفیف با موفقیت ایجاد شد.');
      queryClient.invalidateQueries({ queryKey: ['admin-discounts'] });
      navigate('/panel-admin/finance');
    },
    onError: (err) => {
      toast.error(err?.message || 'خطا در ایجاد کد تخفیف.');
    },
  });

  const onSubmit = (data) => {
    createMutation.mutate(data);
  };

  const isPercent = (watched.type || 'percent') === 'percent';

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
            افزودن کد تخفیف
          </h1>
          <p className="pt-8 text-[12px] text-[#8A96B0]">
            کد تخفیف جدید بسازید و شرایط استفاده از آن را تعیین کنید
          </p>
        </div>

        <span className="w-fit rounded-full bg-[#DCFCE7] px-14 py-6 text-[10px] font-bold text-[#15803D] shadow-[inset_-2px_-2px_4px_0px_#FFFFFFCC,_inset_2px_2px_5px_0px_#A3B1C666]">
          کد جدید
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.05, ease: 'easeOut' }}
        className="mt-20 rounded-2xl bg-[#EDF1F8] p-20 shadow-[-4px_-4px_12px_0px_#FFFFFFE5,_6px_6px_16px_0px_#A3B1C680]"
      >
        <SectionHeader title="اطلاعات کد تخفیف" />
        <div className="grid grid-cols-1 gap-20 md:grid-cols-2">
          <Field label="کد تخفیف" required hint="حروف بزرگ و اعداد">
            <div className="flex gap-8">
              <input
                type="text"
                dir="ltr"
                value={watched.code || ''}
                onChange={(e) =>
                  setValue(
                    'code',
                    e.target.value.toUpperCase().replace(/\s/g, ''),
                    { shouldValidate: true },
                  )
                }
                placeholder="SUMMER30"
                className={`${inputClass} flex-1 tracking-widest`}
              />
              <button
                type="button"
                onClick={generateCode}
                aria-label="تولید کد تصادفی"
                className={`flex h-40 w-40 shrink-0 cursor-pointer items-center justify-center rounded-xl shadow-[inset_-2px_-2px_4px_0px_#FFFFFFCC,_inset_2px_2px_5px_0px_#A3B1C666] transition duration-200 ${
                  generated
                    ? 'bg-[#DCFCE7] text-[#15803D]'
                    : 'text-primary-600 bg-[#E4E9F2] hover:brightness-105'
                }`}
              >
                {generated ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.2}
                    stroke="currentColor"
                    className="h-18 w-18"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4.5 12.75 6 6 9-13.5"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                    stroke="currentColor"
                    className="h-18 w-18"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                    />
                  </svg>
                )}
              </button>
            </div>
            {errors.code && (
              <span className="text-[10px] font-bold text-red-500">
                {errors.code.message}
              </span>
            )}
          </Field>

          <Field label="نوع تخفیف">
            <FilterSelect
              options={typeOptions}
              value={watched.type || 'percent'}
              onChange={(v) => setValue('type', v)}
            />
          </Field>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-20 md:grid-cols-2">
          <Field
            label={isPercent ? 'درصد تخفیف' : 'مبلغ تخفیف (تومان)'}
            required
            hint={isPercent ? 'عددی بین ۱ تا ۱۰۰' : 'مبلغ ثابت تخفیف'}
          >
            <input
              type="number"
              {...register('amount')}
              placeholder={isPercent ? '۲۰' : '۲۰۰۰۰۰'}
              className={inputClass}
            />
            {errors.amount && (
              <span className="text-[10px] font-bold text-red-500">
                {errors.amount.message}
              </span>
            )}
          </Field>
          {isPercent ? (
            <Field
              label="حداکثر سقف تخفیف (تومان)"
              hint="در صورت خالی بودن، بدون سقف اعمال می‌شود"
            >
              <input
                type="number"
                {...register('max_discount')}
                placeholder="۵۰۰۰۰۰"
                className={inputClass}
              />
            </Field>
          ) : (
            <Field label="حداقل مبلغ خرید (تومان)">
              <input
                type="number"
                {...register('min_purchase')}
                placeholder="۵۰۰۰۰۰"
                className={inputClass}
              />
            </Field>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
        className="mt-20 rounded-2xl bg-[#EDF1F8] p-20 shadow-[-4px_-4px_12px_0px_#FFFFFFE5,_6px_6px_16px_0px_#A3B1C680]"
      >
        <SectionHeader title="محدودیت‌ها" />
        <div className="grid grid-cols-1 gap-20 md:grid-cols-3">
          <Field label="حداقل مبلغ خرید (تومان)" hint="اختیاری">
            <input
              type="number"
              {...register('min_purchase')}
              placeholder="۵۰۰۰۰۰"
              className={inputClass}
            />
          </Field>
          <Field label="سقف کل استفاده" hint="اختیاری — خالی = بدون سقف">
            <input
              type="number"
              {...register('usage_limit')}
              placeholder="۱۰۰"
              className={inputClass}
            />
          </Field>
          <Field label="سقف استفاده هر کاربر">
            <input
              type="number"
              {...register('per_user_limit')}
              placeholder="1"
              className={inputClass}
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
        <SectionHeader title="اعمال تخفیف" />
        <div className="grid grid-cols-1 gap-20 md:grid-cols-2">
          <Field label="محدوده اعمال">
            <FilterSelect
              options={scopeOptions}
              value={watched.scope || 'all'}
              onChange={(v) => setValue('scope', v)}
            />
          </Field>

          {watched.scope === 'category' && (
            <Field label="دسته‌بندی">
              <FilterSelect
                options={categoryOptions}
                value={watched.category_id || ''}
                onChange={(v) => setValue('category_id', v)}
              />
            </Field>
          )}
        </div>

        {watched.scope === 'specific' && (
          <div className="mt-20 rounded-xl bg-[#E4E9F2] p-16 shadow-[inset_-2px_-2px_4px_0px_#FFFFFFCC,_inset_2px_2px_5px_0px_#A3B1C666]">
            <p className="text-[11px] font-bold text-[#1C2B4A]">
              انتخاب دوره‌ها
            </p>
            <p className="mt-4 text-[10px] text-[#8A96B0]">
              این کد تخفیف برای دوره‌های منتخب اعمال خواهد شد.
            </p>
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
        className="mt-20 rounded-2xl bg-[#EDF1F8] p-20 shadow-[-4px_-4px_12px_0px_#FFFFFFE5,_6px_6px_16px_0px_#A3B1C680]"
      >
        <SectionHeader title="بازه زمانی و وضعیت" />
        <div className="grid grid-cols-1 gap-20 md:grid-cols-2">
          <Field label="تاریخ شروع" required>
            <input
              type="text"
              {...register('start_date')}
              placeholder="۱۴۰۳/۰۵/۰۱"
              className={inputClass}
            />
          </Field>
          <Field label="تاریخ اعتبار (پایان)" required>
            <input
              type="text"
              {...register('end_date')}
              placeholder="۱۴۰۳/۰۷/۰۱"
              className={inputClass}
            />
          </Field>
        </div>

        <div className="mt-20">
          <ToggleSwitch
            checked={Boolean(watched.is_active)}
            onChange={(v) => setValue('is_active', v)}
            label="کد تخفیف فعال باشد"
            description="در صورت خاموش بودن، کاربران نمی‌توانند از آن استفاده کنند"
          />
        </div>
      </motion.div>

      <div className="mt-20 flex flex-col-reverse gap-12 sm:flex-row sm:justify-end">
        <Link
          to="/panel-admin/finance"
          className="rounded-xl bg-[#EDF1F8] px-20 py-12 text-center text-[11px] font-bold text-[#8A96B0] shadow-[-3px_-3px_7px_0px_#FFFFFFE5,_4px_4px_10px_0px_#A3B1C673] transition duration-200 hover:text-[#1C2B4A]"
        >
          انصراف
        </Link>
        <button
          type="submit"
          disabled={!canSubmit || createMutation.isPending}
          className={`to-primary-600 rounded-xl bg-gradient-to-br from-[#1E4D9C] px-20 py-12 text-[11px] font-black text-white shadow-[3px_3px_8px_0px_#193B734D] transition duration-200 ${canSubmit && !createMutation.isPending ? 'cursor-pointer hover:brightness-110' : 'cursor-not-allowed opacity-50'}`}
        >
          {createMutation.isPending ? 'در حال ثبت...' : 'ایجاد کد تخفیف'}
        </button>
      </div>
    </form>
  );
}

export default PanelAdminDiscountCreate;
