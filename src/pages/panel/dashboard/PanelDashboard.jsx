import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router';

import Spinner from '../../../components/ui/Spinner';
import { useAuth } from '../../../contexts/AuthContext';
import { enToFaDigits } from '../../../services/courseApi';
import {
  getDashboardStats,
  getUserEnrolledCourses,
} from '../../../services/studentApi';
import { getTickets } from '../../../services/supportApi';

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

const getTicketStatusMeta = (status) => {
  switch (status) {
    case 'answered':
      return {
        label: 'پاسخ داده شده',
        dotClass: 'bg-[#22C55E]',
        badgeClass: 'bg-[#DCFCE7] text-[#15803D]',
      };
    case 'closed':
      return {
        label: 'بسته شده',
        dotClass: 'bg-[#8A96B0]',
        badgeClass: 'bg-[#ECEFF4] text-[#8A96B0]',
      };
    case 'pending':
      return {
        label: 'در حال بررسی',
        dotClass: 'bg-[#F59E0B]',
        badgeClass: 'bg-[#DCE5F4] text-primary-600',
      };
    default:
      return {
        label: 'باز',
        dotClass: 'bg-[#EF4444]',
        badgeClass: 'bg-[#DCE5F4] text-primary-600',
      };
  }
};

function PanelDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['student-dashboard-stats'],
    queryFn: getDashboardStats,
  });

  const { data: enrolledCourses = [] } = useQuery({
    queryKey: ['user-enrolled-courses'],
    queryFn: getUserEnrolledCourses,
  });

  const { data: ticketsData } = useQuery({
    queryKey: ['tickets', { page: 1, limit: 3 }],
    queryFn: () => getTickets({ page: 1, limit: 3 }),
  });

  if (isStatsLoading) {
    return (
      <div className="flex min-h-320 w-full items-center justify-center">
        <Spinner className="text-primary-600 h-36 w-36" />
      </div>
    );
  }

  const enrolledCount =
    stats?.enrolled_courses_count ?? enrolledCourses.length ?? 0;
  const completedCount = stats?.completed_courses_count ?? 0;
  const inProgressCount =
    stats?.in_progress_courses_count ??
    Math.max(0, enrolledCount - completedCount);
  const certificatesCount = stats?.certificates_count ?? 0;
  const activeTicketsCount = stats?.active_tickets_count ?? 0;
  const totalTicketsCount = ticketsData?.total_items ?? activeTicketsCount;
  const recentTickets = ticketsData?.items?.slice(0, 2) || [];
  const activeCourses = enrolledCourses.slice(0, 2);

  const profileCompletion = [
    user?.full_name,
    user?.mobile,
    user?.email,
    user?.bio,
  ].filter(Boolean).length;
  const profilePercent = Math.min(
    100,
    Math.round((profileCompletion / 4) * 100),
  );

  const statsCards = [
    {
      icon: '/icons/book-active.svg',
      count: enToFaDigits(enrolledCount),
      title: 'دوره های من',
      sub: `${enToFaDigits(inProgressCount)} فعال · ${enToFaDigits(completedCount)} تکمیل`,
    },
    {
      icon: '/icons/medal-brown.svg',
      count: enToFaDigits(certificatesCount),
      title: 'گواهینامه',
      sub: 'گواهی دریافتی',
    },
    {
      icon: '/icons/message-blue.svg',
      count: enToFaDigits(activeTicketsCount),
      title: 'پشتیبانی',
      sub: `${enToFaDigits(activeTicketsCount)} تیکت فعال`,
    },
    {
      icon: '/icons/user-green.svg',
      count: `${enToFaDigits(profilePercent)}%`,
      title: 'پروفایل',
      sub: 'تکمیل پروفایل',
    },
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -80 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="from-primary-600 flex h-117 w-full items-center justify-between rounded-2xl bg-gradient-to-br to-[#112552] shadow-[-4px_-4px_12px_0px_#FFFFFF80,_8px_8px_20px_0px_#193B7359]"
      >
        <div className="relative flex h-117 w-full items-center justify-between rounded-[40px] bg-[radial-gradient(98.62%_98.62%_at_85%_50%,_rgba(247,185,40,0.14)_0%,_rgba(247,185,40,0)_60%)] px-18 sm:px-30">
          <div>
            <p className="text-xs text-[#FFFFFF66]">خوش آمدید</p>
            <h1 className="pt-4 text-xl font-black text-white">
              {user?.full_name || 'دانشجوی کدکدا'}
            </h1>
            <p className="pt-4 text-[11px] text-[#FFFFFF4D]">
              {user?.mobile
                ? `شماره همراه · ${enToFaDigits(user.mobile)}`
                : 'پنل کاربری دانشجو'}
            </p>
          </div>

          <div className="flex items-center gap-12">
            <div className="flex flex-col items-center rounded-xl bg-[#FFFFFF14] px-16 py-10 shadow-[inset_1px_1px_4px_0px_#00000033]">
              <span className="text-lg font-black text-white">
                {enToFaDigits(enrolledCount)}
              </span>
              <span className="pt-4 text-[10px] text-[#FFFFFF59]">دوره</span>
            </div>
            <div className="flex flex-col items-center rounded-xl bg-[#FFFFFF14] px-16 py-10 shadow-[inset_1px_1px_4px_0px_#00000033]">
              <span className="text-lg font-black text-white">
                {enToFaDigits(certificatesCount)}
              </span>
              <span className="pt-4 text-[10px] text-[#FFFFFF59]">گواهی</span>
            </div>
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
        className="mt-25 grid grid-cols-12 gap-20"
      >
        <motion.div
          variants={slideFromLeft}
          className="col-span-12 rounded-2xl bg-[#EDF1F8] p-20 shadow-[-4px_-4px_12px_0px_#FFFFFFE5,_6px_6px_16px_0px_#A3B1C680] md:col-span-7"
        >
          <div className="flex w-full items-center justify-between">
            <div>
              <span className="relative text-sm font-black text-[#1C2B4A]">
                دوره های فعال
                <span className="bg-secondary-300 absolute top-2 -left-10 h-16 w-4 rounded-full shadow-[0px_0px_6px_0px_#F7B928AA]"></span>
              </span>
            </div>
            <div>
              <Link
                to="/panel/courses"
                className="text-primary-600 text-[11px] font-bold"
              >
                همه ←
              </Link>
            </div>
          </div>

          {activeCourses.length > 0 ? (
            activeCourses.map((course, idx) => (
              <div
                key={course.enrollment_id || course.course_id || idx}
                className={`${idx === 0 ? 'mt-13' : 'mt-10'} flex items-center justify-between rounded-xl bg-[#E4E9F2] p-10 shadow-[inset_-2px_-2px_4px_0px_#FFFFFFCC,_inset_2px_2px_5px_0px_#A3B1C666]`}
              >
                <div className="flex items-center">
                  <div className="flex h-44 w-44 items-center justify-center rounded-xl shadow-[2px_2px_6px_0px_#A3B1C680]">
                    <img src="/icons/tick-green.svg" alt="" />
                  </div>
                  <div className="mr-8 flex flex-col gap-4">
                    <span className="text-xs font-bold text-[#1C2B4A]">
                      {course.title}
                    </span>
                    <span className="text-[10px] text-[#8A96B0]">
                      {course.instructor_name || 'مدرس آکادمی کدکدا'}
                    </span>
                  </div>
                </div>
                <Link
                  to={course.slug ? `/course/${course.slug}` : '/panel/courses'}
                  className="bg-primary hover:bg-primary-500 flex h-32 w-32 cursor-pointer items-center justify-center rounded-full shadow-[-1px_-1px_4px_0px_#FFFFFF66,_3px_3px_8px_0px_#193B7359] transition duration-300"
                >
                  <img src="/icons/play.svg" alt="play" />
                </Link>
              </div>
            ))
          ) : (
            <div className="mt-13 flex items-center justify-between rounded-xl bg-[#E4E9F2] p-14 shadow-[inset_-2px_-2px_4px_0px_#FFFFFFCC,_inset_2px_2px_5px_0px_#A3B1C666]">
              <span className="text-xs font-semibold text-[#8A96B0]">
                هنوز در دوره‌ای ثبت‌نام نکرده‌اید.
              </span>
              <Link
                to="/archive"
                className="text-primary-600 text-xs font-bold"
              >
                مشاهده دوره‌ها ←
              </Link>
            </div>
          )}
        </motion.div>

        <motion.div
          variants={slideFromLeft}
          className="col-span-12 rounded-2xl bg-[#EDF1F8] p-20 shadow-[-4px_-4px_12px_0px_#FFFFFFE5,_6px_6px_16px_0px_#A3B1C680] md:col-span-5"
        >
          <div className="flex w-full items-center justify-between">
            <div>
              <span className="relative text-sm font-black text-[#1C2B4A]">
                گواهینامه ها
                <span className="bg-primary-600 absolute top-2 -right-10 h-16 w-4 rounded-full shadow-[0px_0px_6px_0px_#193B7388]"></span>
              </span>
            </div>
            <div>
              <span className="text-primary-600 rounded-full bg-[#DCE5F4] px-10 py-2 text-[11px] font-bold">
                {enToFaDigits(certificatesCount)}
              </span>
            </div>
          </div>

          <div className="mt-13 flex items-center justify-between rounded-xl bg-[#E4E9F2] p-10 shadow-[inset_-2px_-2px_4px_0px_#FFFFFFCC,_inset_2px_2px_5px_0px_#A3B1C666]">
            <div className="flex items-center">
              <div className="flex h-44 w-44 items-center justify-center rounded-xl shadow-[2px_2px_6px_0px_#A3B1C680]">
                <img src="/icons/medal-brown.svg" alt="medal" />
              </div>
              <div className="mr-8 flex flex-col gap-4">
                <span className="text-xs font-bold text-[#1C2B4A]">
                  {certificatesCount > 0
                    ? `${enToFaDigits(certificatesCount)} گواهی صادر شده`
                    : 'گواهی پایان دوره'}
                </span>
                <span className="text-[10px] text-[#8A96B0]">
                  {enToFaDigits(stats?.total_learning_hours ?? 0)} ساعت آموزش
                </span>
              </div>
            </div>
            <Link
              to="/panel/certificates"
              className="rounded-full bg-[#FFF3DC] px-10 py-2 text-[10px] font-bold text-[#B07D00]"
            >
              مشاهده
            </Link>
          </div>
        </motion.div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, x: -80 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 }}
        className="from-primary-600 mt-25 rounded-2xl bg-gradient-to-br to-[#1A4598] p-21 shadow-[-3px_-3px_10px_0px_#FFFFFF73,_8px_8px_20px_0px_#193B734D]"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-black text-white">تیکت ها</span>
          <Link
            to="/panel/support"
            className="cursor-pointer rounded-lg bg-[#FFFFFF14] px-12 py-4 text-[11px] text-[#FFFFFF80] shadow-[inset_1px_1px_3px_0px_#00000033] transition duration-200 hover:bg-white hover:text-[#8A96B0]"
          >
            مشاهده همه
          </Link>
        </div>

        <div className="mt-20 grid grid-cols-12 gap-20 sm:px-16 md:gap-0">
          <div className="col-span-12 flex gap-10 md:col-span-5 md:pl-20">
            <div className="flex h-102 grow basis-1 flex-col items-center justify-center rounded-xl bg-[#FFFFFF14] shadow-[inset_1px_1px_4px_0px_#00000033] sm:w-160">
              <span className="text-xl font-black text-white">
                {enToFaDigits(totalTicketsCount)}
              </span>
              <span className="pt-4 text-[10px] text-[#FFFFFF66]">مجموع</span>
            </div>
            <div className="flex h-102 grow basis-1 flex-col items-center justify-center rounded-xl bg-[#FFFFFF14] shadow-[inset_1px_1px_4px_0px_#00000033] sm:w-160">
              <span className="text-secondary-300 text-xl font-black">
                {enToFaDigits(activeTicketsCount)}
              </span>
              <span className="pt-4 text-[10px] text-[#FFFFFF66]">فعال</span>
            </div>
          </div>
          <div className="col-span-12 flex flex-col gap-10 md:col-span-7">
            {recentTickets.length > 0 ? (
              recentTickets.map((ticket) => {
                const statusMeta = getTicketStatusMeta(ticket.status);
                return (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between rounded-lg bg-[#FFFFFF12] px-12 py-10"
                  >
                    <div className="flex items-center gap-8">
                      <div
                        className={`h-8 w-8 rounded-full ${statusMeta.dotClass}`}
                      ></div>
                      <div>
                        <p className="text-[11px] font-normal text-white">
                          {ticket.subject}
                        </p>
                      </div>
                    </div>
                    <div>
                      <span
                        className={`rounded-full px-10 py-2 text-[10px] font-bold ${statusMeta.badgeClass}`}
                      >
                        {statusMeta.label}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex h-full items-center justify-between rounded-lg bg-[#FFFFFF12] px-14 py-12">
                <p className="text-xs text-[#FFFFFFB2]">
                  هیچ تیکت پشتیبانی ثبت نشده است.
                </p>
                <Link
                  to="/panel/support"
                  className="text-secondary-300 text-xs font-bold"
                >
                  ثبت تیکت جدید ←
                </Link>
              </div>
            )}
          </div>
        </div>
      </motion.section>
    </>
  );
}

export default PanelDashboard;
