import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router';

import Spinner from '../../../components/ui/Spinner';
import Stat from '../../../components/ui/Stat';
import { getArticles } from '../../../services/articleApi';

const cardAnim = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: 'easeOut' },
  },
};

const gradients = [
  'from-[#1E4D9C] to-primary-600',
  'from-[#7F1D1D] to-[#EF4444]',
  'from-[#BE185D] to-[#F472B6]',
  'from-[#5B21B6] to-[#8B5CF6]',
  'from-[#15803D] to-[#22C55E]',
];

function PanelAdminArticles() {
  const [onlyPublished, setOnlyPublished] = useState(false);
  const [search, setSearch] = useState('');

  const { data: articlesData, isLoading } = useQuery({
    queryKey: ['articles'],
    queryFn: () => getArticles({ limit: 50 }),
  });

  const rawArticles = Array.isArray(articlesData)
    ? articlesData
    : Array.isArray(articlesData?.data)
      ? articlesData.data
      : Array.isArray(articlesData?.articles)
        ? articlesData.articles
        : [];

  const articles = rawArticles
    .map((a, idx) => {
      const authorName = a.author
        ? `${a.author.first_name || ''} ${a.author.last_name || ''}`.trim() ||
          a.author.mobile
        : a.author_name || 'تحریریه کدکدا';
      const tagsList = Array.isArray(a.tags) ? a.tags : [];
      const firstTag = tagsList[0] || a.category || 'مقاله آموزشی';
      const contentText = a.content_markdown || a.excerpt || '';
      const excerptText =
        a.excerpt ||
        (contentText.length > 100
          ? `${contentText.slice(0, 100)}...`
          : contentText || 'مقاله تخصصی برنامه‌نویسی و توسعه نرم‌افزار');

      return {
        id: a.id || idx + 1,
        slug: a.slug || '',
        title: a.title || 'بدون عنوان',
        excerpt: excerptText,
        author: authorName,
        category: firstTag,
        categoryClass: 'bg-[#DCE5F4] text-[#193B73]',
        isPublished: true,
        status: 'منتشر شده',
        statusClass: 'bg-[#DCFCE7] text-[#15803D]',
        views: Number(a.views_count ?? a.views ?? 0).toLocaleString('fa-IR'),
        date: a.created_at
          ? new Date(a.created_at).toLocaleDateString('fa-IR')
          : a.date || '۱۴۰۳/۰۵/۱۲',
        readTime: a.readTime || '۸ دقیقه',
        gradient: gradients[idx % gradients.length],
      };
    })
    .filter((article) => {
      if (onlyPublished && !article.isPublished) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          article.title.toLowerCase().includes(q) ||
          article.author.toLowerCase().includes(q) ||
          article.category.toLowerCase().includes(q)
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
            مدیریت مقالات
          </h1>
          <p className="pt-8 text-[12px] text-[#8A96B0]">
            ایجاد، ویرایش و مدیریت تمام مقالات پلتفرم آموزش کدکدا
          </p>
        </div>

        <Link
          to="/panel-admin/newArticles"
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
          افزودن مقاله جدید
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
            placeholder="جستجوی مقاله، نویسنده یا دسته‌بندی..."
            className="w-full bg-transparent text-[11px] text-[#1C2B4A] placeholder-[#8A96B0] outline-none"
          />
        </div>

        <div className="flex flex-col gap-12 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => setOnlyPublished((prev) => !prev)}
            className={`inline-flex cursor-pointer items-center gap-8 rounded-xl px-16 py-10 text-[11px] font-bold whitespace-nowrap transition duration-200 ${
              onlyPublished
                ? 'text-primary-600 bg-[#DCE5F4] shadow-[inset_-2px_-2px_3px_0px_#FFFFFFCC,_inset_2px_2px_4px_0px_#A3B1C666]'
                : 'bg-[#EDF1F8] text-[#8A96B0] shadow-[-3px_-3px_7px_0px_#FFFFFFE5,_4px_4px_10px_0px_#A3B1C673] hover:text-[#1C2B4A]'
            }`}
          >
            <span
              className={`h-10 w-10 rounded-full transition duration-200 ${
                onlyPublished
                  ? 'bg-[#22C55E] shadow-[0_0_6px_0_#22C55EAA]'
                  : 'bg-[#A3B1C6]'
              }`}
            ></span>
            فقط مقالات منتشر شده
          </button>
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
          {articles.map((article, i) => (
            <motion.article
              key={article.id}
              variants={cardAnim}
              transition={{
                duration: 0.45,
                delay: i * 0.06,
                ease: 'easeOut',
              }}
              whileHover={{ y: -4 }}
              className="flex flex-col gap-16 rounded-2xl bg-[#EDF1F8] p-16 shadow-[-4px_-4px_12px_0px_#FFFFFFE5,_6px_6px_16px_0px_#A3B1C680]"
            >
              <div
                className={`relative flex h-140 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br ${article.gradient} shadow-[inset_1px_1px_4px_0px_#FFFFFF40,_3px_3px_8px_0px_#193B734D]`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-56 w-56 text-white/90"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z"
                  />
                </svg>

                <span
                  className={`absolute top-10 right-10 rounded-full px-10 py-2 text-[10px] font-bold shadow-[0_0_8px_0_#00000026] ${article.statusClass}`}
                >
                  {article.status}
                </span>
              </div>

              <span
                className={`w-fit rounded-full px-10 py-2 text-[10px] font-bold ${article.categoryClass}`}
              >
                {article.category}
              </span>

              <div className="flex flex-col gap-6">
                <h3 className="line-clamp-2 text-[13px] font-black text-[#1C2B4A]">
                  {article.title}
                </h3>
                <p className="line-clamp-2 text-[11px] leading-relaxed text-[#8A96B0]">
                  {article.excerpt}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-8 rounded-lg bg-[#E4E9F2] p-10 shadow-[inset_-2px_-2px_4px_0px_#FFFFFFCC,_inset_2px_2px_5px_0px_#A3B1C666]">
                <Stat label="بازدید" value={article.views} />
                <Stat label="زمان خواندن" value={article.readTime} />
                <Stat label="تاریخ" value={article.date} />
              </div>

              <div className="flex items-center justify-between border-t border-t-[#A3B1C640] pt-12">
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-[#8A96B0]">نویسنده</span>
                  <span className="text-primary-600 text-[11px] font-black">
                    {article.author}
                  </span>
                </div>

                <div className="flex items-center gap-8">
                  <Link
                    to={`/panel-admin/editArticle?slug=${article.slug || article.id}`}
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
            </motion.article>
          ))}
        </motion.section>
      )}
    </>
  );
}

export default PanelAdminArticles;
