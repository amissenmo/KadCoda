import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router';

import Spinner from '../../../components/ui/Spinner';
import {
  getPlatformMetrics,
  listTransactions,
  listUsers,
} from '../../../services/adminApi';
import { enToFaDigits, formatToman } from '../../../services/courseApi';

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const slideFromLeft = {
  hidden: { opacity: 0, x: -80 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

const iconDrop = {
  hidden: { opacity: 0, y: -50, rotate: -15, scale: 0.6 },
  show: {
    opacity: 1,
    y: 0,
    rotate: 0,
    scale: 1,
    transition: {
      duration: 0.55,
      ease: [0.34, 1.56, 0.64, 1],
      delay: 0.2,
    },
  },
};

const FALLBACK_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
];

function PanelAdminDashboard() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['admin-platform-metrics'],
    queryFn: getPlatformMetrics,
  });

  const { data: recentUsersData } = useQuery({
    queryKey: ['admin-users', { page: 1, limit: 3 }],
    queryFn: () => listUsers({ page: 1, limit: 3 }),
  });

  const { data: recentTxData } = useQuery({
    queryKey: ['admin-transactions', { page: 1, limit: 3 }],
    queryFn: () => listTransactions({ page: 1, limit: 3 }),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-320 w-full items-center justify-center">
        <Spinner className="text-primary-600 h-36 w-36" />
      </div>
    );
  }

  const totalUsers = metrics?.total_users ?? 0;
  const totalCourses = metrics?.total_courses ?? 0;
  const totalEnrollments = metrics?.total_enrollments ?? 0;
  const totalArticles = metrics?.total_articles ?? 0;
  const openTicketsCount = metrics?.open_tickets_count ?? 0;
  const totalRevenue = metrics?.total_revenue ?? 0;
  const monthlyStats = Array.isArray(metrics?.monthly_stats)
    ? metrics.monthly_stats
    : [];

  const totalOrdersCount = monthlyStats.reduce(
    (sum, s) => sum + Number(s.orders_count ?? 0),
    0,
  );
  const currentMonthOrders = Number(monthlyStats[0]?.orders_count ?? 0);

  const statsCards = [
    {
      icon: '/icons/user-green.svg',
      count: enToFaDigits(totalUsers),
      title: 'تعداد کل کاربران',
      sub: 'کاربران ثبت‌نام شده',
    },
    {
      icon: '/icons/user-blue.svg',
      count: enToFaDigits(totalArticles),
      title: 'مقالات منتشر شده',
      sub: 'محتوای وبلاگ آموزشی',
    },
    {
      icon: '/icons/book-active.svg',
      count: enToFaDigits(totalCourses),
      title: 'تعداد دوره‌ها',
      sub: 'دوره‌های فعال پلتفرم',
    },
    {
      icon: '/icons/book-green.svg',
      count: enToFaDigits(totalEnrollments),
      title: 'ثبت‌نام دوره‌ها',
      sub: 'مجموع ثبت‌نام‌ها',
    },
    {
      icon: '/icons/medal-brown.svg',
      count: formatToman(totalRevenue),
      title: 'کل درآمد پلتفرم',
      sub: 'تومان (پرداخت‌های موفق)',
    },
    {
      icon: '/icons/wallet-blue.svg',
      count: enToFaDigits(totalOrdersCount || (recentTxData?.total_items ?? 0)),
      title: 'تراکنش‌های پلتفرم',
      sub: 'کل تراکنش‌ها',
    },
    {
      icon: '/icons/wallet-green.svg',
      count: enToFaDigits(currentMonthOrders),
      title: 'تراکنش‌های این ماه',
      sub: 'یک ماه اخیر',
    },
    {
      icon: '/icons/message-blue.svg',
      count: enToFaDigits(openTicketsCount),
      title: 'تیکت‌های باز و فعال',
      sub: 'در انتظار پاسخ',
    },
  ];

  const revenueChartData =
    monthlyStats.length > 0
      ? monthlyStats
          .slice(0, 6)
          .reverse()
          .map((item) => ({
            month: item.month,
            value: Math.max(
              1,
              Math.round(Number(item.total_amount || 0) / 1000000),
            ),
          }))
      : FALLBACK_MONTHS.map((m) => ({ month: m, value: 0 }));

  const enrollmentChartData =
    monthlyStats.length > 0
      ? monthlyStats
          .slice(0, 6)
          .reverse()
          .map((item) => ({
            month: item.month,
            value: Number(item.orders_count || 0),
          }))
      : FALLBACK_MONTHS.map((m) => ({ month: m, value: 0 }));

  const maxRevenue = Math.max(1, ...revenueChartData.map((d) => d.value));
  const maxEnrollment = Math.max(1, ...enrollmentChartData.map((d) => d.value));

  const recentActivities = [
    ...(recentUsersData?.items || []).slice(0, 2).map((u) => ({
      icon: '/icons/user-green.svg',
      title: 'کاربر ثبت‌نام شده',
      desc: `${u.name} (${u.mobile}) در پلتفرم عضو شد`,
      time: u.joined,
      tag: 'کاربر',
      tagClass: 'bg-[#DCFCE7] text-[#15803D]',
    })),
    ...(recentTxData?.items || []).slice(0, 3).map((tx) => ({
      icon: '/icons/wallet-green.svg',
      title: `تراکنش ${tx.status}`,
      desc: `${tx.student} · ${tx.course} (${tx.amount} تومان)`,
      time: tx.date,
      tag: 'مالی',
      tagClass: tx.statusClass,
    })),
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -80 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="from-primary-600 flex h-117 w-full items-center justify-between rounded-2xl bg-gradient-to-br to-[#112552] shadow-[-4px_-4px_12px_0px_#FFFFFF80,_8px_8px_20px_0px_#193B7359]"
      >
        <div className="relative flex h-117 w-full items-center rounded-[40px] bg-[radial-gradient(98.62%_98.62%_at_85%_50%,_rgba(247,185,40,0.14)_0%,_rgba(247,185,40,0)_60%)] px-18 sm:px-30">
          <div>
            <h1 className="text-xl font-black text-white">
              پلتفرم آموزش کدکدا
            </h1>
            <p className="pt-8 text-[12px] text-[#FFFFFF80]">
              خلاصه وضعیت سیستم، آمار عملکرد آموزشی و گزارش مالی زنده
            </p>
          </div>

          <div className="absolute -top-11 -left-28 h-160 w-160 rounded-full bg-[#FFFFFF0A]"></div>
        </div>
      </motion.div>

      <motion.section
        variants={container}
        initial="hidden"
        animate="show"
        className="mt-25 grid grid-cols-2 gap-20 md:grid-cols-4"
      >
        {statsCards.map((card, i) => (
          <motion.div
            key={i}
            variants={slideFromLeft}
            whileHover={{ y: -4 }}
            className="flex h-163 flex-col items-start justify-center rounded-2xl bg-[#EDF1F8] px-20 shadow-[-4px_-4px_12px_0px_#FFFFFFE5,_6px_6px_16px_0px_#A3B1C680]"
          >
            <motion.div
              variants={iconDrop}
              className="flex h-40 w-40 items-center justify-center rounded-xl shadow-[-2px_-2px_6px_0px_#FFFFFFE5,_3px_3px_8px_0px_#A3B1C673]"
            >
              <img src={card.icon} alt="" />
            </motion.div>

            <p className="text-primary-600 py-8 text-2xl font-black">
              {card.count}
            </p>
            <p className="text-[14px] font-bold text-[#1C2B4A]">{card.title}</p>
            <p className="text-[11px] font-normal text-[#8A96B0]">{card.sub}</p>
          </motion.div>
        ))}
      </motion.section>

      <motion.section
        variants={container}
        initial="hidden"
        animate="show"
        className="mt-32 grid grid-cols-12 gap-20"
      >
        <motion.div
          variants={slideFromLeft}
          className="col-span-12 rounded-2xl bg-[#EDF1F8] p-20 shadow-[-4px_-4px_12px_0px_#FFFFFFE5,_6px_6px_16px_0px_#A3B1C680] md:col-span-7"
        >
          <div className="flex w-full items-center justify-between">
            <span className="relative text-sm font-black text-[#1C2B4A]">
              درآمد ماهانه
              <span className="bg-secondary-300 absolute top-2 -left-10 h-16 w-4 rounded-full shadow-[0px_0px_6px_0px_#F7B928AA]"></span>
            </span>
            <span className="text-primary-600 rounded-full bg-[#DCE5F4] px-10 py-2 text-[10px] font-bold">
              میلیون تومان
            </span>
          </div>

          <div className="mt-25 flex h-180 items-end justify-between gap-10">
            {revenueChartData.map((item, i) => (
              <div
                key={i}
                className="flex h-full flex-1 flex-col items-center justify-end gap-8"
              >
                <div className="relative flex h-full w-full items-end overflow-hidden rounded-lg bg-[#E4E9F2] shadow-[inset_-2px_-2px_4px_0px_#FFFFFFCC,_inset_2px_2px_5px_0px_#A3B1C666]">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(item.value / maxRevenue) * 100}%` }}
                    transition={{
                      duration: 0.8,
                      delay: 0.3 + i * 0.08,
                      ease: 'easeOut',
                    }}
                    className="w-full rounded-md bg-gradient-to-t from-[#193B73] to-[#2A5BA8] shadow-[inset_0_1px_2px_0_#FFFFFF40]"
                  />
                </div>
                <span className="text-[10px] font-bold text-[#8A96B0]">
                  {item.month}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          variants={slideFromLeft}
          className="col-span-12 rounded-2xl bg-[#EDF1F8] p-20 shadow-[-4px_-4px_12px_0px_#FFFFFFE5,_6px_6px_16px_0px_#A3B1C680] md:col-span-5"
        >
          <div className="flex w-full items-center justify-between">
            <span className="relative text-sm font-black text-[#1C2B4A]">
              ثبت‌نامی‌ها
              <span className="bg-primary-600 absolute top-2 -right-10 h-16 w-4 rounded-full shadow-[0px_0px_6px_0px_#193B7388]"></span>
            </span>
            <span className="text-primary-600 rounded-full bg-[#DCE5F4] px-10 py-2 text-[10px] font-bold">
              نفر
            </span>
          </div>

          <div className="mt-25 flex flex-col gap-14">
            {enrollmentChartData.map((item, i) => (
              <div key={i} className="flex items-center gap-12">
                <span className="w-50 text-[11px] font-bold text-[#1C2B4A]">
                  {item.month}
                </span>
                <div className="relative h-14 flex-1 overflow-hidden rounded-full bg-[#E4E9F2] shadow-[inset_-2px_-2px_4px_0px_#FFFFFFCC,_inset_2px_2px_5px_0px_#A3B1C666]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(item.value / maxEnrollment) * 100}%`,
                    }}
                    transition={{
                      duration: 0.8,
                      delay: 0.3 + i * 0.08,
                      ease: 'easeOut',
                    }}
                    className="h-full rounded-full bg-gradient-to-r from-[#F7B928] to-[#E6A916] shadow-[0_0_8px_0_#F7B92866]"
                  />
                </div>
                <span className="text-primary-600 w-30 text-left text-[11px] font-black">
                  {enToFaDigits(item.value)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.section>

      <motion.section
        variants={container}
        initial="hidden"
        animate="show"
        className="mt-32"
      >
        <motion.div
          variants={slideFromLeft}
          className="rounded-2xl bg-[#EDF1F8] p-20 shadow-[-4px_-4px_12px_0px_#FFFFFFE5,_6px_6px_16px_0px_#A3B1C680]"
        >
          <div className="flex w-full items-center justify-between">
            <span className="relative text-sm font-black text-[#1C2B4A]">
              آخرین فعالیت‌های سیستم
              <span className="bg-secondary-300 absolute top-2 -left-10 h-16 w-4 rounded-full shadow-[0px_0px_6px_0px_#F7B928AA]"></span>
            </span>
            <Link
              to="/panel-admin/finance"
              className="text-primary-600 cursor-pointer rounded-full bg-[#DCE5F4] px-12 py-4 text-[11px] font-bold transition duration-200 hover:bg-[#C9D7EC]"
            >
              مشاهده همه ←
            </Link>
          </div>

          <div className="mt-20 flex flex-col gap-10">
            {recentActivities.length > 0 ? (
              recentActivities.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: 0.4 + i * 0.08,
                    ease: 'easeOut',
                  }}
                  whileHover={{ x: -4 }}
                  className="flex items-center justify-between gap-12 rounded-xl bg-[#E4E9F2] p-12 shadow-[inset_-2px_-2px_4px_0px_#FFFFFFCC,_inset_2px_2px_5px_0px_#A3B1C666]"
                >
                  <div className="flex items-center gap-12">
                    <div className="flex h-44 w-44 shrink-0 items-center justify-center rounded-xl bg-[#EDF1F8] shadow-[-2px_-2px_6px_0px_#FFFFFFE5,_3px_3px_8px_0px_#A3B1C673]">
                      <img src={item.icon} alt="" />
                    </div>
                    <div className="flex flex-col gap-4">
                      <span className="text-xs font-bold text-[#1C2B4A]">
                        {item.title}
                      </span>
                      <span className="text-[11px] text-[#8A96B0]">
                        {item.desc}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-12">
                    <span className="hidden text-[10px] font-bold text-[#8A96B0] sm:block">
                      {item.time}
                    </span>
                    <span
                      className={`rounded-full px-10 py-2 text-[10px] font-bold ${item.tagClass}`}
                    >
                      {item.tag}
                    </span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="rounded-xl bg-[#E4E9F2] p-16 text-center text-xs text-[#8A96B0]">
                هنوز فعالیتی در سیستم ثبت نشده است.
              </div>
            )}
          </div>
        </motion.div>
      </motion.section>
    </>
  );
}

export default PanelAdminDashboard;
