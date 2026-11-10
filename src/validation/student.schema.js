import { z } from 'zod';

const profileInfoSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, 'نام و نام خانوادگی باید حداقل ۲ کاراکتر باشد')
    .max(150, 'نام و نام خانوادگی نمی‌تواند بیشتر از ۱۵۰ کاراکتر باشد'),
  email: z
    .union([
      z.literal(''),
      z.string().trim().email('فرمت آدرس ایمیل معتبر نیست'),
    ])
    .optional(),
  bio: z
    .string()
    .trim()
    .max(1000, 'بیوگرافی نمی‌تواند بیشتر از ۱۰۰۰ کاراکتر باشد')
    .optional(),
  avatar_url: z
    .union([z.literal(''), z.string().trim().url('آدرس تصویر معتبر نیست')])
    .optional(),
});

const changePasswordSchema = z
  .object({
    current_password: z
      .string()
      .min(6, 'رمز عبور فعلی باید حداقل ۶ کاراکتر باشد'),
    new_password: z.string().min(8, 'رمز عبور جدید باید حداقل ۸ کاراکتر باشد'),
    confirm_password: z.string().min(8, 'تکرار رمز عبور جدید الزامی است'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'رمز عبور جدید و تکرار آن یکسان نیستند',
    path: ['confirm_password'],
  });

const createTicketSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(3, 'موضوع تیکت باید حداقل ۳ کاراکتر باشد')
    .max(255, 'موضوع تیکت بیش از حد طولانی است'),
  department: z
    .string()
    .trim()
    .min(2, 'انتخاب واحد پشتیبانی الزامی است')
    .max(100, 'نام واحد پشتیبانی نامعتبر است'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  message: z.string().trim().min(5, 'متن پیام باید حداقل ۵ کاراکتر باشد'),
});

export { changePasswordSchema, createTicketSchema, profileInfoSchema };
