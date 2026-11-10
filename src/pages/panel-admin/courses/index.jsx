import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router';

import FilterSelect from '../../../components/ui/FilterSelect';
import Spinner from '../../../components/ui/Spinner';
import Stat from '../../../components/ui/Stat';
import { getCourses } from '../../../services/courseApi';

const cardAnim = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: 'easeOut' },
  },
};

const categories = [
  { value: 'all', label: 'همه دسته‌بندی‌ها' },
  { value: 'online', label: 'آنلاین' },
  { value: 'offline', label: 'آفلاین / ویدیویی' },
];

function PanelAdminCourses() {
  const [onlyActive, setOnlyActive] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const { data: coursesData, isLoading } = useQuery({
    queryKey: ['admin-courses', categoryFilter],
    queryFn: () =>
      getCourses({
        type: categoryFilter !== 'all' ? categoryFilter : undefined,
        limit: 50,
      }),
  });

  const rawCourses = Array.isArray(coursesData)
    ? coursesData
    : Array.isArray(coursesData?.data)
      ? coursesData.data
      : Array.isArray(coursesData?.courses)
        ? coursesData.courses
        : [];

  const mappedCourses = rawCourses
    .map((c, idx) => {
      const isPublished = c.is_published ?? true;
      const chaptersList = Array.isArray(c.chapters) ? c.chapters : [];
      const lessonsCount =
        c.episodes_count ??
        chaptersList.reduce(
          (acc, ch) =>
            acc + (Array.isArray(ch.episodes) ? ch.episodes.length : 0),
          0,
        );

      return {
        id: c.id || idx + 1,
        slug: c.slug || '',
        title: c.title || 'بدون عنوان',
        instructor: c.instructor_name || c.teacher_name || 'تیم آموزشی کدکدا',
        category: c.type === 'online' ? 'آنلاین' : 'ویدیویی',
        categoryClass:
          c.type === 'online'
            ? 'bg-[#FFF3DC] text-[#B07D00]'
            : 'bg-[#DCE5F4] text-[#193B73]',
        isPublished,
        status: isPublished ? 'فعال' : 'پیش‌نویس',
        statusClass: isPublished
          ? 'bg-[#DCFCE7] text-[#15803D]'
          : 'bg-[#FFF3DC] text-[#B07D00]',
        price: Number(c.price || 0).toLocaleString('fa-IR'),
        students: Number(c.students_count ?? c.students ?? 0).toLocaleString(
          'fa-IR',
        ),
        lessons: Number(lessonsCount).toLocaleString('fa-IR'),
        duration: c.duration || '۲۰ ساعت',
        cover: c.thumbnail_url || c.cover || '/images/react.png',
      };
    })
    .filter((course) => {
      if (onlyActive && !course.isPublished) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          course.title.toLowerCase().includes(q) ||
          course.instructor.toLowerCase().includes(q)
        );
      }
      return true;
    });

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex flex-col gap-20 rounded-2xl bg-[#EDF1F8] p-20 shadow-[-4px_-4px_12px_0px_#FFFFFFE5,_6px_6px_16px_0px_#A3B1C680] sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="relative text-lg font-black text-[#1C2B4A]">
            مدیریت دوره‌ها
          </h1>
          <p className="pt-8 text-[12px] text-[#8A96B0]">
            ایجاد، ویرایش و مدیریت تمام دوره‌های پلتفرم آموزش کدکدا
          </p>
        </div>

        <Link
          to="/panel-admin/newCourse"
          type="button"
          className="to-primary-600 inline-flex w-fit cursor-pointer items-center gap-8 rounded-xl bg-gradient-to-br from-[#1E4D9C] px-16 py-10 text-[11px] font-black whitespace-nowrap text-white shadow-[3px_3px_8px_0px_#193B734D] transition duration-200 hover:brightness-110"
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
          افزودن دوره جدید
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
        className="mt-20 flex flex-col gap-12 lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="flex items-center gap-8 rounded-xl bg-[#E4E9F2] px-12 py-8 shadow-[inset_-2px_-2px_4px_0px_#FFFFFFCC,_inset_2px_2px_5px_0px_#A3B1C666] lg:w-300">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.8}
            stroke="currentColor"
            className="h-16 w-16 shrink-0 text-[#8A96B0]"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-4.35-4.35M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجوی دوره، مدرس یا دسته‌بندی..."
            className="w-full bg-transparent text-[11px] text-[#1C2B4A] placeholder-[#8A96B0] outline-none"
          />
        </div>

        <div className="flex flex-col gap-12 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => setOnlyActive((prev) => !prev)}
            className={`inline-flex cursor-pointer items-center gap-8 rounded-xl px-16 py-10 text-[11px] font-bold whitespace-nowrap transition duration-200 ${
              onlyActive
                ? 'text-primary-600 bg-[#DCE5F4] shadow-[inset_-2px_-2px_3px_0px_#FFFFFFCC,_inset_2px_2px_4px_0px_#A3B1C666]'
                : 'bg-[#EDF1F8] text-[#8A96B0] shadow-[-3px_-3px_7px_0px_#FFFFFFE5,_4px_4px_10px_0px_#A3B1C673] hover:text-[#1C2B4A]'
            }`}
          >
            <span
              className={`h-10 w-10 rounded-full transition duration-200 ${
                onlyActive
                  ? 'bg-[#22C55E] shadow-[0_0_6px_0_#22C55EAA]'
                  : 'bg-[#A3B1C6]'
              }`}
            ></span>
            فقط دوره‌های فعال
          </button>

          <div className="sm:w-200">
            <FilterSelect
              options={categories}
              value={categoryFilter}
              onChange={(val) => setCategoryFilter(val)}
            />
          </div>
        </div>
      </motion.div>

      {isLoading ? (
        <Spinner />
      ) : (
        <motion.section
          initial="hidden"
          animate="show"
          className="mt-25 grid grid-cols-1 gap-20 md:grid-cols-2 xl:grid-cols-3"
        >
          {mappedCourses.map((course, i) => (
            <motion.div
              key={course.id}
              variants={cardAnim}
              transition={{
                duration: 0.45,
                delay: i * 0.06,
                ease: 'easeOut',
              }}
              whileHover={{ y: -4 }}
              className="flex flex-col gap-16 rounded-2xl bg-[#EDF1F8] p-16 shadow-[-4px_-4px_12px_0px_#FFFFFFE5,_6px_6px_16px_0px_#A3B1C680]"
            >
              <div className="relative h-140 w-full overflow-hidden rounded-xl shadow-[inset_1px_1px_4px_0px_#FFFFFF40,_3px_3px_8px_0px_#193B734D]">
                <img
                  src={course.cover}
                  alt={course.title}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />

                <span
                  className={`absolute top-10 right-10 rounded-full px-10 py-2 text-[10px] font-bold shadow-[0_0_8px_0_#00000026] ${course.statusClass}`}
                >
                  {course.status}
                </span>
              </div>

              <span
                className={`w-fit rounded-full px-10 py-2 text-[10px] font-bold ${course.categoryClass}`}
              >
                {course.category}
              </span>

              <div className="flex flex-col gap-4">
                <h3 className="text-[13px] font-black text-[#1C2B4A]">
                  {course.title}
                </h3>
                <p className="text-[11px] text-[#8A96B0]">
                  مدرس: <span className="font-bold">{course.instructor}</span>
                </p>
              </div>

              <div className="grid grid-cols-3 gap-8 rounded-lg bg-[#E4E9F2] p-10 shadow-[inset_-2px_-2px_4px_0px_#FFFFFFCC,_inset_2px_2px_5px_0px_#A3B1C666]">
                <Stat label="دانشجو" value={course.students} />
                <Stat label="جلسات" value={course.lessons} />
                <Stat label="مدت" value={course.duration} />
              </div>

              <div className="flex items-center justify-between border-t border-t-[#A3B1C640] pt-12">
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-[#8A96B0]">قیمت</span>
                  <span className="text-primary-600 text-sm font-black">
                    {course.price}{' '}
                    <span className="text-[10px] font-bold text-[#8A96B0]">
                      تومان
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-8">
                  <Link
                    to={`/panel-admin/editCourse?slug=${course.slug || course.id}`}
                    type="button"
                    aria-label="ویرایش"
                    className="to-primary-600 flex h-32 w-32 cursor-pointer items-center justify-center rounded-lg bg-gradient-to-br from-[#1E4D9C] text-white shadow-[3px_3px_8px_0px_#193B734D] transition duration-200 hover:brightness-110"
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
                        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.section>
      )}
    </>
  );
}

export default PanelAdminCourses;
