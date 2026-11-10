import { z } from 'zod';

const adminUserEditSchema = z
  .object({
    name: z.string().trim().min(2, 'نام کاربر باید حداقل ۲ کاراکتر باشد'),
    email: z
      .union([
        z.literal(''),
        z.string().trim().email('فرمت آدرس ایمیل معتبر نیست'),
      ])
      .optional(),
    mobile: z.string().trim().min(10, 'شماره موبایل معتبر نیست'),
    role: z.enum(['student', 'teacher', 'instructor', 'admin']),
    status: z.enum(['active', 'inactive', 'suspended', 'banned']),
    bio: z.string().optional(),
    is_verified: z.boolean().default(true),
    has_support_access: z.boolean().default(true),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.password && !data.confirmPassword) return true;
      return (
        data.password === data.confirmPassword && data.password.length >= 6
      );
    },
    {
      message: 'رمزهای عبور یکسان نیستند یا کمتر از ۶ کاراکتر هستند',
      path: ['confirmPassword'],
    },
  );

const adminCourseCreateSchema = z.object({
  title: z.string().trim().min(3, 'عنوان دوره باید حداقل ۳ کاراکتر باشد'),
  slug: z.string().trim().min(3, 'اسلاگ دوره باید حداقل ۳ کاراکتر باشد'),
  description: z
    .string()
    .trim()
    .min(10, 'توضیحات دوره باید حداقل ۱۰ کاراکتر باشد'),
  duration: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).default('published'),
  level: z.string().min(1, 'انتخاب سطح دوره الزامی است'),
  has_support: z.boolean().default(true),
  is_active: z.boolean().default(true),
  price: z
    .union([z.string(), z.number()])
    .refine((v) => String(v).trim() !== '', {
      message: 'وارد کردن قیمت دوره الزامی است',
    }),
  discount_price: z.union([z.string(), z.number()]).optional(),
  category_id: z.string().optional(),
  teacher_id: z.string().optional(),
});

const adminDiscountCreateSchema = z.object({
  code: z.string().trim().min(2, 'کد تخفیف باید حداقل ۲ کاراکتر باشد'),
  type: z.enum(['percent', 'fixed']).default('percent'),
  amount: z
    .union([z.string(), z.number()])
    .refine((v) => Number(v) > 0, 'مقدار تخفیف باید بزرگ‌تر از صفر باشد'),
  max_discount: z.union([z.string(), z.number()]).optional(),
  min_purchase: z.union([z.string(), z.number()]).optional(),
  usage_limit: z.union([z.string(), z.number()]).optional(),
  per_user_limit: z.union([z.string(), z.number()]).optional(),
  scope: z.string().default('all'),
  category_id: z.string().optional(),
  start_date: z.string().trim().min(1, 'تاریخ شروع الزامی است'),
  end_date: z.string().trim().min(1, 'تاریخ اعتبار الزامی است'),
  is_active: z.boolean().default(true),
});

const adminArticleSchema = z.object({
  title: z.string().trim().min(3, 'عنوان مقاله باید حداقل ۳ کاراکتر باشد'),
  slug: z.string().trim().min(3, 'اسلاگ مقاله باید حداقل ۳ کاراکتر باشد'),
  excerpt: z.string().trim().min(5, 'خلاصه مقاله الزامی است'),
  content: z.string().trim().min(10, 'متن مقاله باید حداقل ۱۰ کاراکتر باشد'),
  category_id: z.string().min(1, 'انتخاب دسته‌بندی الزامی است'),
  status: z.enum(['draft', 'published', 'archived']).default('published'),
  tags: z.string().optional(),
  is_published: z.boolean().default(true),
});

export {
  adminArticleSchema,
  adminCourseCreateSchema,
  adminDiscountCreateSchema,
  adminUserEditSchema,
};
