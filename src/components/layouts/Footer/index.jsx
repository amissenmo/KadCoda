import { useState } from 'react';

import { Link } from 'react-router';

import Logo from '../Header/Logo';

export default function Footer() {
  const [isQuickOpen, setIsQuickOpen] = useState(false);
  const [isCoursesOpen, setIsCoursesOpen] = useState(false);

  return (
    <>
      <footer className="mt-56 bg-gray-900 py-50 text-white md:mt-72 lg:mt-96">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 gap-40 md:grid-cols-2 lg:grid-cols-6">
            {/* About */}
            <div className="col-span-1 md:col-span-2 lg:col-span-2">
              <Logo secondary={true} />

              <p className="mt-10 text-sm leading-30 text-white/70">
                آموزش برنامه نویسی به صورت حضوری و آنلاین با پروژه‌های واقعی و
                پشتیبانی دائمی. هدف ما تربیت برنامه‌نویس آماده ورود به بازار کار
                است.
              </p>

              <ul className="mt-20 flex items-center gap-12">
                {/* Instagram */}
                <li>
                  <a
                    href="#"
                    className="hover:text-primary flex size-42 items-center justify-center rounded-full bg-white/70 text-gray-700/60 transition hover:bg-white"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="size-20"
                    >
                      <path d="M7.75 2C4.574 2 2 4.574 2 7.75v8.5C2 19.426 4.574 22 7.75 22h8.5C19.426 22 22 19.426 22 16.25v-8.5C22 4.574 19.426 2 16.25 2h-8.5zm0 2h8.5A3.75 3.75 0 0120 7.75v8.5A3.75 3.75 0 0116.25 20h-8.5A3.75 3.75 0 014 16.25v-8.5A3.75 3.75 0 017.75 4zm9.5 1a1 1 0 100 2 1 1 0 000-2zM12 7a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6z" />
                    </svg>
                  </a>
                </li>

                {/* Telegram */}
                <li>
                  <a
                    href="#"
                    className="hover:text-primary flex size-42 items-center justify-center rounded-full bg-white/70 text-gray-700/60 transition hover:bg-white"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="size-20"
                    >
                      <path d="M21.944 4.686c.315-1.204-.433-1.676-1.456-1.297L2.84 10.18c-1.17.468-1.153 1.122-.2 1.415l4.53 1.414 10.49-6.617c.496-.302.95-.14.577.19l-8.495 7.668-.315 4.68c.461 0 .665-.212.923-.462l2.216-2.154 4.61 3.402c.85.468 1.46.227 1.672-.787L21.944 4.686z" />
                    </svg>
                  </a>
                </li>

                {/* LinkedIn */}
                <li>
                  <a
                    href="#"
                    className="hover:text-primary flex size-42 items-center justify-center rounded-full bg-white/70 text-gray-700/60 transition hover:bg-white"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="size-20"
                    >
                      <path d="M4.98 3.5A2.48 2.48 0 102.5 5.98 2.48 2.48 0 004.98 3.5zM3 8h4v13H3zm7 0h3.83v1.77h.05c.53-1.01 1.84-2.07 3.79-2.07 4.05 0 4.8 2.67 4.8 6.13V21h-4v-6.16c0-1.47-.03-3.36-2.05-3.36-2.06 0-2.38 1.6-2.38 3.25V21h-4z" />
                    </svg>
                  </a>
                </li>
              </ul>
            </div>

            {/* Quick Links (آکاردئونی در موبایل) */}
            <div>
              <h4
                onClick={() => setIsQuickOpen(!isQuickOpen)}
                className="text-primary-50 mb-18 flex cursor-pointer items-center justify-between text-lg font-bold lg:cursor-default"
              >
                <span>دسترسی سریع</span>
                <span className="lg:hidden">{isQuickOpen ? '−' : '+'}</span>
              </h4>

              <ul
                className={`space-y-14 ${isQuickOpen ? 'block' : 'hidden'} lg:block`}
              >
                <li>
                  <Link
                    to="/"
                    className="hover:text-secondary-300 text-sm"
                    href="/"
                  >
                    خانه
                  </Link>
                </li>
                <li>
                  <a
                    className="hover:text-secondary-300 text-sm"
                    href="/archive"
                  >
                    دوره‌ها
                  </a>
                </li>
                <li>
                  <Link
                    to="/about"
                    className="hover:text-secondary-300 text-sm"
                    href="/about"
                  >
                    درباره ما
                  </Link>
                </li>
                <li>
                  <Link
                    to="/collab"
                    className="hover:text-secondary-300 text-sm"
                    href="/collab"
                  >
                    همکاری با ما
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4
                onClick={() => setIsCoursesOpen(!isCoursesOpen)}
                className="text-primary-50 mb-18 flex cursor-pointer items-center justify-between text-lg font-bold lg:cursor-default"
              >
                <span>دوره‌ها</span>
                <span className="lg:hidden">{isCoursesOpen ? '−' : '+'}</span>
              </h4>

              <ul
                className={`space-y-14 ${isCoursesOpen ? 'block' : 'hidden'} lg:block`}
              >
                <li>
                  <Link
                    className="hover:text-secondary-300"
                    to="/course/react-course"
                  >
                    React
                  </Link>
                </li>

                <li>
                  <Link
                    className="hover:text-secondary-300"
                    to="/course/nextjs-course"
                  >
                    Next.js
                  </Link>
                </li>

                <li>
                  <Link
                    to="/course/tailwind-course"
                    className="hover:text-secondary-300"
                  >
                    Tailwind CSS
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div className="col-span-1 md:col-span-2 lg:col-span-2">
              <h4 className="text-primary-50 mb-18 text-lg font-bold">
                ارتباط با ما
              </h4>

              <ul className="space-y-14 text-white/70">
                <li className="flex items-center gap-10">
                  {/* Phone */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-secondary size-18"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M22 16.92v3a2 2 0 01-2.18 2A19.86 19.86 0 013 5.18 2 2 0 015 3h3a2 2 0 012 1.72l.38 2.66a2 2 0 01-.57 1.72L8.91 10.91a16 16 0 006.18 6.18l1.81-1.28a2 2 0 011.72-.57l2.66.38A2 2 0 0122 16.92z"
                    />
                  </svg>

                  <span className="text-sm">2867 123 0912</span>
                </li>

                <li className="flex items-center gap-10">
                  {/* Email */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-secondary size-18"
                  >
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 7l9 6 9-6"
                    />
                  </svg>

                  <span className="text-sm">info@example.com</span>
                </li>

                <li className="flex items-center gap-10">
                  {/* Location */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-secondary size-18"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z"
                    />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>

                  <span className="text-sm">
                    قزوین، باراجین، پارک علم و فناوری
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="text-14 mt-60 border-t border-white/10 pt-24 text-center text-white/60">
            تمامی حقوق برای کدکدا محفوظ است. &copy;
          </div>
        </div>
      </footer>
    </>
  );
}
