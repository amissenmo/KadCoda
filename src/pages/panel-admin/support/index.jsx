import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router';

import FilterSelect from '../../../components/ui/FilterSelect';
import Spinner from '../../../components/ui/Spinner';
import { getAdminTickets } from '../../../services/supportApi';

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

const departments = [
  { value: 'all', label: 'همه دپارتمان‌ها' },
  { value: 'technical', label: 'فنی و پشتیبانی' },
  { value: 'financial', label: 'مالی و پرداخت' },
  { value: 'educational', label: 'آموزشی' },
  { value: 'other', label: 'سایر' },
];

const statuses = [
  { value: 'all', label: 'همه وضعیت‌ها' },
  { value: 'open', label: 'باز' },
  { value: 'answered', label: 'پاسخ داده شده' },
  { value: 'closed', label: 'بسته شده' },
];

const priorities = [
  { value: 'all', label: 'همه اولویت‌ها' },
  { value: 'high', label: 'بالا' },
  { value: 'medium', label: 'متوسط' },
  { value: 'low', label: 'پایین' },
];

const mapDepartmentLabel = (dep) => {
  if (dep === 'technical' || dep === 'فنی') return 'فنی و پشتیبانی';
  if (dep === 'financial' || dep === 'مالی') return 'مالی و پرداخت';
  if (dep === 'educational' || dep === 'آموزشی') return 'آموزشی';
  return dep || 'فنی و پشتیبانی';
};

const mapPriorityLabel = (p) => {
  if (p === 'high' || p === 'urgent' || p === 'بالا') return 'بالا';
  if (p === 'low' || p === 'پایین') return 'پایین';
  return 'متوسط';
};

const mapStatusMeta = (st) => {
  if (st === 'closed' || st === 'بسته شده') {
    return { label: 'بسته شده', statusClass: 'bg-[#ECEFF4] text-[#8A96B0]' };
  }
  if (st === 'answered' || st === 'پاسخ داده شده') {
    return {
      label: 'در حال بررسی',
      statusClass: 'bg-[#FFF3DC] text-[#B07D00]',
    };
  }
  return { label: 'باز', statusClass: 'bg-[#DCFCE7] text-[#15803D]' };
};

function PanelAdminSupport() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['admin-tickets', statusFilter, departmentFilter],
    queryFn: () =>
      getAdminTickets({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        department: departmentFilter !== 'all' ? departmentFilter : undefined,
      }),
  });

  const rawTickets = Array.isArray(ticketsData)
    ? ticketsData
    : Array.isArray(ticketsData?.data)
      ? ticketsData.data
      : Array.isArray(ticketsData?.tickets)
        ? ticketsData.tickets
        : [];

  const tickets = rawTickets
    .map((t, idx) => {
      const studentName = t.user
        ? `${t.user.first_name || ''} ${t.user.last_name || ''}`.trim() ||
          t.user.mobile
        : t.student_name || t.student || 'دانشجوی کدکدا';
      const statusMeta = mapStatusMeta(t.status);

      return {
        rawId: t.id || idx + 1,
        trackingCode: t.tracking_code || t.id || `TK-${1040 + idx}`,
        subject: t.title || t.subject || 'درخواست پشتیبانی',
        student: studentName,
        department: mapDepartmentLabel(t.department),
        priority: mapPriorityLabel(t.priority),
        rawPriority: t.priority || 'medium',
        status: statusMeta.label,
        statusClass: statusMeta.statusClass,
        date: t.created_at
          ? new Date(t.created_at).toLocaleDateString('fa-IR')
          : t.date || '۱۴۰۳/۰۵/۱۲',
      };
    })
    .filter((ticket) => {
      if (priorityFilter !== 'all' && ticket.rawPriority !== priorityFilter) {
        return false;
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          String(ticket.trackingCode).toLowerCase().includes(q) ||
          ticket.subject.toLowerCase().includes(q) ||
          ticket.student.toLowerCase().includes(q)
        );
      }
      return true;
    });

  return (
    <motion.section
      variants={container}
      initial="hidden"
      animate="show"
      className="rounded-2xl bg-[#EDF1F8] p-20 shadow-[-4px_-4px_12px_0px_#FFFFFFE5,_6px_6px_16px_0px_#A3B1C680]"
    >
      <motion.div variants={rowAnim} className="flex flex-col gap-20">
        <div className="flex flex-wrap items-center justify-between gap-12">
          <span className="relative text-sm font-black text-[#1C2B4A]">
            تیکت‌های پشتیبانی
            <span className="bg-secondary-300 absolute top-2 -left-10 h-16 w-4 rounded-full shadow-[0px_0px_6px_0px_#F7B928AA]"></span>
          </span>

          <span className="text-primary-600 rounded-full bg-[#DCE5F4] px-12 py-4 text-[11px] font-bold">
            {tickets.length.toLocaleString('fa-IR')} تیکت
          </span>
        </div>

        <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-8 rounded-xl bg-[#E4E9F2] px-12 py-8 shadow-[inset_-2px_-2px_4px_0px_#FFFFFFCC,_inset_2px_2px_5px_0px_#A3B1C666] lg:w-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              className="h-16 w-16 shrink-0 text-[#8A96B0]"
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
              placeholder="جستجوی تیکت، موضوع یا دانشجو..."
              className="w-full bg-transparent text-[11px] text-[#1C2B4A] placeholder-[#8A96B0] outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-12 sm:grid-cols-3 lg:w-600">
            <FilterSelect
              options={departments}
              value={departmentFilter}
              onChange={(v) => setDepartmentFilter(v)}
            />
            <FilterSelect
              options={statuses}
              value={statusFilter}
              onChange={(v) => setStatusFilter(v)}
            />
            <FilterSelect
              options={priorities}
              value={priorityFilter}
              onChange={(v) => setPriorityFilter(v)}
            />
          </div>
        </div>
      </motion.div>

      {isLoading ? (
        <Spinner />
      ) : (
        <div className="mt-20 overflow-x-auto">
          <table className="w-full min-w-900 border-separate border-spacing-y-8">
            <thead>
              <tr>
                <th className="text-right text-[11px] font-bold text-[#8A96B0]">
                  شماره تیکت
                </th>
                <th className="text-right text-[11px] font-bold text-[#8A96B0]">
                  موضوع تیکت
                </th>
                <th className="text-right text-[11px] font-bold text-[#8A96B0]">
                  دانشجو
                </th>
                <th className="text-center text-[11px] font-bold text-[#8A96B0]">
                  دپارتمان
                </th>
                <th className="text-center text-[11px] font-bold text-[#8A96B0]">
                  اولویت
                </th>
                <th className="text-center text-[11px] font-bold text-[#8A96B0]">
                  وضعیت
                </th>
                <th className="text-right text-[11px] font-bold text-[#8A96B0]">
                  تاریخ
                </th>
                <th className="text-center text-[11px] font-bold text-[#8A96B0]">
                  عملیات
                </th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <motion.tr key={ticket.rawId} variants={rowAnim}>
                  <td className="rounded-r-xl bg-[#E4E9F2] p-12 shadow-[inset_-2px_-2px_4px_0px_#FFFFFFCC,_inset_2px_2px_5px_0px_#A3B1C666]">
                    <span
                      dir="ltr"
                      className="text-primary-600 text-[11px] font-black"
                    >
                      {ticket.trackingCode}
                    </span>
                  </td>

                  <td className="bg-[#E4E9F2] p-12 shadow-[inset_0_-2px_4px_0px_#FFFFFFCC,_inset_0_2px_5px_0px_#A3B1C666]">
                    <span className="text-[11px] font-bold text-[#1C2B4A]">
                      {ticket.subject}
                    </span>
                  </td>

                  <td className="bg-[#E4E9F2] p-12 shadow-[inset_0_-2px_4px_0px_#FFFFFFCC,_inset_0_2px_5px_0px_#A3B1C666]">
                    <span className="text-[11px] font-bold text-[#1C2B4A]">
                      {ticket.student}
                    </span>
                  </td>

                  <td className="bg-[#E4E9F2] p-12 text-center shadow-[inset_0_-2px_4px_0px_#FFFFFFCC,_inset_0_2px_5px_0px_#A3B1C666]">
                    <span
                      className={`inline-block rounded-full px-12 py-4 text-[10px] font-bold whitespace-nowrap shadow-[inset_-2px_-2px_4px_0px_#FFFFFFD9,_inset_2px_2px_4px_0px_#A3B1C666] ${
                        ticket.department === 'سایر'
                          ? 'bg-[#FEE2E2] text-[#B91C1C]'
                          : 'bg-[#DCE5F4] text-[#193B73]'
                      }`}
                    >
                      {ticket.department}
                    </span>
                  </td>

                  <td className="bg-[#E4E9F2] p-12 text-center shadow-[inset_0_-2px_4px_0px_#FFFFFFCC,_inset_0_2px_5px_0px_#A3B1C666]">
                    {ticket.priority === 'بالا' ? (
                      <span className="inline-block rounded-full bg-[#FEE2E2] px-12 py-4 text-[10px] font-bold whitespace-nowrap text-[#B91C1C] shadow-[inset_-2px_-2px_4px_0px_#FFFFFFD9,_inset_2px_2px_4px_0px_#A3B1C666]">
                        {ticket.priority}
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-[#1C2B4A]">
                        {ticket.priority}
                      </span>
                    )}
                  </td>

                  <td className="bg-[#E4E9F2] p-12 text-center shadow-[inset_0_-2px_4px_0px_#FFFFFFCC,_inset_0_2px_5px_0px_#A3B1C666]">
                    <span
                      className={`rounded-full px-12 py-4 text-[10px] font-bold whitespace-nowrap ${ticket.statusClass}`}
                    >
                      {ticket.status}
                    </span>
                  </td>

                  <td className="bg-[#E4E9F2] p-12 shadow-[inset_0_-2px_4px_0px_#FFFFFFCC,_inset_0_2px_5px_0px_#A3B1C666]">
                    <span className="text-[11px] font-bold text-[#1C2B4A]">
                      {ticket.date}
                    </span>
                  </td>

                  <td className="rounded-l-xl bg-[#E4E9F2] p-12 text-center shadow-[inset_-2px_-2px_4px_0px_#FFFFFFCC,_inset_2px_2px_5px_0px_#A3B1C666]">
                    <Link
                      to={`/panel-admin/ticket?id=${ticket.rawId}`}
                      type="button"
                      className="to-primary-600 inline-flex cursor-pointer items-center gap-8 rounded-xl bg-gradient-to-br from-[#1E4D9C] px-12 py-8 text-[10px] font-black whitespace-nowrap text-white shadow-[3px_3px_8px_0px_#193B734D] transition duration-200 hover:brightness-110"
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
                          d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                        />
                      </svg>
                      پاسخ و گفتگو
                    </Link>
                  </td>
                </motion.tr>
              ))}
              {tickets.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="rounded-xl bg-[#E4E9F2] p-20 text-center text-xs font-bold text-[#8A96B0]"
                  >
                    هیچ تیکتی یافت نشد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </motion.section>
  );
}

export default PanelAdminSupport;
