import { AnimatePresence, motion } from 'framer-motion';

import { useCheckout } from '../../hooks/useCheckout';
import Spinner from '../ui/Spinner';

const faToEnDigits = (str) =>
  String(str)
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));

const enToFaDigits = (str) =>
  String(str).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);

const parsePrice = (price) => {
  if (typeof price === 'number') return price;
  if (price == null) return 0;
  const clean = faToEnDigits(String(price)).replace(/[^\d]/g, '');
  return Number(clean) || 0;
};

const formatPrice = (num) =>
  enToFaDigits((Number(num) || 0).toLocaleString('en-US'));

export default function CheckoutModal({ open, onClose, course }) {
  const { pricing = { currency: 'تومان' } } = course || {};
  const {
    discountCode,
    appliedDiscount,
    discountError,
    basePrice,
    baseDiscountAmount,
    appliedDiscountAmount,
    finalPrice,
    isValidatingDiscount,
    isPaying,
    handleCodeChange,
    handleApply,
    handlePay,
    handleRemove,
    handleClose,
  } = useCheckout(course, onClose, { parsePrice });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm"
        >
          <div className="flex min-h-screen items-center justify-center px-16 py-24">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              dir="rtl"
              className="relative w-full max-w-500 overflow-hidden rounded-3xl border border-[#E4E4F7] bg-white shadow-2xl"
            >
              <div className="bg-primary-500 absolute top-0 left-0 h-6 w-full" />
              <div className="flex items-center justify-between border-b border-[#F1F5F9] px-24 py-20 sm:px-32">
                <h2 className="text-primary-900 text-base font-black sm:text-lg">
                  نهایی‌سازی خرید
                </h2>
                <button
                  type="button"
                  onClick={handleClose}
                  aria-label="بستن"
                  className="flex h-32 w-32 cursor-pointer items-center justify-center rounded-full text-[#64748B] transition hover:bg-[#F1F5F9] hover:text-[#1E293B]"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="h-16 w-16"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex flex-col gap-20 p-24 sm:p-32">
                <div className="rounded-2xl bg-[#F8FAFC] p-16 sm:p-20">
                  <p className="text-[11px] font-semibold text-[#64748B]">
                    دوره انتخابی شما
                  </p>
                  <p className="text-primary-900 mt-4 text-sm font-black">
                    {course?.title}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#E4E4F7] p-16 sm:p-20">
                  <label className="text-[11px] font-bold text-[#1E293B]">
                    کد تخفیف
                  </label>

                  {appliedDiscount ? (
                    <div className="mt-12 flex items-center justify-between rounded-xl bg-[#DCFCE7] px-14 py-10">
                      <div className="flex items-center gap-10">
                        <span className="h-10 w-10 rounded-full bg-[#22C55E]" />
                        <div>
                          <p className="text-xs font-black text-[#15803D]">
                            {appliedDiscount.code}
                          </p>
                          <p className="text-[10px] text-[#15803D]/80">
                            {appliedDiscount.label} اعمال شد
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemove}
                        className="cursor-pointer text-[10px] font-bold text-[#B91C1C] hover:underline"
                      >
                        حذف
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="mt-12 flex gap-8">
                        <input
                          type="text"
                          dir="ltr"
                          value={discountCode}
                          onChange={(e) => handleCodeChange(e.target.value)}
                          placeholder="SUMMER30"
                          className="focus:border-primary-400 w-full flex-1 rounded-xl border border-[#E4E4F7] bg-white px-12 py-10 text-xs tracking-widest text-[#1E293B] transition outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleApply}
                          disabled={isValidatingDiscount}
                          className="text-primary-600 bg-primary-50 hover:bg-primary-100 flex cursor-pointer items-center justify-center gap-6 rounded-xl px-16 py-10 text-xs font-bold whitespace-nowrap transition disabled:opacity-60"
                        >
                          {isValidatingDiscount ? (
                            <Spinner className="border-primary-600/30 border-t-primary-600 h-14 w-14" />
                          ) : (
                            'اعمال تخفیف'
                          )}
                        </button>
                      </div>
                      {discountError && (
                        <p className="mt-8 text-[10px] font-bold text-[#B91C1C]">
                          {discountError}
                        </p>
                      )}
                    </>
                  )}
                </div>

                <div className="space-y-10 rounded-2xl bg-[#F8FAFC] p-16 sm:p-20">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#64748B]">قیمت دوره</span>
                    <span className="font-bold text-[#1E293B]">
                      {formatPrice(basePrice)}{' '}
                      <span className="text-[10px] font-normal text-[#64748B]">
                        {pricing.currency || 'تومان'}
                      </span>
                    </span>
                  </div>

                  {baseDiscountAmount > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#64748B]">تخفیف دوره</span>
                      <span className="font-bold text-[#EF4444]">
                        − {formatPrice(baseDiscountAmount)}{' '}
                        <span className="text-[10px] font-normal">
                          {pricing.currency || 'تومان'}
                        </span>
                      </span>
                    </div>
                  )}

                  {appliedDiscount && appliedDiscountAmount > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#64748B]">
                        تخفیف کد ({appliedDiscount.label})
                      </span>
                      <span className="font-bold text-[#22C55E]">
                        − {formatPrice(appliedDiscountAmount)}{' '}
                        <span className="text-[10px] font-normal">
                          {pricing.currency || 'تومان'}
                        </span>
                      </span>
                    </div>
                  )}

                  <div className="h-[1px] w-full bg-[#E4E4F7]" />

                  <div className="flex items-end justify-between">
                    <span className="text-xs font-semibold text-[#1E293B]">
                      مبلغ نهایی قابل پرداخت
                    </span>
                    <div>
                      <span className="text-primary-600 text-xl font-black sm:text-2xl">
                        {formatPrice(finalPrice)}
                      </span>
                      <span className="mr-4 text-[10px] text-[#64748B]">
                        {pricing.currency || 'تومان'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-8 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isPaying}
                    className="cursor-pointer rounded-2xl border border-[#E4E4F7] bg-white px-20 py-12 text-xs font-bold text-[#64748B] transition hover:bg-[#F8FAFC] hover:text-[#1E293B] disabled:opacity-50"
                  >
                    انصراف
                  </button>
                  <button
                    type="button"
                    onClick={handlePay}
                    disabled={isPaying}
                    className="bg-primary-600 hover:bg-primary-500 flex w-full cursor-pointer items-center justify-center gap-8 rounded-2xl px-24 py-12 text-xs font-black text-white shadow-lg shadow-indigo-100/50 transition-all disabled:opacity-60 sm:w-auto"
                  >
                    {isPaying ? (
                      <>
                        <Spinner className="h-16 w-16" />
                        در حال انتقال به درگاه...
                      </>
                    ) : (
                      <>
                        رفتن به درگاه پرداخت
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
                            d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                          />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
