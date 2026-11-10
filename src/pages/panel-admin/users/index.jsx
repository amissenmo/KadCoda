import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router';

import Spinner from '../../../components/ui/Spinner';
import { listUsers } from '../../../services/adminApi';

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const rowAnim = {
  hidden: { opacity: 0, x: -40 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.45, ease: 'easeOut' },
  },
};

const formatRole = (role) => {
  if (role === 'admin') {
    return {
      label: 'مدیر',
      roleClass: 'bg-[#FEE2E2] text-[#B91C1C]',
      color: 'from-[#7F1D1D] to-[#EF4444]',
    };
  }
  if (role === 'teacher' || role === 'instructor') {
    return {
      label: 'مدرس',
      roleClass: 'bg-[#FFF3DC] text-[#B07D00]',
      color: 'from-[#B07D00] to-[#F7B928]',
    };
  }
  return {
    label: 'دانشجو',
    roleClass: 'bg-[#DCE5F4] text-[#193B73]',
    color: 'from-[#1E4D9C] to-primary-600',
  };
};

function PanelAdminUsers() {
  const [search, setSearch] = useState('');

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => listUsers({ search: search.trim() || undefined }),
  });

  const rawUsers = Array.isArray(usersData)
    ? usersData
    : Array.isArray(usersData?.data)
      ? usersData.data
      : Array.isArray(usersData?.users)
        ? usersData.users
        : [];

  const users = rawUsers.map((u, idx) => {
    const fullName =
      `${u.first_name || ''} ${u.last_name || ''}`.trim() ||
      u.name ||
      u.mobile ||
      `کاربر #${idx + 1}`;
    const roleMeta = formatRole(u.role);
    const joinedDate = u.created_at
      ? new Date(u.created_at).toLocaleDateString('fa-IR')
      : u.joined || '۱۴۰۳/۰۵/۱۲';

    return {
      id: u.id || idx + 1,
      name: fullName,
      email: u.email || '—',
      role: roleMeta.label,
      roleClass: roleMeta.roleClass,
      mobile: u.mobile || '—',
      courses: Number(u.courses_count ?? u.courses ?? 0),
      joined: joinedDate,
      avatar: fullName.charAt(0) || 'ک',
      color: roleMeta.color,
    };
  });

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
            <h1 className="text-xl font-black text-white">مدیریت کاربران</h1>
            <p className="pt-8 text-[12px] text-[#FFFFFF80]">
              مشاهده، ویرایش و مدیریت تمام کاربران پلتفرم
            </p>
          </div>

          <div className="absolute -top-11 -left-28 h-160 w-160 rounded-full bg-[#FFFFFF0A]"></div>
        </div>
      </motion.div>

      <motion.section
        variants={container}
        initial="hidden"
        animate="show"
        className="mt-25"
      >
        <motion.div
          variants={rowAnim}
          className="rounded-2xl bg-[#EDF1F8] p-20 shadow-[-4px_-4px_12px_0px_#FFFFFFE5,_6px_6px_16px_0px_#A3B1C680]"
        >
          <div className="flex flex-wrap items-center justify-between gap-12">
            <span className="relative text-sm font-black text-[#1C2B4A]">
              لیست کاربران
              <span className="bg-secondary-300 absolute top-2 -left-10 h-16 w-4 rounded-full shadow-[0px_0px_6px_0px_#F7B928AA]"></span>
            </span>

            <div className="flex items-center gap-10">
              <div className="flex items-center gap-8 rounded-xl bg-[#E4E9F2] px-12 py-8 shadow-[inset_-2px_-2px_4px_0px_#FFFFFFCC,_inset_2px_2px_5px_0px_#A3B1C666]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                  stroke="currentColor"
                  className="h-16 w-16 text-[#8A96B0]"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-4.35-4.35M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"
                  />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="جستجوی کاربر..."
                  className="w-160 bg-transparent text-[11px] text-[#1C2B4A] placeholder-[#8A96B0] outline-none"
                />
              </div>

              <span className="text-primary-600 rounded-full bg-[#DCE5F4] px-12 py-4 text-[11px] font-bold">
                {users.length.toLocaleString('fa-IR')} کاربر
              </span>
            </div>
          </div>

          {isLoading ? (
            <Spinner />
          ) : (
            <div className="mt-20 overflow-x-auto">
              <table className="w-full min-w-700 border-separate border-spacing-y-8">
                <thead>
                  <tr>
                    <th className="text-right text-[11px] font-bold text-[#8A96B0]">
                      کاربر
                    </th>
                    <th className="text-center text-[11px] font-bold text-[#8A96B0]">
                      نقش
                    </th>
                    <th className="text-center text-[11px] font-bold text-[#8A96B0]">
                      شماره موبایل
                    </th>
                    <th className="text-center text-[11px] font-bold text-[#8A96B0]">
                      تعداد دوره‌ها
                    </th>
                    <th className="text-center text-[11px] font-bold text-[#8A96B0]">
                      تاریخ عضویت
                    </th>
                    <th className="text-center text-[11px] font-bold text-[#8A96B0]">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <motion.tr
                      key={user.id}
                      variants={rowAnim}
                      className="group"
                    >
                      <td className="rounded-r-xl bg-[#E4E9F2] p-12 shadow-[inset_-2px_-2px_4px_0px_#FFFFFFCC,_inset_2px_2px_5px_0px_#A3B1C666]">
                        <div className="flex items-center gap-10">
                          <span
                            className={`flex h-40 w-40 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${user.color} text-xs font-black text-white shadow-[3px_3px_8px_0px_#193B734D]`}
                          >
                            {user.avatar}
                          </span>
                          <div className="flex flex-col gap-2">
                            <span className="text-xs font-bold text-[#1C2B4A]">
                              {user.name}
                            </span>
                            <span className="text-[10px] text-[#8A96B0]">
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="bg-[#E4E9F2] p-12 text-center shadow-[inset_0_-2px_4px_0px_#FFFFFFCC,_inset_0_2px_5px_0px_#A3B1C666]">
                        <span
                          className={`rounded-full px-12 py-4 text-[10px] font-bold ${user.roleClass}`}
                        >
                          {user.role}
                        </span>
                      </td>

                      <td className="bg-[#E4E9F2] p-12 text-center shadow-[inset_0_-2px_4px_0px_#FFFFFFCC,_inset_0_2px_5px_0px_#A3B1C666]">
                        <span
                          dir="ltr"
                          className="text-[11px] font-bold text-[#1C2B4A]"
                        >
                          {user.mobile}
                        </span>
                      </td>

                      <td className="bg-[#E4E9F2] p-12 text-center shadow-[inset_0_-2px_4px_0px_#FFFFFFCC,_inset_0_2px_5px_0px_#A3B1C666]">
                        <span className="text-primary-600 text-xs font-black">
                          {user.courses.toLocaleString('fa-IR')}
                        </span>
                      </td>

                      <td className="bg-[#E4E9F2] p-12 text-center shadow-[inset_0_-2px_4px_0px_#FFFFFFCC,_inset_0_2px_5px_0px_#A3B1C666]">
                        <span className="text-[11px] font-bold text-[#1C2B4A]">
                          {user.joined}
                        </span>
                      </td>

                      <td className="rounded-l-xl bg-[#E4E9F2] p-12 text-center shadow-[inset_-2px_-2px_4px_0px_#FFFFFFCC,_inset_2px_2px_5px_0px_#A3B1C666]">
                        <Link
                          to={`/panel-admin/editUser?id=${user.id}`}
                          type="button"
                          aria-label="ویرایش کاربر"
                          className="to-primary-600 inline-flex h-36 w-36 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-br from-[#1E4D9C] text-white shadow-[3px_3px_8px_0px_#193B734D] transition duration-200 hover:brightness-110"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.8}
                            stroke="currentColor"
                            className="h-16 w-16"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
                            />
                          </svg>
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="rounded-xl bg-[#E4E9F2] p-20 text-center text-xs font-bold text-[#8A96B0]"
                      >
                        هیچ کاربری یافت نشد.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </motion.section>
    </>
  );
}

export default PanelAdminUsers;
