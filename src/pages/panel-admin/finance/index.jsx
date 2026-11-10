import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import Spinner from '../../../components/ui/Spinner';
import { listDiscounts, listTransactions } from '../../../services/adminApi';
import FinanceStats from './FinanceStats';
import FinanceTabsSection from './FinanceTabsSection';

function PanelAdminFinance() {
  const [activeTab, setActiveTab] = useState('transactions');
  const [copiedCode, setCopiedCode] = useState(null);

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ['admin-transactions'],
    queryFn: () => listTransactions({ limit: 50 }),
  });

  const { data: discountData, isLoading: discountLoading } = useQuery({
    queryKey: ['admin-discounts'],
    queryFn: () => listDiscounts(),
  });

  const rawTransactions = Array.isArray(txData)
    ? txData
    : Array.isArray(txData?.data)
      ? txData.data
      : Array.isArray(txData?.transactions)
        ? txData.transactions
        : [];

  const transactions = rawTransactions.map((tx, idx) => {
    const studentName = tx.user
      ? `${tx.user.first_name || ''} ${tx.user.last_name || ''}`.trim() ||
        tx.user.mobile
      : tx.student_name || tx.student || 'کاربر کدکدا';
    const courseName =
      tx.course?.title || tx.course_title || tx.course || 'خرید دوره';
    const isPaid = tx.status === 'paid' || tx.status === 'موفق';
    const isPending = tx.status === 'pending' || tx.status === 'در انتظار';

    return {
      id: tx.ref_id || tx.authority || tx.id || `TRX-${2000 + idx}`,
      student: studentName,
      course: courseName,
      amount: Number(
        tx.final_amount ?? tx.total_amount ?? tx.amount ?? 0,
      ).toLocaleString('fa-IR'),
      status: isPaid ? 'موفق' : isPending ? 'در انتظار' : 'ناموفق',
      statusClass: isPaid
        ? 'bg-[#DCFCE7] text-[#15803D]'
        : isPending
          ? 'bg-[#FFF3DC] text-[#B07D00]'
          : 'bg-[#FEE2E2] text-[#B91C1C]',
      date: tx.created_at
        ? new Date(tx.created_at).toLocaleDateString('fa-IR')
        : tx.date || '۱۴۰۳/۰۵/۱۲',
    };
  });

  const rawDiscounts = Array.isArray(discountData)
    ? discountData
    : Array.isArray(discountData?.data)
      ? discountData.data
      : Array.isArray(discountData?.discounts)
        ? discountData.discounts
        : [];

  const discounts = rawDiscounts.map((d, idx) => {
    const startDate = d.created_at
      ? new Date(d.created_at).toLocaleDateString('fa-IR')
      : d.startDate || '۱۴۰۳/۰۵/۰۱';
    const endDate = d.expires_at
      ? new Date(d.expires_at).toLocaleDateString('fa-IR')
      : d.endDate || '۱۴۰۳/۰۸/۰۱';
    const isExpired = d.expires_at
      ? new Date(d.expires_at) < new Date()
      : false;

    return {
      id: d.id || idx + 1,
      code: d.code || 'KODKDA',
      percent: Number(d.percent ?? d.amount ?? 20),
      used: Number(d.used_count ?? d.used ?? 0),
      total: Number(d.max_uses ?? d.total ?? 100),
      active: d.active ?? !isExpired,
      startDate,
      endDate,
    };
  });

  const handleCopy = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  if (txLoading || discountLoading) {
    return <Spinner />;
  }

  return (
    <>
      <FinanceStats
        transactionsCount={transactions.length.toLocaleString('fa-IR')}
        discountsCount={discounts.length.toLocaleString('fa-IR')}
      />

      <FinanceTabsSection
        activeTab={activeTab}
        onTabChange={setActiveTab}
        transactions={transactions}
        discounts={discounts}
        copiedCode={copiedCode}
        onCopy={handleCopy}
      />
    </>
  );
}

export default PanelAdminFinance;
