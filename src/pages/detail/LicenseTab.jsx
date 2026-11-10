import { useState } from 'react';

const LockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-64 w-64"
  >
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const CopyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-16 w-16"
  >
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);

const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-16 w-16"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function LicenseTab({ course }) {
  const isPurchased = Boolean(course?.isPurchased || course?.is_purchased);

  const [copied, setCopied] = useState(false);

  const licenseKey = course?.license_key || course?.licenseKey || '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(licenseKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (!isPurchased) {
    return (
      <div className="flex min-h-400 flex-col items-center justify-center gap-24 rounded-2xl border border-dashed border-[#E4E4F7] bg-gradient-to-b from-white to-[#FAFAFF] p-48 text-center">
        <span className="bg-primary/10 text-primary flex h-112 w-112 items-center justify-center rounded-full">
          <LockIcon />
        </span>

        <div className="space-y-8">
          <h3 className="text-primary-900 text-base font-black">
            دسترسی محدود
          </h3>
          <p className="text-xs leading-21 text-[#64748B]">
            برای دسترسی به لایسنس، ابتدا دوره را خریداری کنید.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-24 sm:space-y-32">
      <div className="flex items-start gap-12 sm:gap-16">
        <span className="from-primary to-primary-400 shadow-primary/20 flex h-48 w-48 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-24 w-24"
          >
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </span>

        <div className="space-y-16">
          <h3 className="text-primary-900 sm:text-md text-sm font-black">
            لایسنس اسپات‌پلیر دوره
          </h3>
          <p className="text-justify text-xs leading-21 text-[#64748B] sm:text-sm">
            این کد اختصاصی برای شماست. آن را در اسپات‌پلیر دوره وارد کنید تا
            دسترسی به محتوا فعال شود. لطفاً کد را در اختیار دیگران قرار ندهید.
          </p>
        </div>
      </div>

      <div className="border-primary/20 from-primary/5 to-primary/0 rounded-2xl border bg-gradient-to-br p-16 sm:p-24">
        <div className="flex flex-col gap-12 sm:flex-row sm:items-center sm:justify-between sm:gap-16">
          <div className="space-y-8">
            <p className="text-[10px] font-bold tracking-wider text-[#64748B]">
              کد لایسنس
            </p>
            <p
              className="text-primary-900 font-mono text-xs font-black tracking-[0.2em] sm:text-lg"
              dir="ltr"
            >
              {licenseKey}
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className={`inline-flex cursor-pointer items-center justify-center gap-8 rounded-xl px-24 py-12 text-xs font-bold tracking-wide shadow-sm transition-all ${
              copied
                ? 'bg-[#22C55E] text-white'
                : 'bg-primary hover:bg-primary-600 text-white'
            }`}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? 'کپی شد!' : 'کپی کد'}
          </button>
        </div>
      </div>

      <div className="border-line rounded-2xl border bg-gradient-to-b from-white to-[#FAFAFF] p-24">
        <h4 className="text-primary-900 mb-16 text-sm font-black">
          راهنمای فعال‌سازی
        </h4>
        <ol className="space-y-12 text-xs leading-21 text-[#64748B]">
          <li className="flex items-center gap-12">
            <span className="bg-primary/10 text-primary flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-lg text-[10px] font-black">
              ۱
            </span>
            <span>وارد اپلیکیشن اسپات‌پلیر اختصاصی دوره شوید.</span>
          </li>
          <li className="flex items-center gap-12">
            <span className="bg-primary/10 text-primary flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-lg text-[10px] font-black">
              ۲
            </span>
            <span>در بخش «لایسنس»، کد کپی‌شده را وارد کنید.</span>
          </li>
          <li className="flex items-center gap-12">
            <span className="bg-primary/10 text-primary flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-lg text-[10px] font-black">
              ۳
            </span>
            <span>پس از تأیید، دسترسی شما به محتوای دوره فعال می‌شود.</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
