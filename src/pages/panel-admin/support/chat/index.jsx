import { useEffect, useRef, useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link, useSearchParams } from 'react-router';
import { toast } from 'sonner';

import Spinner from '../../../../components/ui/Spinner';
import {
  getAdminTickets,
  getTicketMessages,
  replyTicket,
  updateTicketStatus,
} from '../../../../services/supportApi';
import InfoChip from './InfoChip.jsx';
import MessageBubble from './MessageBubble';

const inputClass =
  'w-full resize-none rounded-xl bg-[#E4E9F2] px-14 py-12 text-[11px] leading-relaxed text-[#1C2B4A] placeholder-[#8A96B0] shadow-[inset_-2px_-2px_4px_0px_#FFFFFFCC,_inset_2px_2px_5px_0px_#A3B1C666] outline-none transition';

const mapStatusCodeToLabel = (status) => {
  if (status === 'closed' || status === 'بسته شده') return 'بسته شده';
  if (status === 'answered' || status === 'در حال بررسی') return 'در حال بررسی';
  return 'باز';
};

const mapLabelToStatusCode = (label) => {
  if (label === 'بسته شده' || label === 'closed') return 'closed';
  if (label === 'در حال بررسی' || label === 'answered') return 'answered';
  return 'open';
};

function PanelAdminTicketDetail() {
  const [searchParams] = useSearchParams();
  const ticketIdParam = searchParams.get('id');
  const queryClient = useQueryClient();

  const { data: adminTickets, isLoading: listLoading } = useQuery({
    queryKey: ['admin-tickets'],
    queryFn: () => getAdminTickets(),
  });

  const rawTickets = Array.isArray(adminTickets)
    ? adminTickets
    : Array.isArray(adminTickets?.data)
      ? adminTickets.data
      : Array.isArray(adminTickets?.tickets)
        ? adminTickets.tickets
        : [];

  const matchedTicket =
    rawTickets.find((t) => String(t.id) === String(ticketIdParam)) ||
    rawTickets[0] ||
    {};

  const activeTicketId = ticketIdParam || matchedTicket.id;

  const { data: ticketMessagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['ticket-messages', activeTicketId],
    queryFn: () => getTicketMessages(activeTicketId),
    enabled: Boolean(activeTicketId),
  });

  const ticketObj =
    ticketMessagesData?.ticket || ticketMessagesData || matchedTicket || {};

  const rawMessages = Array.isArray(ticketMessagesData)
    ? ticketMessagesData
    : Array.isArray(ticketMessagesData?.messages)
      ? ticketMessagesData.messages
      : Array.isArray(ticketObj?.messages)
        ? ticketObj.messages
        : [];

  const studentFullName = ticketObj.user
    ? `${ticketObj.user.first_name || ''} ${ticketObj.user.last_name || ''}`.trim() ||
      ticketObj.user.mobile
    : matchedTicket.user
      ? `${matchedTicket.user.first_name || ''} ${matchedTicket.user.last_name || ''}`.trim() ||
        matchedTicket.user.mobile
      : 'دانشجوی کدکدا';

  const studentEmail =
    ticketObj.user?.email ||
    matchedTicket.user?.email ||
    ticketObj.user?.mobile ||
    'student@kadcoda.ir';

  const mappedMessages = rawMessages.map((msg, idx) => {
    const senderRole = msg.sender?.role || msg.sender_role || '';
    const isSupport =
      senderRole === 'admin' ||
      senderRole === 'support' ||
      msg.sender === 'support';
    const senderName = msg.sender
      ? `${msg.sender.first_name || ''} ${msg.sender.last_name || ''}`.trim() ||
        (isSupport ? 'پشتیبانی کدکدا' : studentFullName)
      : isSupport
        ? 'پشتیبانی کدکدا'
        : studentFullName;

    return {
      id: msg.id || idx + 1,
      sender: isSupport ? 'support' : 'student',
      name: senderName,
      avatar: senderName.charAt(0) || 'ک',
      time: msg.created_at
        ? new Date(msg.created_at).toLocaleDateString('fa-IR')
        : msg.time || '۱۴۰۳/۰۵/۱۲',
      text: msg.message || msg.text || '',
      attachments: Array.isArray(msg.attachments)
        ? msg.attachments.map((att, attIdx) =>
            typeof att === 'string'
              ? { id: attIdx + 1, name: att, type: 'file' }
              : att,
          )
        : [],
    };
  });

  const currentStatusLabel = mapStatusCodeToLabel(
    ticketObj.status || matchedTicket.status || 'open',
  );

  const ticket = {
    id: ticketObj.tracking_code || matchedTicket.tracking_code || 'TK-1042',
    subject:
      ticketObj.title ||
      matchedTicket.title ||
      ticketObj.subject ||
      'گفتگوی پشتیبانی',
    student: {
      name: studentFullName,
      email: studentEmail,
      avatar: studentFullName.charAt(0) || 'د',
    },
    department:
      ticketObj.department || matchedTicket.department || 'فنی و پشتیبانی',
    departmentClass: 'bg-[#DCE5F4] text-[#193B73]',
    priority:
      ticketObj.priority === 'high' || matchedTicket.priority === 'high'
        ? 'بالا'
        : 'متوسط',
    status: currentStatusLabel,
    statusClass:
      currentStatusLabel === 'بسته شده'
        ? 'bg-[#ECEFF4] text-[#8A96B0]'
        : currentStatusLabel === 'در حال بررسی'
          ? 'bg-[#FFF3DC] text-[#B07D00]'
          : 'bg-[#DCFCE7] text-[#15803D]',
    createdAt: ticketObj.created_at
      ? new Date(ticketObj.created_at).toLocaleDateString('fa-IR')
      : '۱۴۰۳/۰۵/۱۲',
    lastUpdate: ticketObj.updated_at
      ? new Date(ticketObj.updated_at).toLocaleDateString('fa-IR')
      : '۱۴۰۳/۰۵/۱۲',
    messages: mappedMessages,
  };

  const [reply, setReply] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mappedMessages.length]);

  const replyMutation = useMutation({
    mutationFn: (messageText) =>
      replyTicket(activeTicketId, {
        message: messageText,
        attachments: [],
      }),
    onSuccess: () => {
      setReply('');
      toast.success('پاسخ شما با موفقیت ارسال شد.');
      queryClient.invalidateQueries({
        queryKey: ['ticket-messages', activeTicketId],
      });
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
    },
    onError: (err) => {
      toast.error(err?.message || 'خطا در ارسال پاسخ.');
    },
  });

  const statusMutation = useMutation({
    mutationFn: (nextStatusCode) =>
      updateTicketStatus(activeTicketId, nextStatusCode),
    onSuccess: () => {
      toast.success('وضعیت تیکت بروزرسانی شد.');
      queryClient.invalidateQueries({
        queryKey: ['ticket-messages', activeTicketId],
      });
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
    },
    onError: (err) => {
      toast.error(err?.message || 'خطا در تغییر وضعیت تیکت.');
    },
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!reply.trim() || !activeTicketId) return;
    replyMutation.mutate(reply.trim());
  };

  const handleStatusChange = (e) => {
    const label = e.target.value;
    if (!activeTicketId) return;
    statusMutation.mutate(mapLabelToStatusCode(label));
  };

  const handleCloseTicket = () => {
    if (!activeTicketId) return;
    statusMutation.mutate('closed');
  };

  if (listLoading || messagesLoading) {
    return <Spinner />;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="rounded-2xl bg-[#EDF1F8] p-20 shadow-[-4px_-4px_12px_0px_#FFFFFFE5,_6px_6px_16px_0px_#A3B1C680]"
      >
        <div className="flex flex-wrap items-center justify-between gap-12">
          <div className="flex items-center gap-12">
            <Link
              to="/panel-admin/support"
              aria-label="بازگشت"
              className="flex h-40 w-40 shrink-0 items-center justify-center rounded-xl bg-[#E4E9F2] text-[#8A96B0] shadow-[inset_-2px_-2px_4px_0px_#FFFFFFCC,_inset_2px_2px_5px_0px_#A3B1C666] transition hover:text-[#1C2B4A]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-18 w-18"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
            <div>
              <div className="flex flex-wrap items-center gap-10">
                <span dir="ltr" className="text-primary-600 text-xs font-black">
                  {ticket.id}
                </span>
                <span
                  className={`rounded-full px-12 py-4 text-[10px] font-bold ${ticket.statusClass}`}
                >
                  {ticket.status}
                </span>
                <span
                  className={`rounded-full px-12 py-4 text-[10px] font-bold ${ticket.departmentClass}`}
                >
                  {ticket.department}
                </span>
                {ticket.priority === 'بالا' && (
                  <span className="rounded-full bg-[#FEE2E2] px-12 py-4 text-[10px] font-bold text-[#B91C1C]">
                    اولویت بالا
                  </span>
                )}
              </div>
              <h1 className="mt-6 text-sm font-black text-[#1C2B4A]">
                {ticket.subject}
              </h1>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.05, ease: 'easeOut' }}
        className="mt-20 grid grid-cols-2 gap-12 rounded-2xl bg-[#EDF1F8] p-20 shadow-[-4px_-4px_12px_0px_#FFFFFFE5,_6px_6px_16px_0px_#A3B1C680] md:grid-cols-4"
      >
        <InfoChip label="دانشجو">
          <div className="flex items-center gap-8">
            <span className="to-primary-600 flex h-32 w-32 items-center justify-center rounded-lg bg-gradient-to-br from-[#1E4D9C] text-[10px] font-black text-white shadow-[2px_2px_6px_0px_#193B734D]">
              {ticket.student.avatar}
            </span>
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold text-[#1C2B4A]">
                {ticket.student.name}
              </span>
              <span className="text-[9px] text-[#8A96B0]" dir="ltr">
                {ticket.student.email}
              </span>
            </div>
          </div>
        </InfoChip>
        <InfoChip label="تاریخ ایجاد">
          <span className="text-[11px] font-bold text-[#1C2B4A]">
            {ticket.createdAt}
          </span>
        </InfoChip>
        <InfoChip label="آخرین به‌روزرسانی">
          <span className="text-[11px] font-bold text-[#1C2B4A]">
            {ticket.lastUpdate}
          </span>
        </InfoChip>
        <InfoChip label="وضعیت تیکت">
          <select
            value={ticket.status}
            onChange={handleStatusChange}
            disabled={statusMutation.isPending}
            className="w-full cursor-pointer rounded-xl bg-[#E4E9F2] px-10 py-8 text-[11px] font-bold text-[#1C2B4A] shadow-[inset_-2px_-2px_4px_0px_#FFFFFFCC,_inset_2px_2px_5px_0px_#A3B1C666] outline-none"
          >
            <option value="باز">باز</option>
            <option value="در حال بررسی">در حال بررسی</option>
            <option value="بسته شده">بسته شده</option>
          </select>
        </InfoChip>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
        className="mt-20 rounded-2xl bg-[#EDF1F8] p-20 shadow-[-4px_-4px_12px_0px_#FFFFFFE5,_6px_6px_16px_0px_#A3B1C680]"
      >
        <h2 className="relative mb-20 w-fit text-sm font-black text-[#1C2B4A]">
          گفتگو
          <span className="bg-secondary-300 absolute top-2 -left-10 h-16 w-4 rounded-full shadow-[0px_0px_6px_0px_#F7B928AA]"></span>
        </h2>

        <div className="flex flex-col gap-20">
          {ticket.messages.map((msg, i) => (
            <MessageBubble key={msg.id} message={msg} index={i} />
          ))}
          {ticket.messages.length === 0 && (
            <p className="py-12 text-center text-xs font-bold text-[#8A96B0]">
              هنوز پیامی در این تیکت ثبت نشده است.
            </p>
          )}
          <div ref={chatEndRef} />
        </div>
      </motion.div>

      <motion.form
        onSubmit={handleSend}
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
        className="mt-20 rounded-2xl bg-[#EDF1F8] p-20 shadow-[-4px_-4px_12px_0px_#FFFFFFE5,_6px_6px_16px_0px_#A3B1C680]"
      >
        <h2 className="relative mb-20 w-fit text-sm font-black text-[#1C2B4A]">
          پاسخ شما
          <span className="bg-primary-600 absolute top-2 -right-10 h-16 w-4 rounded-full shadow-[0px_0px_6px_0px_#193B7388]"></span>
        </h2>

        <textarea
          rows={5}
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="پاسخ خود را بنویسید..."
          className={inputClass}
        />

        <div className="mt-16 flex flex-col-reverse gap-12 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-10">
            <button
              type="button"
              aria-label="پیوست فایل"
              className="hover:text-primary-600 flex h-40 w-40 cursor-pointer items-center justify-center rounded-xl bg-[#E4E9F2] text-[#8A96B0] shadow-[inset_-2px_-2px_4px_0px_#FFFFFFCC,_inset_2px_2px_5px_0px_#A3B1C666] transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="h-18 w-18"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13"
                />
              </svg>
            </button>
            <span className="text-[10px] text-[#8A96B0]">
              پیوست تصویر یا فایل (حداکثر ۵ مگابایت)
            </span>
          </div>

          <div className="flex items-center gap-10">
            <button
              type="button"
              onClick={handleCloseTicket}
              disabled={
                statusMutation.isPending || ticket.status === 'بسته شده'
              }
              className="cursor-pointer rounded-xl bg-[#EDF1F8] px-20 py-12 text-[11px] font-bold text-[#8A96B0] shadow-[-3px_-3px_7px_0px_#FFFFFFE5,_4px_4px_10px_0px_#A3B1C673] transition duration-200 hover:text-[#1C2B4A] disabled:cursor-not-allowed disabled:opacity-50"
            >
              بستن تیکت
            </button>
            <button
              type="submit"
              disabled={!reply.trim() || replyMutation.isPending}
              className={`to-primary-600 inline-flex items-center gap-8 rounded-xl bg-gradient-to-br from-[#1E4D9C] px-20 py-12 text-[11px] font-black whitespace-nowrap text-white shadow-[3px_3px_8px_0px_#193B734D] transition duration-200 hover:brightness-110 ${
                !reply.trim() || replyMutation.isPending
                  ? 'cursor-not-allowed opacity-50'
                  : 'cursor-pointer'
              }`}
            >
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
                  d="M6 12 3.269 3.126A59.768 59.768 0 0 1 21.485 12 59.77 59.77 0 0 1 3.27 20.876L5.999 12Zm0 0h7.5"
                />
              </svg>
              {replyMutation.isPending ? 'در حال ارسال...' : 'ارسال پاسخ'}
            </button>
          </div>
        </div>
      </motion.form>
    </>
  );
}

export default PanelAdminTicketDetail;
