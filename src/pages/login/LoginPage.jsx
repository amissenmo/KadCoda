import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';

import { inputClass } from '../../components/common/constants';
import PasswordInput from '../../components/common/PasswordInput';
import Field from '../../components/ui/Field';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { useAuth } from '../../contexts/AuthContext';
import { login as loginRequest } from '../../services/authApi';
import { loginSchema } from '../../validation/auth.schema';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      mobile: '',
      password: '',
      remember: false,
    },
  });

  const remember = useWatch({ control, name: 'remember' });

  const loginMutation = useMutation({
    mutationFn: ({ mobile, password }) => loginRequest(mobile, password),
    onSuccess: (data) => {
      login(data);
      toast.success('ورود با موفقیت انجام شد');

      const redirectParam = searchParams.get('redirect');
      if (redirectParam) {
        navigate(redirectParam, { replace: true });
        return;
      }

      const targetPath =
        data?.user?.role === 'admin' ? '/panel-admin' : '/panel';
      navigate(targetPath, { replace: true });
    },
    onError: (err) => {
      const serverMessage =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        'شماره موبایل یا رمز عبور اشتباه است';
      toast.error(serverMessage);
    },
  });

  const onSubmit = (values) => {
    loginMutation.mutate(values);
  };

  const serverError =
    loginMutation.error?.response?.data?.detail ||
    loginMutation.error?.response?.data?.message ||
    (loginMutation.isError ? 'شماره موبایل یا رمز عبور اشتباه است' : '');

  return (
    <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#E8EDF5] px-16 py-40">
      <motion.div
        aria-hidden="true"
        animate={{ y: [0, -40, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="bg-primary-600/25 pointer-events-none absolute top-[10%] right-[15%] h-500 w-500 rounded-full blur-[120px]"
      />
      <motion.div
        aria-hidden="true"
        animate={{ y: [0, 40, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="bg-primary-600/20 pointer-events-none absolute bottom-[10%] left-[15%] h-460 w-460 rounded-full blur-[120px]"
      />
      <motion.div
        aria-hidden="true"
        animate={{ y: [0, -30, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="bg-secondary-300/15 pointer-events-none absolute top-1/2 left-1/2 h-400 w-400 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px]"
      />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-460"
      >
        <div className="rounded-[32px] bg-[#EDF1F8] p-30 shadow-[-10px_-10px_30px_0px_#FFFFFFE5,_16px_16px_40px_0px_#A3B1C673] sm:p-40">
          <div className="flex flex-col items-center text-center">
            <div className="to-primary-600 flex h-72 w-72 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1E4D9C] shadow-[3px_3px_8px_0px_#193B734D]">
              <img src="/icons/book-sec.svg" alt="کدکدا" />
            </div>
            <h1 className="mt-20 text-lg font-black text-[#1C2B4A]">
              ورود به آکادمی کدکدا
            </h1>
            <p className="mt-6 text-[12px] text-[#8A96B0]">
              برای ادامه، وارد حساب کاربری خود شوید
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-30 flex flex-col gap-20"
            noValidate
          >
            <Field
              label="شماره موبایل"
              hint="مثال: 09123456789"
              error={errors.mobile?.message}
            >
              <input
                type="tel"
                dir="ltr"
                placeholder="09123456789"
                className={inputClass}
                {...register('mobile')}
              />
            </Field>

            <Field
              label="رمز عبور"
              hint="حداقل ۶ کاراکتر"
              error={errors.password?.message}
            >
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <PasswordInput
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    placeholder="••••••••"
                  />
                )}
              />
            </Field>

            {serverError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-[#FEE2E2] px-14 py-10 text-[11px] font-bold text-[#B91C1C] shadow-[inset_-2px_-2px_4px_0px_#FFFFFFCC,_inset_2px_2px_5px_0px_#A3B1C666]"
              >
                {serverError}
              </motion.div>
            )}

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-10">
                <span
                  onClick={() => setValue('remember', !remember)}
                  className={`flex h-32 w-32 items-center justify-center rounded-lg transition ${
                    remember
                      ? 'bg-primary-600 text-white shadow-[3px_3px_8px_0px_#193B734D]'
                      : 'bg-[#E4E9F2] text-transparent shadow-[inset_-2px_-2px_4px_0px_#FFFFFFCC,_inset_2px_2px_5px_0px_#A3B1C666]'
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={3}
                    stroke="currentColor"
                    className="h-16 w-16"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4.5 12.75 6 6 9-13.5"
                    />
                  </svg>
                </span>
                <span className="text-[11px] font-bold text-[#1C2B4A]">
                  مرا به خاطر بسپار
                </span>
              </label>

              <Link
                to="/forgot-password"
                className="text-primary-600 text-[11px] font-bold hover:underline"
              >
                فراموشی رمز؟
              </Link>
            </div>

            <PrimaryButton
              loading={loginMutation.isPending}
              loadingText="در حال ورود..."
            >
              ورود به حساب
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-16 w-16 rotate-180"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                />
              </svg>
            </PrimaryButton>
          </form>

          <div className="mt-25 flex items-center justify-center gap-8 text-[11px]">
            <span className="text-[#8A96B0]">حساب کاربری ندارید؟</span>
            <Link
              to="/register"
              className="text-primary-600 font-black hover:underline"
            >
              ثبت‌نام کنید
            </Link>
          </div>
        </div>

        <p className="mt-20 text-center text-[10px] text-[#8A96B0]">
          © ۱۴۰۳ آکادمی کدکدا · تمامی حقوق محفوظ است
        </p>
      </motion.div>
    </section>
  );
}
