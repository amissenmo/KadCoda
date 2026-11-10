import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { changePassword } from '../../../services/studentApi';
import { changePasswordSchema } from '../../../validation/student.schema';

const slideFromLeft = {
  hidden: { opacity: 0, x: -80 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.55, ease: 'easeOut' },
  },
};

const textDrop = {
  hidden: { opacity: 0, y: -25 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

const textContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.25,
    },
  },
};

function Security() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (formData) => changePassword(formData),
    onSuccess: (response) => {
      toast.success(response?.message || 'رمز عبور شما با موفقیت تغییر یافت');
      reset();
    },
    onError: (error) => {
      toast.error(error?.userMessage || 'خطا در تغییر رمز عبور');
    },
  });

  const onSubmit = (values) => {
    passwordMutation.mutate(values);
  };

  return (
    <div>
      <motion.form
        onSubmit={handleSubmit(onSubmit)}
        initial="hidden"
        animate="show"
        variants={slideFromLeft}
        className="rounded-2xl bg-[#EDF1F8] px-20 py-18 shadow-[-4px_-4px_12px_0px_#FFFFFFE5,_6px_6px_16px_0px_#A3B1C680] sm:px-65 sm:py-38"
      >
        <motion.div
          variants={textContainer}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-21"
        >
          <motion.div
            variants={textDrop}
            className="flex items-center gap-10 rounded-2xl p-14 shadow-[inset_-3px_-3px_8px_0px_#FFFFFFD9,_inset_4px_4px_10px_0px_#A3B1C68C]"
          >
            <img src="/icons/security-active.svg" alt="security" />
            <p className="text-primary-600 text-xs font-semibold">
              رمز عبور قوی انتخاب کنید. حداقل ۸ کاراکتر.
            </p>
          </motion.div>

          <div className="flex flex-col gap-21">
            <motion.div variants={textDrop} className="flex flex-col gap-6">
              <p className="text-[11px] font-bold text-[#8A96B0]">
                رمز عبور فعلی
              </p>
              <input
                type="password"
                {...register('current_password')}
                className="rounded-xl px-16 py-10 text-sm text-[#1C2B4A] shadow-[inset_-2px_-2px_5px_0px_#FFFFFFD9,_inset_3px_3px_7px_0px_#A3B1C680] placeholder:text-[#1C2B4A80]"
                placeholder="••••••••"
              />
              {errors.current_password && (
                <span className="text-[11px] font-medium text-red-500">
                  {errors.current_password.message}
                </span>
              )}
            </motion.div>

            <motion.div variants={textDrop} className="flex flex-col gap-6">
              <p className="text-[11px] font-bold text-[#8A96B0]">
                رمز عبور جدید
              </p>
              <input
                type="password"
                {...register('new_password')}
                className="rounded-xl px-16 py-10 text-sm text-[#1C2B4A] shadow-[inset_-2px_-2px_5px_0px_#FFFFFFD9,_inset_3px_3px_7px_0px_#A3B1C680] placeholder:text-[#1C2B4A80]"
                placeholder="••••••••"
              />
              {errors.new_password && (
                <span className="text-[11px] font-medium text-red-500">
                  {errors.new_password.message}
                </span>
              )}
            </motion.div>

            <motion.div variants={textDrop} className="flex flex-col gap-6">
              <p className="text-[11px] font-bold text-[#8A96B0]">تکرار رمز</p>
              <input
                type="password"
                {...register('confirm_password')}
                className="rounded-xl px-16 py-10 text-sm text-[#1C2B4A] shadow-[inset_-2px_-2px_5px_0px_#FFFFFFD9,_inset_3px_3px_7px_0px_#A3B1C680] placeholder:text-[#1C2B4A80]"
                placeholder="••••••••"
              />
              {errors.confirm_password && (
                <span className="text-[11px] font-medium text-red-500">
                  {errors.confirm_password.message}
                </span>
              )}
            </motion.div>
          </div>
        </motion.div>
        <motion.div variants={textDrop} className="pt-16">
          <button
            type="submit"
            disabled={passwordMutation.isPending}
            className="to-primary-600 cursor-pointer rounded-xl bg-gradient-to-br from-[#1E4D9C] px-20 py-10 text-xs font-bold text-white shadow-[-2px_-2px_6px_0px_#FFFFFF80,_4px_4px_12px_0px_#193B7359] transition duration-300 hover:-translate-y-3 disabled:opacity-60"
          >
            {passwordMutation.isPending
              ? 'در حال بروزرسانی...'
              : 'بروزرسانی رمز'}
          </button>
        </motion.div>
      </motion.form>
    </div>
  );
}

export default Security;
