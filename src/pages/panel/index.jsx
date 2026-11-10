import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { Outlet, useNavigate } from 'react-router';

import { useAuth } from '../../contexts/AuthContext';
import { getDashboardStats } from '../../services/studentApi';
import PanelNavItem from './PanelNavItem';

function PanelLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ['student-dashboard-stats'],
    queryFn: getDashboardStats,
  });

  const displayName = user?.full_name || 'دانشجوی کدکدا';
  const userInitial = displayName.trim().charAt(0) || 'ک';
  const activeTickets = stats?.active_tickets_count ?? 0;

  const handleLogout = async () => {
    setIsSidebarOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <section className="min-h-screen w-full bg-[#E8EDF5] pb-100">
      <div className="border-b border-b-[#FFFFFF99] py-8">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-10">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="باز کردن منو"
              className="flex h-36 w-36 cursor-pointer items-center justify-center rounded-xl shadow-[-3px_-3px_7px_0px_#FFFFFFE5,_4px_4px_10px_0px_#A3B1C673] lg:hidden"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="text-primary-800/50 h-20 w-20"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </button>

            <p className="text-primary-600 hidden text-sm font-extrabold sm:block">
              آکادمی کدکدا
            </p>
            <div className="to-primary-600 hidden h-32 w-32 items-center justify-center rounded-xl bg-gradient-to-br from-[#1E4D9C] sm:flex">
              <img src="/icons/book-sec.svg" alt="book" />
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="flex items-center justify-center gap-8 rounded-xl px-10 py-6 shadow-[-3px_-3px_7px_0px_#FFFFFFE5,_4px_4px_10px_0px_#A3B1C673]">
              <div>
                <span className="text-xs font-bold text-[#1C2B4A]">
                  {displayName}
                </span>
                <div className="flex items-center justify-end gap-4">
                  <span className="text-[10px] text-[#8A96B0]">آنلاین</span>
                  <span className="h-6 w-6 rounded-full bg-[#00D492]"></span>
                </div>
              </div>
              <span className="to-primary-600 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#1E4D9C] text-xs text-white">
                {userInitial}
              </span>
            </div>

            <button
              type="button"
              onClick={() => navigate('/panel/support')}
              className="relative flex h-36 w-36 cursor-pointer items-center justify-center rounded-xl shadow-[-3px_-3px_7px_0px_#FFFFFFE5,_4px_4px_10px_0px_#A3B1C673]"
            >
              <img src="/icons/alert.svg" alt="alert" />
              {activeTickets > 0 && (
                <span className="bg-secondary-300 text-primary-600 absolute -top-5 -right-5 flex h-16 w-16 items-center justify-center rounded-full text-xs font-bold shadow-[0px_2px_6px_0px_#F7B92880]">
                  {activeTickets}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <section className="container mt-20 flex gap-20">
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          />
        )}

        <aside
          className={`fixed top-0 right-0 bottom-0 z-50 flex h-screen min-h-screen w-204 min-w-204 flex-col overflow-y-auto rounded-l-2xl bg-[#E8EDF5] shadow-[-5px_-5px_15px_0px_#FFFFFFE5,_8px_8px_20px_0px_#A3B1C680] transition-transform duration-300 ease-in-out lg:static lg:h-674 lg:min-h-674 lg:translate-x-0 lg:overflow-visible lg:rounded-2xl ${
            isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center gap-10 p-12 pb-0 sm:hidden">
            <div className="to-primary-600 flex h-32 w-32 items-center justify-center rounded-xl bg-gradient-to-br from-[#1E4D9C]">
              <img src="/icons/book-sec.svg" alt="book" />
            </div>

            <p className="text-primary-600 text-sm font-extrabold">
              آکادمی کدکدا
            </p>
          </div>

          <div className="border-b border-b-[#A3B1C640] p-12">
            <div className="flex items-center gap-10 rounded-xl px-8 py-10 shadow-[inset_-2px_-2px_4px_0px_#FFFFFFD9,_inset_2px_2px_5px_0px_#A3B1C666]">
              <span className="to-primary-600 flex h-36 w-36 items-center justify-center rounded-xl bg-gradient-to-br from-[#1E4D9C] text-sm font-black text-white shadow-[3px_3px_8px_0px_#193B734D]">
                {userInitial}
              </span>
              <div>
                <span className="text-xs font-bold text-[#1C2B4A]">
                  {displayName}
                </span>
                <div className="flex items-center justify-end gap-4">
                  <span className="text-[10px] text-[#8A96B0]">آنلاین</span>
                  <span className="h-6 w-6 rounded-full bg-[#00D492]"></span>
                </div>
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-10 p-12">
            <PanelNavItem
              onClick={() => setIsSidebarOpen(false)}
              to="/panel"
              end
              label="داشبورد"
              icon="/icons/dashboard.svg"
              iconActive="/icons/dashboard-active.svg"
              reverse
            />

            <PanelNavItem
              onClick={() => setIsSidebarOpen(false)}
              to="/panel/courses"
              label="دوره های من"
              icon="/icons/book.svg"
              iconActive="/icons/book-active.svg"
            />

            <PanelNavItem
              onClick={() => setIsSidebarOpen(false)}
              to="/panel/certificates"
              label="گواهینامه ها"
              icon="/icons/medal.svg"
              iconActive="/icons/medal-active.svg"
            />

            <PanelNavItem
              onClick={() => setIsSidebarOpen(false)}
              to="/panel/support"
              label="پشتیبانی"
              icon="/icons/support.svg"
              iconActive="/icons/support-active.svg"
              badge={activeTickets > 0 ? activeTickets : undefined}
            />

            <PanelNavItem
              to="/panel/profile"
              onClick={() => setIsSidebarOpen(false)}
              label="پروفایل"
              icon="/icons/user.svg"
              iconActive="/icons/user-active.svg"
            />
          </nav>

          <div className="mt-auto flex flex-col gap-10 px-12">
            <div className="mt-auto border-t border-t-[#A3B1C640] py-10">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full cursor-pointer items-center gap-10 rounded-xl px-12 py-10 text-xs font-bold transition hover:bg-[#DCE5F4]/50"
              >
                <img src="/icons/logout.svg" alt="logout" />
                <span className="text-xs font-bold text-[#B0BAC9]">
                  خروج از حساب
                </span>
              </button>
            </div>
          </div>
        </aside>

        <section className="w-full">
          <Outlet />
        </section>
      </section>
    </section>
  );
}

export default PanelLayout;
