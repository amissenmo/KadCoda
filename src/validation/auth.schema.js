import { z } from 'zod';

const IRAN_MOBILE_REGEX = /^09\d{9}$/;
const OTP_CODE_REGEX = /^\d{6}$/;

const loginSchema = z.object({
  mobile: z
    .string()
    .trim()
    .regex(IRAN_MOBILE_REGEX, 'شماره موبایل معتبر نیست (مثال: 09123456789)'),
  password: z.string().min(6, 'رمز عبور باید حداقل ۶ کاراکتر باشد'),
  remember: z.boolean().optional(),
});

const mobileSchema = z.object({
  mobile: z
    .string()
    .trim()
    .regex(IRAN_MOBILE_REGEX, 'شماره موبایل معتبر نیست (مثال: 09123456789)'),
});

const otpSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(OTP_CODE_REGEX, 'کد تأیید باید دقیقاً ۶ رقم باشد'),
});

const registerSchema = z
  .object({
    password: z.string().min(6, 'رمز عبور باید حداقل ۶ کاراکتر باشد'),
    confirmPassword: z.string().min(6, 'تکرار رمز عبور الزامی است'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'رمزهای عبور یکسان نیستند',
    path: ['confirmPassword'],
  });

export { loginSchema, mobileSchema, otpSchema, registerSchema };
