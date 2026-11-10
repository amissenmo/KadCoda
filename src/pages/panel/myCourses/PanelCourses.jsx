import { useEffect, useState } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link, useSearchParams } from 'react-router';
import { toast } from 'sonner';

import Spinner from '../../../components/ui/Spinner';
import { enToFaDigits } from '../../../services/courseApi';
import { getUserEnrolledCourses } from '../../../services/studentApi';

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
  hidden: { opacity: 0, y: -50, scale: 0.6 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.34, 1.56, 0.64, 1],
      delay: 0.2,
    },
  },
};

function PanelCourses() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [copiedId, setCopiedId] = useState(null);
  const queryClient = useQueryClient();

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['user-enrolled-courses'],
    queryFn: getUserEnrolledCourses,
  });

  useEffect(() => {
    const paymentStatus = searchParams.get('status');
    if (!paymentStatus) return;

    if (paymentStatus === 'success') {
      toast.success('پرداخت با موفقیت انجام شد و لایسنس صادر گردید');
      queryClient.invalidateQueries({ queryKey: ['user-enrolled-courses'] });
      queryClient.invalidateQueries({ queryKey: ['student-dashboard-stats'] });
    } else if (paymentStatus === 'failed') {
      toast.error('پرداخت ناموفق بود یا توسط کاربر لغو شد');
    }

    setSearchParams({});
  }, [queryClient, searchParams, setSearchParams]);

  const handleCopyLicense = async (enrollmentId, licenseKey) => {
    if (!licenseKey) return;
    try {
      await navigator.clipboard.writeText(licenseKey);
      setCopiedId(enrollmentId);
      toast.success('کلید لایسنس اسپات‌پلیر کپی شد');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('امکان کپی خودکار لایسنس وجود ندارد');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-320 w-full items-center justify-center">
        <Spinner className="text-primary-600 h-36 w-36" />
      </div>
    );
  }

  const totalCourses = courses.length;
  const completedCourses = courses.filter(
    (c) => c.is_completed || Number(c.progress_percent) >= 100,
  ).length;
  const inProgressCourses = Math.max(0, totalCourses - completedCourses);

  return (
    <>
      <motion.section
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-6 gap-12 md:grid-cols-3 md:gap-25 lg:pr-12 lg:pl-45"
      >
        <motion.div
          variants={slideFromLeft}
          className="col-span-3 rounded-2xl bg-[#EDF1F8] p-16 shadow-[inset_-3px_-3px_8px_0px_#FFFFFFD9,_inset_4px_4px_10px_0px_#A3B1C68C] md:col-span-1"
        >
          <motion.div
            variants={iconDrop}
            className="bg-primary-600 flex h-36 w-36 items-center justify-center rounded-xl shadow-[0px_4px_12px_0px_#193B7344]"
          >
            <img src="/icons/book-white.svg" alt="book" />
          </motion.div>
          <div className="pt-12">
            <h3 className="text-3xl font-black text-[#1C2B4A]">
              {enToFaDigits(totalCourses)}
            </h3>
          </div>
          <div className="pt-4">
            <p className="text-[11px] font-medium text-[#8A96B0]">
              همه دوره ها
            </p>
          </div>
        </motion.div>

        <motion.div
          variants={slideFromLeft}
          className="col-span-3 rounded-2xl bg-[#EDF1F8] p-16 shadow-[-4px_-4px_12px_0px_#FFFFFFE5,_6px_6px_16px_0px_#A3B1C680] md:col-span-1"
        >
          <motion.div
            variants={iconDrop}
            className="flex h-36 w-36 items-center justify-center rounded-xl bg-[#E8EDF5] shadow-[-2px_-2px_5px_0px_#FFFFFFE5,_3px_3px_7px_0px_#A3B1C673]"
          >
            <img src="/icons/tick-green.svg" alt="tick" />
          </motion.div>
          <div className="pt-12">
            <h3 className="text-3xl font-black text-[#1C2B4A]">
              {enToFaDigits(completedCourses)}
            </h3>
          </div>
          <div className="pt-4">
            <p className="text-[11px] font-medium text-[#8A96B0]">تکمیل شده</p>
          </div>
        </motion.div>

        <motion.div
          variants={slideFromLeft}
          className="col-span-6 rounded-2xl bg-[#EDF1F8] p-16 shadow-[-4px_-4px_12px_0px_#FFFFFFE5,_6px_6px_16px_0px_#A3B1C680] md:col-span-1"
        >
          <motion.div
            variants={iconDrop}
            className="flex h-36 w-36 items-center justify-center rounded-xl bg-[#E8EDF5] shadow-[-2px_-2px_5px_0px_#FFFFFFE5,_3px_3px_7px_0px_#A3B1C673]"
          >
            <img src="/icons/clock-brown.svg" alt="clock" />
          </motion.div>
          <div className="pt-12">
            <h3 className="text-3xl font-black text-[#1C2B4A]">
              {enToFaDigits(inProgressCourses)}
            </h3>
          </div>
          <div className="pt-4">
            <p className="text-[11px] font-medium text-[#8A96B0]">
              در حال یادگیری
            </p>
          </div>
        </motion.div>
      </motion.section>

      {courses.length === 0 ? (
        <div className="mt-25 flex flex-col items-center justify-center gap-14 rounded-2xl bg-[#EDF1F8] p-32 text-center shadow-[-4px_-4px_12px_0px_#FFFFFFE5,_6px_6px_16px_0px_#A3B1C680] lg:pr-32 lg:pl-65">
          <p className="text-sm font-bold text-[#1C2B4A]">
            هنوز در هیچ دوره‌ای ثبت‌نام نکرده‌اید.
          </p>
          <Link
            to="/archive"
            className="to-primary-600 rounded-xl bg-gradient-to-br from-[#1E4D9C] px-20 py-10 text-xs font-bold text-white shadow-[3px_3px_10px_#193B7359]"
          >
            مشاهده لیست دوره‌ها
          </Link>
        </div>
      ) : (
        <motion.section
          variants={container}
          initial="hidden"
          animate="show"
          className="mt-25 grid grid-cols-3 gap-12 sm:grid-cols-4 sm:gap-25 lg:grid-cols-3 lg:pr-32 lg:pl-65"
        >
          {courses.map((item, idx) => {
            const progress = Math.min(
              100,
              Math.max(0, Number(item.progress_percent ?? 0)),
            );
            const isCompleted = Boolean(item.is_completed || progress >= 100);
            const licenseKey = item.license_key || item.licenseKey || '';
            const cardKey = item.enrollment_id || item.course_id || idx;
            const courseUrl = item.slug ? `/course/${item.slug}` : '/archive';

            return (
              <motion.div
                key={cardKey}
                variants={slideFromLeft}
                className="col-span-3 flex flex-col justify-between overflow-hidden rounded-2xl bg-[#EDF1F8] pb-14 shadow-[-4px_-4px_12px_0px_#FFFFFFE5,_6px_6px_16px_0px_#A3B1C680] sm:col-span-2 lg:col-span-1"
              >
                <div>
                  <div className="relative h-220 w-full overflow-hidden">
                    <img
                      src={item.cover_url || '/images/linux.png'}
                      alt={item.title || 'course'}
                      className="absolute inset-0 z-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 z-10 bg-[linear-gradient(0deg,rgba(15,30,70,0.6)_0%,rgba(15,30,70,0)_60%)]" />
                  </div>

                  <div className="flex flex-col gap-6 p-14">
                    <h3 className="text-[14px] font-black text-[#1C2B4A]">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-4">
                      <p className="text-xs font-normal text-[#8A96B0]">
                        {item.instructor_name || 'مدرس آکادمی کدکدا'}
                      </p>
                      <img src="/icons/user.svg" alt="user" />
                    </div>
                  </div>
                </div>

                <div className="px-14">
                  {licenseKey && (
                    <div className="mb-10 flex items-center justify-between gap-8 rounded-xl bg-[#E4E9F2] px-10 py-8 shadow-[inset_-2px_-2px_4px_0px_#FFFFFFCC,_inset_2px_2px_5px_0px_#A3B1C666]">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-[#8A96B0]">
                          لایسنس اسپات‌پلیر:
                        </p>
                        <p
                          dir="ltr"
                          className="truncate font-mono text-[11px] font-bold text-[#1C2B4A]"
                        >
                          {licenseKey}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyLicense(cardKey, licenseKey)}
                        className="text-primary-600 shrink-0 cursor-pointer rounded-lg bg-[#EDF1F8] px-8 py-4 text-[10px] font-bold shadow-[-2px_-2px_4px_0px_#FFFFFFE5,_2px_2px_5px_0px_#A3B1C673]"
                      >
                        {copiedId === cardKey ? 'کپی شد' : 'کپی لایسنس'}
                      </button>
                    </div>
                  )}

                  <div className="border-t border-t-[#A3B1C64D] pt-10">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-[#8A96B0]">
                        {enToFaDigits(progress)}٪ تکمیل
                      </p>
                      <div className="flex gap-2">
                        <img src="/icons/star-line.svg" alt="star-line" />
                        <img src="/icons/star.svg" alt="star" />
                        <img src="/icons/star.svg" alt="star" />
                        <img src="/icons/star.svg" alt="star" />
                        <img src="/icons/star.svg" alt="star" />
                      </div>
                    </div>

                    {isCompleted ? (
                      <div className="mt-6 h-6 w-full rounded-full bg-[linear-gradient(90deg,rgba(5,150,105,0.8)_0%,#059669_100%)] shadow-[inset_-1px_-1px_2px_0px_#FFFFFFB2,_inset_1px_1px_3px_0px_#A3B1C666]" />
                    ) : (
                      <div className="mt-6 h-6 w-full rounded-full bg-[#A3B1C64D] shadow-[inset_-1px_-1px_2px_0px_#FFFFFFB2,_inset_1px_1px_3px_0px_#A3B1C666]">
                        <div
                          style={{ width: `${progress}%` }}
                          className="h-full rounded-full bg-[linear-gradient(90deg,rgba(25,59,115,0.8)_0%,#193B73_100%)]"
                        />
                      </div>
                    )}

                    <Link
                      to={courseUrl}
                      className={
                        isCompleted
                          ? 'text-primary-600 hover:bg-primary-600 mt-12 block w-full cursor-pointer rounded-xl py-8 text-center text-xs font-black shadow-[-2px_-2px_5px_0px_#FFFFFFE5,_3px_3px_7px_0px_#A3B1C673] transition duration-300 hover:text-white hover:shadow-[3px_3px_10px_0px_#193B7359]'
                          : 'mt-12 block w-full cursor-pointer rounded-xl bg-gradient-to-br from-[#1E4D9C] to-[#193B73] py-8 text-center text-xs font-black text-white shadow-[3px_3px_10px_#193B7359] transition duration-300'
                      }
                    >
                      {isCompleted ? 'مشاهده دوره →' : '← ادامه یادگیری'}
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.section>
      )}
    </>
  );
}

export default PanelCourses;
