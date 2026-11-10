import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router';

import DiscountsGrid from './DiscountsGrid';
import TransactionsTable from './TransactionsTable';

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-lg px-16 py-8 text-[11px] font-bold whitespace-nowrap transition duration-200 ${
        active
          ? 'text-primary-600 bg-[#DCE5F4] shadow-[inset_-2px_-2px_3px_0px_#FFFFFFCC,_inset_2px_2px_4px_0px_#A3B1C666]'
          : 'text-[#8A96B0] hover:text-[#1C2B4A]'
      }`}
    >
      {children}
    </button>
  );
}

export default function FinanceTabsSection({
  activeTab,
  onTabChange,
  transactions,
  discounts,
  copiedCode,
  onCopy,
}) {
  return (
    <motion.section
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
      className="mt-25 rounded-2xl bg-[#EDF1F8] p-20 shadow-[-4px_-4px_12px_0px_#FFFFFFE5,_6px_6px_16px_0px_#A3B1C680]"
    >
      <div className="flex flex-col gap-12 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-10 rounded-xl bg-[#E4E9F2] p-6 shadow-[inset_-2px_-2px_4px_0px_#FFFFFFCC,_inset_2px_2px_5px_0px_#A3B1C666]">
          <TabButton
            active={activeTab === 'transactions'}
            onClick={() => onTabChange('transactions')}
          >
            تراکنش‌های مالی
          </TabButton>
          <TabButton
            active={activeTab === 'discounts'}
            onClick={() => onTabChange('discounts')}
          >
            مدیریت کدهای تخفیف
          </TabButton>
        </div>

        {activeTab === 'transactions' && (
          <Link
            to="/panel-admin/reports/finance"
            type="button"
            className="to-primary-600 inline-flex cursor-pointer items-center gap-8 rounded-xl bg-gradient-to-br from-[#1E4D9C] px-16 py-10 text-[11px] font-black whitespace-nowrap text-white shadow-[3px_3px_8px_0px_#193B734D] transition duration-200 hover:brightness-110"
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
                d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z"
              />
            </svg>
            گزارش رسمی و چاپ A4
          </Link>
        )}

        {activeTab === 'discounts' && (
          <Link
            to="/panel-admin/newDiscount"
            type="button"
            className="to-primary-600 inline-flex cursor-pointer items-center gap-8 rounded-xl bg-gradient-to-br from-[#1E4D9C] px-16 py-10 text-[11px] font-black whitespace-nowrap text-white shadow-[3px_3px_8px_0px_#193B734D] transition duration-200 hover:brightness-110"
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
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            افزودن کد تخفیف
          </Link>
        )}
      </div>

      <div className="mt-20">
        <AnimatePresence mode="wait">
          {activeTab === 'transactions' && (
            <motion.div
              key="transactions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <TransactionsTable transactions={transactions} />
            </motion.div>
          )}

          {activeTab === 'discounts' && (
            <motion.div
              key="discounts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <DiscountsGrid
                discounts={discounts}
                copiedCode={copiedCode}
                onCopy={onCopy}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
