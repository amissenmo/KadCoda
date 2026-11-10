import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';
import { Navigate, useParams } from 'react-router';

import Breadcrumb from '../../components/layouts/BreadCrumb';
import Footer from '../../components/layouts/Footer';
import Header from '../../components/layouts/Header';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../contexts/AuthContext';
import {
  getCourseBySlug,
  getUserEnrolledCourses,
} from '../../services/courseApi';
import BackgroundDecor from './BackgroundDecor';
import CourseDescription from './CourseDescription';
import CourseIntro from './CourseIntro';
import CourseTabs from './CourseTabs';
import PurchaseCard from './PurchaseCard';
import SupportDescription from './SupportDescription';

export default function DetailCourse() {
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();

  const {
    data: fetchedCourse,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['course', slug],
    queryFn: () => getCourseBySlug(slug),
    enabled: Boolean(slug),
  });

  const { data: userEnrollments = [] } = useQuery({
    queryKey: ['user-courses'],
    queryFn: getUserEnrolledCourses,
    enabled: Boolean(isAuthenticated),
  });

  const course = useMemo(() => {
    if (!fetchedCourse) return null;

    const matchingEnrollment = userEnrollments.find(
      (item) =>
        item.course_id === fetchedCourse.id || item.slug === fetchedCourse.slug,
    );

    const licenseKey =
      matchingEnrollment?.license_key ||
      fetchedCourse.license_key ||
      fetchedCourse.licenseKey ||
      '';
    const isPurchased = Boolean(
      matchingEnrollment || fetchedCourse.isPurchased || licenseKey,
    );

    return {
      ...fetchedCourse,
      isPurchased,
      is_purchased: isPurchased,
      licenseKey,
      license_key: licenseKey,
    };
  }, [fetchedCourse, userEnrollments]);

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="flex min-h-screen w-full items-center justify-center bg-[#E8EDF5]">
          <Spinner className="border-primary-600/30 border-t-primary-600 h-40 w-40" />
        </div>
        <Footer />
      </>
    );
  }

  if (isError || !course) {
    return <Navigate to="/archive" replace />;
  }

  const breadcrumbItems = [
    { label: 'خانه', href: '/' },
    { label: 'دوره‌ها', href: '/archive' },
    { label: course.title, href: null },
  ];

  const highlights =
    Array.isArray(course.highlights) && course.highlights.length > 0
      ? course.highlights
      : [
          'پروژه‌محور و متناسب با نیاز بازار کار',
          'دسترسی دائمی به به‌روزرسانی‌ها',
          'پشتیبانی مستقیم با مدرس',
          'مناسب برای ورود به بازار کار',
        ];

  return (
    <>
      <Header />

      <div className="text-primary-800 selection:bg-primary-700 relative min-h-screen antialiased selection:text-white">
        <BackgroundDecor />
        <main className="relative container mx-auto pt-12 sm:pt-48">
          <Breadcrumb items={breadcrumbItems} />

          <div className="grid grid-cols-1 gap-48 lg:grid-cols-12">
            <div className="space-y-64 lg:col-span-7">
              <CourseIntro course={course} />

              <CourseTabs course={course} />

              <CourseDescription
                title={`درباره ${course.title}`}
                description={course.description}
                highlights={highlights}
              />

              <SupportDescription
                title={`پشتیبانی ${course.title}`}
                description="اگر در حین تماشای ویدیوها یا هنگام کار روی پروژه‌ها به مشکل خوردید، می‌تونید از طریق راه‌های زیر با تیم پشتیبانی یا خود مدرس در ارتباط باشید. تمام سوالات فنی و آموزشی در کمترین زمان پاسخ داده می‌شن."
                responseTime="کمتر از ۴ ساعت"
                channels={[
                  {
                    label: 'تیکت پشتیبانی',
                    value: 'ارسال تیکت از پنل کاربری',
                    href: '/panel/support',
                    icon: (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-20 w-20"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    ),
                  },
                  {
                    label: 'پشتیبانی تلگرام',
                    value: '@CodeKadaaSupport',
                    href: 'https://t.me/CodeKadaaSupport',
                    icon: (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-20 w-20"
                      >
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                      </svg>
                    ),
                  },
                  {
                    label: 'تماس تلفنی',
                    value: '۰۲۱-۱۲۳۴۵۶۷۸',
                    href: 'tel:+982112345678',
                    icon: (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-20 w-20"
                      >
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    ),
                  },
                ]}
              />
            </div>

            <div className="lg:col-span-5">
              <div className="lg:sticky lg:top-28">
                <PurchaseCard course={course} />
              </div>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </>
  );
}
