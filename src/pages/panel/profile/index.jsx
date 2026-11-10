import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Outlet } from 'react-router';

import { useAuth } from '../../../contexts/AuthContext';
import { enToFaDigits } from '../../../services/courseApi';
import { getDashboardStats, getProfile } from '../../../services/studentApi';
import PanelNavItem from '../PanelNavItem';

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

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

function PanelProfile() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ['student-profile'],
    queryFn: getProfile,
  });

  const { data: stats } = useQuery({
    queryKey: ['student-dashboard-stats'],
    queryFn: getDashboardStats,
  });

  const currentUser = profile || user;
  const displayName = currentUser?.full_name || 'دانشجوی کدکدا';
  const userInitial = displayName.trim().charAt(0) || 'ک';
  const subtitle =
    currentUser?.email ||
    (currentUser?.mobile ? enToFaDigits(currentUser.mobile) : '');

  const filledCount = [
    currentUser?.full_name,
    currentUser?.mobile,
    currentUser?.email,
    currentUser?.bio,
  ].filter(Boolean).length;
  const completionPercent = Math.min(100, Math.round((filledCount / 4) * 100));

  return (
    <>
      <motion.section
        variants={slideFromLeft}
        initial="hidden"
        animate="show"
        className="from-primary-600 rounded-2xl bg-gradient-to-br to-[#112552] shadow-[-4px_-4px_12px_0px_#FFFFFF80,_8px_8px_20px_0px_#193B7359] sm:px-26 sm:py-29"
      >
        <motion.div
          variants={textContainer}
          initial="hidden"
          animate="show"
          className="flex h-full w-full flex-col items-center justify-between gap-24 rounded-[20px] bg-[radial-gradient(98.62%_98.62%_at_85%_50%,rgba(247,185,40,0.13)_0%,rgba(247,185,40,0)_55%)] px-10 py-22 sm:flex-row"
        >
          <motion.div
            variants={textContainer}
            initial="hidden"
            animate="show"
            className="flex items-end justify-center gap-20"
          >
            <motion.div
              variants={textDrop}
              className="relative flex h-80 w-80 items-center justify-center rounded-2xl border-4 border-[#FFFFFF26] bg-[#1A4598]"
            >
              <span className="text-2xl font-black text-white">
                {userInitial}
              </span>

              <div className="bg-secondary-300 absolute -bottom-10 -left-12 flex h-28 w-28 items-center justify-center rounded-xl shadow-[2px_2px_8px_0px_#F7B92880]">
                <img src="/icons/camera.svg" alt="camera" />
              </div>
            </motion.div>

            <motion.div
              variants={textContainer}
              initial="hidden"
              animate="show"
            >
              <motion.h2
                variants={textDrop}
                className="text-xl font-black text-white"
              >
                {displayName}
              </motion.h2>
              <motion.p
                variants={textDrop}
                className="pt-4 text-sm font-normal text-[#FFFFFF66]"
              >
                {subtitle}
              </motion.p>
            </motion.div>
          </motion.div>

          <motion.div
            variants={textContainer}
            initial="hidden"
            animate="show"
            className="flex flex-col items-end justify-end gap-8"
          >
            <div className="flex gap-10">
              <motion.div
                variants={textDrop}
                className="flex flex-col items-center justify-center rounded-xl bg-[#FFFFFF14] px-16 py-10 shadow-[inset_1px_1px_4px_0px_#00000033]"
              >
                <p className="text-lg font-black text-white">
                  {enToFaDigits(stats?.enrolled_courses_count ?? 0)}
                </p>
                <p className="pt-4 text-[10px] font-normal text-[#FFFFFF59]">
                  دوره
                </p>
              </motion.div>

              <motion.div
                variants={textDrop}
                className="flex flex-col items-center justify-center rounded-xl bg-[#FFFFFF14] px-16 py-10 shadow-[inset_1px_1px_4px_0px_#00000033]"
              >
                <p className="text-lg font-black text-white">
                  {enToFaDigits(stats?.certificates_count ?? 0)}
                </p>
                <p className="pt-4 text-[10px] font-normal text-[#FFFFFF59]">
                  گواهی
                </p>
              </motion.div>

              <motion.div
                variants={textDrop}
                className="flex flex-col items-center justify-center rounded-xl bg-[#FFFFFF14] px-16 py-10 shadow-[inset_1px_1px_4px_0px_#00000033]"
              >
                <p className="text-lg font-black text-white">
                  {enToFaDigits(stats?.active_tickets_count ?? 0)}
                </p>
                <p className="pt-4 text-[10px] font-normal text-[#FFFFFF59]">
                  تیکت
                </p>
              </motion.div>
            </div>

            <motion.div
              variants={textDrop}
              className="flex items-center justify-end gap-6"
            >
              <div className="flex h-6 w-140 flex-row-reverse justify-self-end rounded-full bg-[#FFFFFF26] sm:w-112">
                <div
                  style={{ width: `${completionPercent}%` }}
                  className="h-full rounded-full bg-[#F7B928]"
                />
              </div>
              <div>
                <span className="text-xs font-semibold text-[#FFFFFF80]">
                  {enToFaDigits(completionPercent)}٪
                </span>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.section>

      <motion.section
        variants={container}
        initial="hidden"
        animate="show"
        className="mt-20 flex flex-col gap-20 md:flex-row"
      >
        <motion.div
          variants={slideFromLeft}
          className="w-full rounded-2xl bg-[#EDF1F8] p-8 shadow-[-4px_-4px_12px_0px_#FFFFFFE5,_6px_6px_16px_0px_#A3B1C680] md:h-212 md:w-176"
        >
          <nav className="flex flex-col gap-4">
            <PanelNavItem
              to="/panel/profile"
              end
              label="اطلاعات"
              icon="/icons/user.svg"
              iconActive="/icons/user-active.svg"
            />

            <PanelNavItem
              to="/panel/profile/security"
              label="امنیت"
              icon="/icons/security.svg"
              iconActive="/icons/security-active.svg"
            />

            <PanelNavItem
              to="/panel/profile/notification"
              label="اعلان‌ها"
              icon="/icons/notif.svg"
              iconActive="/icons/notif-active.svg"
            />
          </nav>
        </motion.div>

        <div className="w-full">
          <Outlet />
        </div>
      </motion.section>
    </>
  );
}

export default PanelProfile;
