import { Button } from '@base-ui/react';

import Spinner from '../../components/ui/Spinner';
import CourseCard from '../homepage/CourseCard';

export default function ArchiveCourses({
  courses = [],
  isLoading = false,
  isError = false,
  hasMore = false,
  onLoadMore,
}) {
  if (isLoading) {
    return (
      <section className="flex min-h-320 items-center justify-center pt-28 pb-32 md:py-45 lg:pr-40">
        <Spinner className="border-primary-600/30 border-t-primary-600 h-40 w-40" />
      </section>
    );
  }

  if (isError) {
    return (
      <section className="pt-28 pb-32 md:py-45 lg:pr-40">
        <div className="rounded-2xl bg-[#FEE2E2] p-24 text-center text-sm font-bold text-[#B91C1C]">
          خطا در دریافت لیست دوره‌ها از سرور
        </div>
      </section>
    );
  }

  if (courses.length === 0) {
    return (
      <section className="pt-28 pb-32 md:py-45 lg:pr-40">
        <div className="rounded-2xl border border-dashed border-gray-300 p-32 text-center text-sm text-gray-500">
          دوره‌ای مطابق با فیلترهای انتخابی شما یافت نشد.
        </div>
      </section>
    );
  }

  return (
    <section className="pt-28 pb-32 md:py-45 lg:pr-40">
      <div className="grid grid-cols-1 gap-24 sm:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <CourseCard
            key={course.id || course.slug}
            mobileHorizontal={true}
            course={course}
          />
        ))}
      </div>

      {hasMore && (
        <div className="flex w-full items-center justify-center">
          <Button
            onClick={onLoadMore}
            className="bg-primary-500 hover:bg-primary-600 text-primary-100 my-auto mt-40 cursor-pointer rounded-sm px-24 py-12 hover:text-white"
          >
            مشاهده بیشتر
          </Button>
        </div>
      )}
    </section>
  );
}
