import { useMemo } from 'react';

function getJalaliDateTimeString() {
  const now = new Date();
  try {
    const datePart = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);
    const timePart = new Intl.DateTimeFormat('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(now);
    return { datePart, timePart };
  } catch {
    return { datePart: '۱۴۰۳/۰۸/۲۰', timePart: '۱۲:۰۰:۰۰' };
  }
}

function PrintableReportWrapper({
  title = 'گزارش رسمی مالی و تراکنش‌ها',
  subtitle = 'واحد امور مالی و حسابداری پلتفرم کدکدا',
  documentNumber = 'KDC-FIN-1403',
  children,
}) {
  const { datePart, timePart } = useMemo(() => getJalaliDateTimeString(), []);

  return (
    <div
      dir="rtl"
      className="mx-auto w-full rounded-2xl bg-[#EDF1F8] p-20 text-[#1C2B4A] shadow-[-4px_-4px_12px_0px_#FFFFFFE5,_6px_6px_16px_0px_#A3B1C680] print:m-0 print:w-full print:max-w-[210mm] print:rounded-none print:bg-white print:p-16 print:text-black print:shadow-none"
    >
      {/* Formal Iranian Organizational Header */}
      <header className="border-b-2 border-[#1C2B4A] pb-16 print:border-black">
        <div className="grid grid-cols-1 items-center gap-16 sm:grid-cols-3">
          {/* Right: Organization Logo & Name */}
          <div className="flex items-center gap-12">
            <img
              src="/logo.png"
              alt="آکادمی برنامه‌نویسی کدکدا"
              className="h-48 w-48 shrink-0 rounded-xl object-contain"
              onError={(e) => {
                e.currentTarget.src = '/icons/book-sec.svg';
              }}
            />
            <div className="flex flex-col gap-2">
              <span className="text-sm font-black text-[#1C2B4A] print:text-black">
                آکادمی برنامه‌نویسی کدکدا
              </span>
              <span className="text-[10px] font-bold text-[#8A96B0] print:text-black/75">
                سامانه جامع آموزش آنلاین و ویدیویی
              </span>
            </div>
          </div>

          {/* Center: Dynamic Report Title */}
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-bold text-[#8A96B0] print:text-black/70">
              بسمه تعالی
            </span>
            <h1 className="mt-4 text-base font-black text-[#1C2B4A] print:text-black">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-4 text-[11px] font-bold text-[#8A96B0] print:text-black/80">
                {subtitle}
              </p>
            )}
          </div>

          {/* Left: Exact Generation Date & Time (Jalali) */}
          <div className="flex flex-col gap-4 rounded-xl bg-[#E4E9F2] p-12 text-[11px] sm:mr-auto sm:w-fit print:border print:border-black print:bg-white">
            <div className="flex items-center justify-between gap-16">
              <span className="font-bold text-[#8A96B0] print:text-black">
                شماره سند:
              </span>
              <span
                dir="ltr"
                className="font-black text-[#1C2B4A] print:text-black"
              >
                {documentNumber}
              </span>
            </div>
            <div className="flex items-center justify-between gap-16">
              <span className="font-bold text-[#8A96B0] print:text-black">
                تاریخ تنظیم:
              </span>
              <span className="font-black text-[#1C2B4A] print:text-black">
                {datePart}
              </span>
            </div>
            <div className="flex items-center justify-between gap-16">
              <span className="font-bold text-[#8A96B0] print:text-black">
                ساعت گزارش:
              </span>
              <span className="font-black text-[#1C2B4A] print:text-black">
                {timePart}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Report Body */}
      <main className="mt-20 print:mt-14">{children}</main>

      {/* Formal Organizational Footer with Management Signature & Stamp */}
      <footer className="mt-30 border-t-2 border-[#1C2B4A] pt-20 print:mt-24 print:break-inside-avoid print:border-black">
        <div className="grid grid-cols-1 gap-20 sm:grid-cols-3">
          <div className="flex flex-col justify-between rounded-xl border border-dashed border-[#8A96B0] p-16 text-center print:border-black">
            <span className="text-[11px] font-black text-[#1C2B4A] print:text-black">
              تنظیم‌کننده گزارش (واحد مالی)
            </span>
            <span className="mt-36 text-[10px] font-bold text-[#8A96B0] print:text-black/70">
              نام و امضا
            </span>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-dashed border-[#8A96B0] p-16 text-center print:border-black">
            <span className="text-[11px] font-black text-[#1C2B4A] print:text-black">
              تاییدیه حسابرسی و کنترل کیفیت
            </span>
            <span className="mt-36 text-[10px] font-bold text-[#8A96B0] print:text-black/70">
              نام و امضا
            </span>
          </div>

          <div className="flex flex-col justify-between rounded-xl border-2 border-dashed border-[#1C2B4A] p-16 text-center print:border-black">
            <span className="text-xs font-black text-[#1C2B4A] print:text-black">
              مهر و امضای مدیریت
            </span>
            <span className="mt-36 text-[10px] font-bold text-[#8A96B0] print:text-black/70">
              محل درج مهر رسمی آکادمی برنامه‌نویسی کدکدا
            </span>
          </div>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-8 text-[10px] font-bold text-[#8A96B0] print:text-black/80">
          <span>
            این گزارش به‌صورت سیستمی از سامانه جامع مدیریت آکادمی برنامه‌نویسی
            کدکدا استخراج شده است.
          </span>
          <span>صفحه ۱ از ۱ · قالب استاندارد چاپی A4</span>
        </div>
      </footer>
    </div>
  );
}

export default PrintableReportWrapper;
