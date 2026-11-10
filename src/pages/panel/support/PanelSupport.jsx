import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import Spinner from '../../../components/ui/Spinner';
import { enToFaDigits } from '../../../services/courseApi';
import {
  createTicket,
  getTicketMessages,
  getTickets,
  replyTicket,
} from '../../../services/supportApi';
import { createTicketSchema } from '../../../validation/student.schema';

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
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
    transition: { staggerChildren: 0.08, delayChildren: 0.25 },
  },
};

const formVariants = {
  hidden: {
    opacity: 0,
    x: -100,
    height: 0,
    marginTop: 0,
    transition: { duration: 0.4, ease: 'easeIn' },
  },
  visible: {
    opacity: 1,
    x: 0,
    height: 'auto',
    marginTop: 30,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    x: -100,
    height: 0,
    marginTop: 0,
    transition: { duration: 0.4, ease: 'easeIn' },
  },
};

const formatPersianDate = (isoString) => {
  if (!isoString) return '';
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
};

const getStatusBadge = (status) => {
  switch (status) {
    case 'answered':
      return {
        label: 'پاسخ داده شده',
        dotClass: 'bg-[#5AF2CA] shadow-[0px_0px_5px_0px_#5AF2CA]',
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
        dotClass: 'bg-[#F59E0B] shadow-[0px_0px_5px_0px_#F59E0B88]',
        badgeClass: 'bg-[#DCE5F4] text-primary-600',
      };
    default:
      return {
        label: 'باز',
        dotClass: 'bg-[#EF4444] shadow-[0px_0px_5px_0px_#EF444488]',
        badgeClass: 'bg-[#DCE5F4] text-primary-600',
      };
  }
};

function PanelSupport() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const queryClient = useQueryClient();

  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => getTickets({ page: 1, limit: 50 }),
  });

  const { data: activeTicketDetail, isLoading: isMessagesLoading } = useQuery({
    queryKey: ['ticket-messages', selectedTicketId],
    queryFn: () => getTicketMessages(selectedTicketId),
    enabled: Boolean(selectedTicketId),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      subject: '',
      department: 'فنی و پشتیبانی',
      priority: 'normal',
      message: '',
    },
  });

  const createTicketMutation = useMutation({
    mutationFn: (formData) => createTicket(formData),
    onSuccess: (response) => {
      toast.success(
        response?.message || 'تیکت پشتیبانی شما با موفقیت ثبت گردید',
      );
      reset();
      setIsFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['student-dashboard-stats'] });
    },
    onError: (error) => {
      toast.error(
        error?.userMessage || 'خطا در ثبت تیکت پشتیبانی. دوباره تلاش کنید.',
      );
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({ ticketId, message }) => replyTicket(ticketId, { message }),
    onSuccess: (response) => {
      toast.success(response?.message || 'پاسخ شما با موفقیت ارسال شد');
      setReplyText('');
      queryClient.invalidateQueries({
        queryKey: ['ticket-messages', selectedTicketId],
      });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
    onError: (error) => {
      toast.error(error?.userMessage || 'خطا در ارسال پاسخ تیکت.');
    },
  });

  const onSubmitTicket = (values) => {
    createTicketMutation.mutate(values);
  };

  const handleReplySubmit = (e) => {
    e.preventDefault();
    const trimmed = replyText.trim();
    if (!trimmed || !selectedTicketId) return;
    replyMutation.mutate({ ticketId: selectedTicketId, message: trimmed });
  };

  const tickets = ticketsData?.items || [];
  const activeCount = tickets.filter((t) => t.status !== 'closed').length;

  return (
    <>
      <motion.section
        initial="hidden"
        animate="show"
        variants={textContainer}
        className="mt-20 flex items-center justify-between"
      >
        <motion.div variants={textContainer} initial="hidden" animate="show">
          <motion.h2
            variants={textDrop}
            className="text-xl font-black text-[#1C2B4A]"
          >
            پشتیبانی
          </motion.h2>
          <motion.p
            variants={textDrop}
            className="pt-2 text-xs font-normal text-[#8A96B0]"
          >
            {enToFaDigits(activeCount)} تیکت فعال
          </motion.p>
        </motion.div>

        <motion.div variants={textDrop}>
          <button
            type="button"
            onClick={() => setIsFormOpen((p) => !p)}
            className="to-primary-600 cursor-pointer rounded-xl bg-gradient-to-br from-[#1E4D9C] px-20 py-10 text-xs font-bold text-white shadow-[-2px_-2px_6px_0px_#FFFFFF80,_4px_4px_12px_0px_#193B7359] transition duration-300 hover:-translate-y-3"
          >
            {isFormOpen ? 'بستن' : 'تیکت جدید'}
          </button>
        </motion.div>
      </motion.section>

      <AnimatePresence initial={false}>
        {isFormOpen && (
          <motion.form
            key="ticket-form"
            onSubmit={handleSubmit(onSubmitTicket)}
            variants={formVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="overflow-hidden rounded-2xl bg-[#EDF1F8] p-20 shadow-[inset_-3px_-3px_8px_0px_#FFFFFFD9,_inset_4px_4px_10px_0px_#A3B1C68C]"
          >
            <h3 className="text-sm font-black text-[#1C2B4A]">تیکت جدید</h3>

            <div className="grid grid-cols-1 gap-12 pt-12 sm:grid-cols-2">
              <div className="flex flex-col gap-6">
                <p className="text-[11px] font-bold text-[#8A96B0]">موضوع</p>
                <input
                  type="text"
                  {...register('subject')}
                  className="rounded-xl py-10 pr-16 pl-16 text-right text-xs text-[#0e1727dc] shadow-[inset_-2px_-2px_5px_0px_#FFFFFFD9,_inset_3px_3px_7px_0px_#A3B1C680] placeholder:text-right placeholder:text-xs placeholder:text-[#1C2B4A80] sm:text-sm sm:placeholder:text-sm"
                  placeholder="موضوع مشکل یا سوال..."
                />
                {errors.subject && (
                  <span className="text-[11px] font-medium text-red-500">
                    {errors.subject.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-6">
                <p className="text-[11px] font-bold text-[#8A96B0]">
                  واحد پشتیبانی
                </p>
                <select
                  {...register('department')}
                  className="rounded-xl bg-[#EDF1F8] px-16 py-10 text-right text-xs text-[#0e1727dc] shadow-[inset_-2px_-2px_5px_0px_#FFFFFFD9,_inset_3px_3px_7px_0px_#A3B1C680] sm:text-sm"
                >
                  <option value="فنی و پشتیبانی">فنی و پشتیبانی</option>
                  <option value="آموزش و دوره‌ها">آموزش و دوره‌ها</option>
                  <option value="مالی و فروش">مالی و فروش</option>
                </select>
                {errors.department && (
                  <span className="text-[11px] font-medium text-red-500">
                    {errors.department.message}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-6 pt-12">
              <p className="text-[11px] font-bold text-[#8A96B0]">توضیحات</p>
              <textarea
                {...register('message')}
                className="min-h-88 rounded-xl px-16 py-10 text-right text-xs text-[#0e1727dc] shadow-[inset_-2px_-2px_5px_0px_#FFFFFFD9,_inset_3px_3px_7px_0px_#A3B1C680] placeholder:text-right placeholder:text-xs placeholder:text-[#1C2B4A80] sm:text-sm sm:placeholder:text-sm"
                placeholder="توضیحات..."
              />
              {errors.message && (
                <span className="text-[11px] font-medium text-red-500">
                  {errors.message.message}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-8 pt-12">
              <button
                type="submit"
                disabled={createTicketMutation.isPending}
                className="col-span-2 cursor-pointer rounded-xl bg-[linear-gradient(135deg,_#1E4D9C_0%,_#193B73_100%)] px-20 py-10 text-xs text-white shadow-[-2px_-2px_6px_0px_#FFFFFF80,_4px_4px_12px_0px_#193B7359] transition duration-300 hover:-translate-y-3 disabled:opacity-60 sm:col-span-1"
              >
                {createTicketMutation.isPending
                  ? 'در حال ارسال...'
                  : 'ارسال تیکت'}
              </button>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-primary-600 col-span-2 cursor-pointer rounded-xl bg-[#E8EDF5] px-20 py-10 text-xs shadow-[-3px_-3px_8px_0px_#FFFFFFD9,_4px_4px_10px_0px_#A3B1C673] transition duration-300 hover:-translate-y-3 sm:col-span-1"
              >
                انصراف
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="mt-32 flex min-h-200 w-full items-center justify-center">
          <Spinner className="text-primary-600 h-36 w-36" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="mt-21 rounded-2xl bg-[#EDF1F8] p-28 text-center shadow-[-4px_-4px_12px_0px_#FFFFFFE5,_6px_6px_16px_0px_#A3B1C680]">
          <p className="text-xs font-bold text-[#8A96B0]">
            هنوز هیچ تیکت پشتیبانی ثبت نکرده‌اید.
          </p>
        </div>
      ) : (
        <motion.section
          variants={container}
          initial="hidden"
          animate="show"
          className="mt-21 flex flex-col gap-20"
        >
          {tickets.map((ticket) => {
            const statusMeta = getStatusBadge(ticket.status);
            const isSelected = selectedTicketId === ticket.id;

            return (
              <div key={ticket.id} className="flex flex-col gap-10">
                <motion.div
                  variants={slideFromLeft}
                  onClick={() =>
                    setSelectedTicketId((prev) =>
                      prev === ticket.id ? null : ticket.id,
                    )
                  }
                  className="flex cursor-pointer items-center justify-between rounded-2xl bg-[#EDF1F8] p-14 shadow-[-4px_-4px_12px_0px_#FFFFFFE5,_6px_6px_16px_0px_#A3B1C680] transition hover:bg-[#E4E9F2]"
                >
                  <div className="flex items-center gap-14">
                    <motion.div
                      variants={textDrop}
                      className={`h-8 w-8 rounded-full ${statusMeta.dotClass}`}
                    />
                    <motion.div
                      variants={textContainer}
                      initial="hidden"
                      animate="show"
                      className="flex flex-col gap-8"
                    >
                      <motion.p
                        variants={textDrop}
                        className="text-xs font-bold text-[#1C2B4A]"
                      >
                        {ticket.subject}
                        {ticket.tracking_code && (
                          <span className="mr-8 font-mono text-[10px] font-normal text-[#8A96B0]">
                            ({ticket.tracking_code})
                          </span>
                        )}
                      </motion.p>
                      <motion.span
                        variants={textDrop}
                        className="text-[11px] text-[#8A96B0]"
                      >
                        {ticket.department || 'پشتیبانی'} ·{' '}
                        {formatPersianDate(
                          ticket.last_reply_at || ticket.created_at,
                        )}
                      </motion.span>
                    </motion.div>
                  </div>
                  <motion.div variants={textDrop}>
                    <span
                      className={`rounded-full px-10 py-2 text-[10px] font-bold ${statusMeta.badgeClass}`}
                    >
                      {statusMeta.label}
                    </span>
                  </motion.div>
                </motion.div>

                {isSelected && (
                  <div className="rounded-2xl bg-[#EDF1F8] p-18 shadow-[inset_-3px_-3px_8px_0px_#FFFFFFD9,_inset_4px_4px_10px_0px_#A3B1C68C]">
                    {isMessagesLoading ? (
                      <div className="flex justify-center py-16">
                        <Spinner className="text-primary-600 h-24 w-24" />
                      </div>
                    ) : (
                      <div className="flex flex-col gap-12">
                        {(activeTicketDetail?.messages || []).map((msg) => {
                          const isAdmin = msg.sender_type === 'admin';
                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col gap-4 rounded-xl p-12 ${
                                isAdmin
                                  ? 'bg-[#DCE5F4] text-[#1C2B4A]'
                                  : 'bg-[#E4E9F2] text-[#1C2B4A]'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[10px] font-bold text-[#8A96B0]">
                                <span>{isAdmin ? 'پشتیبان کدکدا' : 'شما'}</span>
                                <span>{formatPersianDate(msg.created_at)}</span>
                              </div>
                              <p className="text-xs leading-relaxed">
                                {msg.message}
                              </p>
                            </div>
                          );
                        })}

                        {ticket.status !== 'closed' && (
                          <form
                            onSubmit={handleReplySubmit}
                            className="mt-8 flex gap-8"
                          >
                            <input
                              type="text"
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="پاسخ جدید خود را بنویسید..."
                              className="flex-1 rounded-xl bg-[#EDF1F8] px-14 py-10 text-xs text-[#1C2B4A] shadow-[inset_-2px_-2px_5px_0px_#FFFFFFD9,_inset_3px_3px_7px_0px_#A3B1C680]"
                            />
                            <button
                              type="submit"
                              disabled={replyMutation.isPending}
                              className="to-primary-600 cursor-pointer rounded-xl bg-gradient-to-br from-[#1E4D9C] px-16 py-10 text-xs font-bold text-white shadow-[-2px_-2px_6px_0px_#FFFFFF80,_4px_4px_12px_0px_#193B7359] disabled:opacity-60"
                            >
                              {replyMutation.isPending
                                ? 'ارسال...'
                                : 'ارسال پاسخ'}
                            </button>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </motion.section>
      )}
    </>
  );
}

export default PanelSupport;
