import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';

import { inputClass } from '../../components/common/constants';
import OtpInput from '../../components/common/OtpInput';
import PasswordInput from '../../components/common/PasswordInput';
import ResendButton from '../../components/common/ResendButton';
import Field from '../../components/ui/Field';
import PrimaryButton from '../../components/ui/PrimaryButton';
import StepIndicator from '../../components/ui/StepIndicator';
import { useAuth } from '../../contexts/AuthContext';
import { useCountdown } from '../../hooks/useCountdown';
import {
  register as registerUserRequest,
  sendOtp,
  verifyOtp,
} from '../../services/authApi';
import {
  mobileSchema,
  otpSchema,
  registerSchema,
} from '../../validation/auth.schema';

const STEPS = [
  { num: 1, label: 'شماره موبایل' },
  { num: 2, label: 'کد تأیید' },
  { num: 3, label: 'رمز عبور' },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState(1);
  const [mobile, setMobile] = useState('');
  const [verifiedProof, setVerifiedProof] = useState('');
  const [countdown, setCountdown] = useCountdown(0);

  // Step 1 Form: Mobile
  const mobileForm = useForm({
    resolver: zodResolver(mobileSchema),
    defaultValues: { mobile: '' },
  });

  // Step 2 Form: 6-digit OTP
  const otpForm = useForm({
    resolver: zodResolver(otpSchema),
    defaultValues: { code: '' },
  });

  // Step 3 Form: Password & Confirm Password
  const passwordForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const sendOtpMutation = useMutation({
    mutationFn: (targetMobile) => sendOtp(targetMobile),
    onSuccess: (data, targetMobile) => {
      setMobile(targetMobile);
      setStep(2);
      setCountdown(data?.cooldown_seconds || 60);
      toast.success(data?.message || 'کد تأیید ارسال شد');
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        'خطا در ارسال کد تأیید';
      mobileForm.setError('mobile', { type: 'server', message: msg });
      toast.error(msg);
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: ({ targetMobile, code }) => verifyOtp(targetMobile, code),
    onSuccess: (data) => {
      setVerifiedProof(data?.verified_proof || '');
      setStep(3);
      toast.success(data?.message || 'شماره موبایل با موفقیت تأیید شد');
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        'کد وارد شده صحیح نیست یا منقضی شده است';
      otpForm.setError('code', { type: 'server', message: msg });
      toast.error(msg);
    },
  });

  const registerMutation = useMutation({
    mutationFn: ({ targetMobile, proof, password }) =>
      registerUserRequest(targetMobile, proof, password),
    onSuccess: (data) => {
      login(data);
      toast.success('ثبت‌نام شما با موفقیت انجام شد');
      const targetPath =
        data?.user?.role === 'admin' ? '/panel-admin' : '/panel';
      navigate(targetPath, { replace: true });
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        'خطا در تکمیل ثبت‌نام';
      passwordForm.setError('root', { type: 'server', message: msg });
      toast.error(msg);
    },
  });

  const handleStep1Submit = (values) => {
    sendOtpMutation.mutate(values.mobile);
  };

  const handleResendOtp = () => {
    if (countdown > 0 || !mobile || sendOtpMutation.isPending) return;
    otpForm.reset({ code: '' });
    sendOtpMutation.mutate(mobile);
  };

  const handleStep2Submit = (values) => {
    verifyOtpMutation.mutate({ targetMobile: mobile, code: values.code });
  };

  const handleStep3Submit = (values) => {
    registerMutation.mutate({
      targetMobile: mobile,
      proof: verifiedProof,
      password: values.password,
    });
  };

  const currentOtpValue = useWatch({ control: otpForm.control, name: 'code' });

  return (
    <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#E8EDF5] px-16 py-40">
      {/* پس‌زمینه‌های انیمیشنی */}
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
          {/* هدر */}
          <div className="flex flex-col items-center text-center">
            <div className="to-primary-600 flex h-72 w-72 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1E4D9C] shadow-[3px_3px_8px_0px_#193B734D]">
              <img src="/icons/book-sec.svg" alt="کدکدا" />
            </div>
            <h1 className="mt-20 text-lg font-black text-[#1C2B4A]">
              ثبت‌نام در آکادمی کدکدا
            </h1>
            <p className="mt-6 text-[12px] text-[#8A96B0]">
              در سه مرحله ساده حساب کاربری خود را بسازید
            </p>
          </div>

          <div className="mt-30">
            <StepIndicator current={step} steps={STEPS} />
          </div>

          <div className="mt-30">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.form
                  key="step1"
                  onSubmit={mobileForm.handleSubmit(handleStep1Submit)}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="flex flex-col gap-20"
                  noValidate
                >
                  <Field
                    label="شماره موبایل"
                    hint="کد تأیید به این شماره ارسال می‌شود"
                    error={mobileForm.formState.errors.mobile?.message}
                  >
                    <Controller
                      name="mobile"
                      control={mobileForm.control}
                      render={({ field }) => (
                        <input
                          type="tel"
                          dir="ltr"
                          value={field.value}
                          onChange={(e) => {
                            const sanitized = e.target.value
                              .replace(/\D/g, '')
                              .slice(0, 11);
                            field.onChange(sanitized);
                          }}
                          onBlur={field.onBlur}
                          placeholder="09123456789"
                          className={inputClass}
                          autoFocus
                        />
                      )}
                    />
                  </Field>

                  <PrimaryButton
                    loading={sendOtpMutation.isPending}
                    loadingText="در حال ارسال..."
                  >
                    دریافت کد تأیید
                  </PrimaryButton>
                </motion.form>
              )}

              {step === 2 && (
                <motion.form
                  key="step2"
                  onSubmit={otpForm.handleSubmit(handleStep2Submit)}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="flex flex-col gap-20"
                  noValidate
                >
                  <div className="rounded-xl bg-[#E4E9F2] px-14 py-10 text-center text-[11px] text-[#8A96B0] shadow-[inset_-2px_-2px_4px_0px_#FFFFFFCC,_inset_2px_2px_5px_0px_#A3B1C666]">
                    کد ۶ رقمی به شماره{' '}
                    <span className="text-primary-600 font-black" dir="ltr">
                      {mobile}
                    </span>{' '}
                    ارسال شد
                  </div>

                  <Controller
                    name="code"
                    control={otpForm.control}
                    render={({ field }) => (
                      <OtpInput
                        value={field.value}
                        onChange={field.onChange}
                        error={Boolean(otpForm.formState.errors.code)}
                      />
                    )}
                  />

                  {otpForm.formState.errors.code?.message && (
                    <div className="text-center text-[10px] font-bold text-[#B91C1C]">
                      {otpForm.formState.errors.code.message}
                    </div>
                  )}

                  <PrimaryButton
                    loading={verifyOtpMutation.isPending}
                    loadingText="در حال بررسی..."
                    disabled={(currentOtpValue || '').trim().length !== 6}
                  >
                    تأیید کد
                  </PrimaryButton>

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setStep(1);
                        otpForm.reset({ code: '' });
                      }}
                      className="text-[11px] font-bold text-[#8A96B0] hover:text-[#1C2B4A]"
                    >
                      ← تغییر شماره
                    </button>

                    <ResendButton
                      countdown={countdown}
                      onResend={handleResendOtp}
                    />
                  </div>
                </motion.form>
              )}

              {step === 3 && (
                <motion.form
                  key="step3"
                  onSubmit={passwordForm.handleSubmit(handleStep3Submit)}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="flex flex-col gap-20"
                  noValidate
                >
                  <Field
                    label="رمز عبور"
                    hint="حداقل ۶ کاراکتر"
                    error={passwordForm.formState.errors.password?.message}
                  >
                    <Controller
                      name="password"
                      control={passwordForm.control}
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

                  <Field
                    label="تکرار رمز عبور"
                    error={
                      passwordForm.formState.errors.confirmPassword?.message
                    }
                  >
                    <Controller
                      name="confirmPassword"
                      control={passwordForm.control}
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

                  {passwordForm.formState.errors.root?.message && (
                    <div className="rounded-xl bg-[#FEE2E2] px-14 py-10 text-[11px] font-bold text-[#B91C1C] shadow-[inset_-2px_-2px_4px_0px_#FFFFFFCC,_inset_2px_2px_5px_0px_#A3B1C666]">
                      {passwordForm.formState.errors.root.message}
                    </div>
                  )}

                  <PrimaryButton
                    loading={registerMutation.isPending}
                    loadingText="در حال ثبت‌نام..."
                  >
                    تکمیل ثبت‌نام
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

                  <button
                    type="button"
                    onClick={() => {
                      setStep(2);
                      passwordForm.clearErrors();
                    }}
                    className="text-center text-[11px] font-bold text-[#8A96B0] hover:text-[#1C2B4A]"
                  >
                    ← بازگشت به مرحله قبل
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-25 flex items-center justify-center gap-8 text-[11px]">
            <span className="text-[#8A96B0]">حساب کاربری دارید؟</span>
            <Link
              to="/login"
              className="text-primary-600 font-black hover:underline"
            >
              وارد شوید
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
