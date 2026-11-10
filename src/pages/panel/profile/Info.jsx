import { useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import Spinner from '../../../components/ui/Spinner';
import { useAuth } from '../../../contexts/AuthContext';
import { enToFaDigits } from '../../../services/courseApi';
import { getProfile, updateProfile } from '../../../services/studentApi';
import { profileInfoSchema } from '../../../validation/student.schema';

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

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.25,
    },
  },
};

const fieldContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

function Info() {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['student-profile'],
    queryFn: getProfile,
  });

  const currentUser = profile || user;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(profileInfoSchema),
    defaultValues: {
      full_name: currentUser?.full_name || '',
      email: currentUser?.email || '',
      bio: currentUser?.bio || '',
      avatar_url: currentUser?.avatar_url || '',
    },
  });

  useEffect(() => {
    if (!currentUser) return;
    reset({
      full_name: currentUser.full_name || '',
      email: currentUser.email || '',
      bio: currentUser.bio || '',
      avatar_url: currentUser.avatar_url || '',
    });
  }, [currentUser, reset]);

  const updateMutation = useMutation({
    mutationFn: (formData) => updateProfile(formData),
    onSuccess: (response) => {
      if (response?.user) {
        updateUser(response.user);
      }
      queryClient.invalidateQueries({ queryKey: ['student-profile'] });
      queryClient.invalidateQueries({ queryKey: ['student-dashboard-stats'] });
      toast.success(
        response?.message || 'اطلاعات کاربری با موفقیت بروزرسانی شد',
      );
    },
    onError: (error) => {
      toast.error(
        error?.userMessage || 'خطا در بروزرسانی اطلاعات پروفایل کاربری',
      );
    },
  });

  const onSubmit = (values) => {
    updateMutation.mutate(values);
  };

  if (isLoading && !currentUser) {
    return (
      <div className="flex min-h-240 w-full items-center justify-center rounded-2xl bg-[#EDF1F8] p-32">
        <Spinner className="text-primary-600 h-32 w-32" />
      </div>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      variants={slideFromLeft}
      initial="hidden"
      animate="show"
      className="rounded-2xl bg-[#EDF1F8] px-20 py-15 shadow-[-4px_-4px_12px_0px_#FFFFFFE5,_6px_6px_16px_0px_#A3B1C680] sm:px-55 sm:py-35"
    >
      <motion.div variants={container} initial="hidden" animate="show">
        <div className="grid grid-cols-1 gap-21 sm:grid-cols-2">
          <motion.div variants={fieldContainer} className="flex flex-col gap-6">
            <motion.p
              variants={textDrop}
              className="text-[11px] font-bold text-[#8A96B0]"
            >
              نام و نام خانوادگی
            </motion.p>
            <motion.input
              variants={textDrop}
              type="text"
              {...register('full_name')}
              className="rounded-xl px-16 py-10 text-sm text-[#1C2B4A] shadow-[inset_-2px_-2px_5px_0px_#FFFFFFD9,_inset_3px_3px_7px_0px_#A3B1C680] placeholder:text-[#1C2B4A80]"
              placeholder="نام و نام خانوادگی"
            />
            {errors.full_name && (
              <span className="text-[11px] font-medium text-red-500">
                {errors.full_name.message}
              </span>
            )}
          </motion.div>

          <motion.div variants={fieldContainer} className="flex flex-col gap-6">
            <motion.p
              variants={textDrop}
              className="text-[11px] font-bold text-[#8A96B0]"
            >
              آدرس ایمیل
            </motion.p>
            <motion.input
              variants={textDrop}
              type="email"
              {...register('email')}
              placeholder="example@gmail.com"
              className="rounded-xl px-16 py-10 text-sm text-[#1C2B4A] shadow-[inset_-2px_-2px_5px_0px_#FFFFFFD9,_inset_3px_3px_7px_0px_#A3B1C680] placeholder:text-[#1C2B4A80]"
            />
            {errors.email && (
              <span className="text-[11px] font-medium text-red-500">
                {errors.email.message}
              </span>
            )}
          </motion.div>
        </div>

        <motion.div
          variants={fieldContainer}
          className="mt-21 grid grid-cols-1 gap-21 sm:grid-cols-2"
        >
          <motion.div variants={fieldContainer} className="flex flex-col gap-6">
            <motion.p
              variants={textDrop}
              className="text-[11px] font-bold text-[#8A96B0]"
            >
              شماره تلفن
            </motion.p>
            <motion.input
              variants={textDrop}
              type="tel"
              className="rounded-xl px-16 py-10 text-right text-sm text-[#8A96B0] shadow-[inset_-2px_-2px_5px_0px_#FFFFFFD9,_inset_3px_3px_7px_0px_#A3B1C680]"
              value={enToFaDigits(currentUser?.mobile || '')}
              readOnly
            />
          </motion.div>

          <motion.div variants={fieldContainer} className="flex flex-col gap-6">
            <motion.p
              variants={textDrop}
              className="text-[11px] font-bold text-[#8A96B0]"
            >
              آدرس تصویر پروفایل (اختیاری)
            </motion.p>
            <motion.input
              variants={textDrop}
              type="url"
              {...register('avatar_url')}
              className="rounded-xl px-16 py-10 text-sm text-[#1C2B4A] shadow-[inset_-2px_-2px_5px_0px_#FFFFFFD9,_inset_3px_3px_7px_0px_#A3B1C680] placeholder:text-[#1C2B4A80]"
              placeholder="https://example.com/avatar.png"
            />
            {errors.avatar_url && (
              <span className="text-[11px] font-medium text-red-500">
                {errors.avatar_url.message}
              </span>
            )}
          </motion.div>
        </motion.div>

        <motion.div
          variants={fieldContainer}
          className="mt-21 flex flex-col gap-6 pt-16"
        >
          <motion.p
            variants={textDrop}
            className="text-[11px] font-bold text-[#8A96B0]"
          >
            بیوگرافی
          </motion.p>
          <motion.textarea
            variants={textDrop}
            {...register('bio')}
            className="min-h-80 rounded-xl px-16 py-10 text-right text-sm text-[#1C2B4A] shadow-[inset_-2px_-2px_5px_0px_#FFFFFFD9,_inset_3px_3px_7px_0px_#A3B1C680] placeholder:text-[#1C2B4A80]"
            placeholder="درباره علایق و مهارت‌های خود بنویسید..."
          />
          {errors.bio && (
            <span className="text-[11px] font-medium text-red-500">
              {errors.bio.message}
            </span>
          )}
        </motion.div>

        <motion.div
          variants={textDrop}
          className="mt-21 flex flex-row-reverse border-t border-t-[#A3B1C64D] pt-8"
        >
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="cursor-pointer rounded-xl bg-[linear-gradient(135deg,_#1E4D9C_0%,_#193B73_100%)] px-20 py-10 text-xs font-bold text-white shadow-[-2px_-2px_6px_0px_#FFFFFF80,_4px_4px_12px_0px_#193B7359] transition duration-300 hover:-translate-y-3 disabled:opacity-60"
          >
            {updateMutation.isPending ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
          </button>
        </motion.div>
      </motion.div>
    </motion.form>
  );
}

export default Info;
