import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';

import PrintableReportWrapper from '../../../components/common/PrintableReportWrapper';
import Spinner from '../../../components/ui/Spinner';
import { getFinancialReport } from '../../../services/adminApi';
import { enToFaDigits, formatToman } from '../../../services/courseApi';

function FinancialReport() {
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['admin-financial-report', statusFilter, search],
    queryFn: () =>
      getFinancialReport({
        status: statusFilter || undefined,
        search: search.trim() || undefined,
        limit: 200,
      }),
  });

  const transactions = Array.isArray(reportData?.items) ? reportData.items : [];
  const totalRevenue = Number(
    reportData?.total_revenue ?? reportData?.total_amount ?? 0,
  );
  const paidCount = transactions.filter(
    (tx) => tx.rawStatus === 'paid' || tx.rawStatus === 'completed',
  ).length;

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div className="flex flex-col gap-20 print:m-0 print:gap-0 print:p-0">
      {/* Action Toolbar (Hidden in Print) */}
      <div className="flex flex-wrap items-center justify-between gap-12 rounded-2xl bg-[#EDF1F8] p-20 shadow-[-4px_-4px_12px_0px_#FFFFFFE5,_6px_6px_16px_0px_#A3B1C680] print:hidden">
        <div className="flex items-center gap-12">
          <Link
            to="/panel-admin/finance"
            className="flex h-40 w-40 items-center justify-center rounded-xl bg-[#E4E9F2] text-[#1C2B4A] shadow-[inset_-2px_-2px_4px_0px_#FFFFFFCC,_inset_2px_2px_5px_0px_#A3B1C666] transition hover:brightness-105"
            aria-label="بازگشت به بخش مالی"
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
            <h2 className="text-base font-black text-[#1C2B4A]">
              گزارش رسمی مالی و صورت‌حساب تراکنش‌ها
            </h2>
            <p className="mt-4 text-[11px] font-bold text-[#8A96B0]">
              آماده چاپ در قطع استاندارد A4 و ذخیره مستقیم به‌صورت فایل PDF
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-10">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجوی کد پیگیری..."
            className="rounded-xl bg-[#E4E9F2] px-12 py-10 text-[11px] font-bold text-[#1C2B4A] placeholder-[#8A96B0] shadow-[inset_-2px_-2px_4px_0px_#FFFFFFCC,_inset_2px_2px_5px_0px_#A3B1C666] outline-none"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="فیلتر وضعیت تراکنش"
            className="cursor-pointer rounded-xl bg-[#E4E9F2] px-12 py-10 text-[11px] font-bold text-[#1C2B4A] shadow-[inset_-2px_-2px_4px_0px_#FFFFFFCC,_inset_2px_2px_5px_0px_#A3B1C666] outline-none"
          >
            <option value="">همه تراکنش‌ها</option>
            <option value="paid">فقط پرداخت‌های موفق</option>
            <option value="pending">در انتظار پرداخت</option>
            <option value="failed">تراکنش‌های ناموفق</option>
          </select>

          <button
            type="button"
            onClick={handlePrint}
            className="to-primary-600 inline-flex cursor-pointer items-center gap-8 rounded-xl bg-gradient-to-br from-[#1E4D9C] px-18 py-10 text-xs font-black text-white shadow-[3px_3px_8px_0px_#193B734D] transition duration-200 hover:brightness-110 print:hidden"
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
                d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z"
              />
            </svg>
            چاپ / خروجی PDF
          </button>
        </div>
      </div>

      {/* Printable Enterprise Report Surface */}
      <PrintableReportWrapper
        title="گزارش جامع تراکنش‌های مالی و فروش دوره‌ها"
        subtitle="گزارش رسمی حسابداری و خزانه‌داری آکادمی برنامه‌نویسی کدکدا"
        documentNumber={`KDC-FIN-${enToFaDigits(transactions.length)}`}
      >
        {/* Summary KPI Strip */}
        <div className="mb-16 grid grid-cols-3 gap-12">
          <div className="rounded-xl bg-[#E4E9F2] p-12 text-center print:border print:border-black print:bg-white">
            <span className="block text-[10px] font-bold text-[#8A96B0] print:text-black">
              تعداد کل رکوردها
            </span>
            <span className="mt-4 block text-sm font-black text-[#1C2B4A] print:text-black">
              {enToFaDigits(transactions.length)} تراکنش
            </span>
          </div>
          <div className="rounded-xl bg-[#E4E9F2] p-12 text-center print:border print:border-black print:bg-white">
            <span className="block text-[10px] font-bold text-[#8A96B0] print:text-black">
              تراکنش‌های موفق
            </span>
            <span className="mt-4 block text-sm font-black text-[#15803D] print:text-black">
              {enToFaDigits(paidCount)} مورد
            </span>
          </div>
          <div className="rounded-xl bg-[#E4E9F2] p-12 text-center print:border print:border-black print:bg-white">
            <span className="block text-[10px] font-bold text-[#8A96B0] print:text-black">
              جمع کل درآمد قطعی (تومان)
            </span>
            <span className="text-primary-600 mt-4 block text-sm font-black print:text-black">
              {formatToman(totalRevenue)} تومان
            </span>
          </div>
        </div>

        {/* Data-Dense Financial Transactions Table */}
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full border-collapse border border-[#A3B1C6] text-right text-[11px] print:border-black print:text-[10px]">
            <thead>
              <tr className="bg-[#DCE5F4] text-[#1C2B4A] print:bg-gray-100 print:text-black">
                <th className="border border-[#A3B1C6] px-10 py-10 text-center font-black print:border-black">
                  ردیف
                </th>
                <th className="border border-[#A3B1C6] px-10 py-10 font-black print:border-black">
                  کد پیگیری
                </th>
                <th className="border border-[#A3B1C6] px-10 py-10 font-black print:border-black">
                  نام دانشجو
                </th>
                <th className="border border-[#A3B1C6] px-10 py-10 text-center font-black print:border-black">
                  شماره موبایل کاربر
                </th>
                <th className="border border-[#A3B1C6] px-10 py-10 font-black print:border-black">
                  عنوان دوره آموزشی
                </th>
                <th className="border border-[#A3B1C6] px-10 py-10 text-center font-black print:border-black">
                  مبلغ (تومان)
                </th>
                <th className="border border-[#A3B1C6] px-10 py-10 text-center font-black print:border-black">
                  تاریخ ثبت
                </th>
                <th className="border border-[#A3B1C6] px-10 py-10 text-center font-black print:border-black">
                  وضعیت
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, idx) => (
                <tr
                  key={tx.rawId || tx.id || idx}
                  className="odd:bg-white/60 even:bg-[#E4E9F2]/60 print:break-inside-avoid print:bg-white"
                >
                  <td className="border border-[#A3B1C6] px-10 py-8 text-center font-bold text-[#1C2B4A] print:border-black print:text-black">
                    {enToFaDigits(idx + 1)}
                  </td>
                  <td
                    dir="ltr"
                    className="border border-[#A3B1C6] px-10 py-8 font-black text-[#1C2B4A] print:border-black print:text-black"
                  >
                    {tx.tracking_code || tx.id}
                  </td>
                  <td className="border border-[#A3B1C6] px-10 py-8 font-bold text-[#1C2B4A] print:border-black print:text-black">
                    {tx.student}
                  </td>
                  <td
                    dir="ltr"
                    className="border border-[#A3B1C6] px-10 py-8 text-center font-bold text-[#1C2B4A] print:border-black print:text-black"
                  >
                    {tx.mobile}
                  </td>
                  <td className="border border-[#A3B1C6] px-10 py-8 font-bold text-[#1C2B4A] print:border-black print:text-black">
                    {tx.course}
                  </td>
                  <td className="border border-[#A3B1C6] px-10 py-8 text-center font-black text-[#1C2B4A] print:border-black print:text-black">
                    {tx.amount}
                  </td>
                  <td className="border border-[#A3B1C6] px-10 py-8 text-center font-bold text-[#1C2B4A] print:border-black print:text-black">
                    {tx.date}
                  </td>
                  <td className="border border-[#A3B1C6] px-10 py-8 text-center font-bold text-[#1C2B4A] print:border-black print:text-black">
                    <span
                      className={`inline-block rounded-full px-10 py-2 text-[10px] font-bold print:rounded-none print:bg-transparent print:p-0 print:text-black ${tx.statusClass}`}
                    >
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="border border-[#A3B1C6] px-12 py-20 text-center font-bold text-[#8A96B0] print:border-black print:text-black"
                  >
                    هیچ تراکنش مالی مطابق فیلترهای انتخابی یافت نشد.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-[#DCE5F4] font-black text-[#1C2B4A] print:bg-gray-100 print:text-black">
                <td
                  colSpan={5}
                  className="border border-[#A3B1C6] px-12 py-12 text-left text-xs font-black print:border-black"
                >
                  جمع کل پرداختی‌ها (تراکنش‌های موفق):
                </td>
                <td
                  colSpan={3}
                  className="text-primary-600 border border-[#A3B1C6] px-12 py-12 text-center text-sm font-black print:border-black print:text-black"
                >
                  {formatToman(totalRevenue)} تومان
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </PrintableReportWrapper>
    </div>
  );
}

export default FinancialReport;
