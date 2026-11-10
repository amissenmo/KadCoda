import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';

import Spinner from '../../components/ui/Spinner';
import { getCourses } from '../../services/courseApi';
import CourseCard from './CourseCard';

export default function LastCourses() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['courses', { sort: 'newest', limit: 8 }],
    queryFn: () => getCourses({ sort: 'newest', limit: 8 }),
  });

  const courses = data?.items || [];

  return (
    <section className="py-56 md:py-72 lg:py-96">
      <div className="container">
        <div className="mb-30">
          <h2 className="text-3xl font-black text-gray-900">آخرین دوره‌ها</h2>

          <p className="mt-6 text-gray-500">
            جدیدترین دوره‌های آموزشی منتشر شده
          </p>
        </div>

        {isLoading ? (
          <div className="flex min-h-260 w-full items-center justify-center">
            <Spinner className="border-primary-600/30 border-t-primary-600 h-40 w-40" />
          </div>
        ) : isError ? (
          <div className="rounded-2xl bg-[#FEE2E2] p-24 text-center text-sm font-bold text-[#B91C1C]">
            خطا در بارگذاری لیست دوره‌ها
          </div>
        ) : courses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 p-32 text-center text-sm text-gray-500">
            هنوز دوره‌ای منتشر نشده است.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 sm:gap-32 lg:grid-cols-4">
            {courses.map((course) => (
              <CourseCard
                mobileHorizontal={true}
                key={course.id || course.slug}
                course={course}
              />
            ))}
          </div>
        )}

        <div className="mt-32 flex w-full items-center justify-center">
          <Link
            to="/archive"
            className="shadow-primary-900/30 hover:bg-primary-900 hover:text-primary-50 cursor-pointer rounded-md px-10 py-12 text-sm shadow-xs transition duration-300"
          >
            مشاهده همه دوره ها
          </Link>
        </div>
      </div>
    </section>
  );
}
