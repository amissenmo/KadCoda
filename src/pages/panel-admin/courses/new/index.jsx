import { useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';

import {
  addChapter as addChapterApi,
  addEpisode as addEpisodeApi,
  createCourse,
} from '../../../../services/courseApi';
import AddChapterForm from './AddChapterForm';
import ChapterList from './ChapterList';
import CourseInfoForm from './CourseInfoForm';
import CourseStepper from './CourseStepper';
import CourseSuccessBanner from './CourseSuccessBanner';

function PanelAdminCourseCreate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState('course');
  const [courseId, setCourseId] = useState(null);
  const [courseTitle, setCourseTitle] = useState('');

  const [chapters, setChapters] = useState([]);
  const [openChapter, setOpenChapter] = useState(null);
  const [episodeForm, setEpisodeForm] = useState({
    title: '',
    duration: '',
    video: null,
    is_free: false,
  });
  const [episodeVideoName, setEpisodeVideoName] = useState('');

  const createCourseMutation = useMutation({
    mutationFn: (form) =>
      createCourse({
        title: form.title,
        slug: form.slug,
        description: form.description,
        type: 'offline',
        price: Number(form.price) || 0,
        thumbnail_url: form.cover_img_name
          ? `/images/${form.cover_img_name}`
          : '/images/react.png',
        is_published: form.status === 'published' || Boolean(form.is_active),
      }),
    onSuccess: (res, form) => {
      const createdId = res?.id || res?.data?.id || res?.course?.id;
      setCourseId(createdId);
      setCourseTitle(form.title);
      setStep('content');
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      toast.success('دوره با موفقیت ایجاد شد. اکنون سرفصل‌ها را اضافه کنید.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: (err) => {
      toast.error(err?.message || 'خطا در ایجاد دوره جدید.');
    },
  });

  const addChapterMutation = useMutation({
    mutationFn: ({ title, orderIndex }) =>
      addChapterApi(courseId, {
        title,
        order_index: orderIndex,
      }),
    onSuccess: (res, variables) => {
      const createdChapterId =
        res?.id || res?.data?.id || res?.chapter?.id || Date.now();
      setChapters((prev) => [
        ...prev,
        {
          id: createdChapterId,
          title: variables.title,
          sort_order: variables.orderIndex,
          episodes: [],
        },
      ]);
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      toast.success('فصل جدید اضافه شد.');
    },
    onError: (err) => {
      toast.error(err?.message || 'خطا در افزودن فصل.');
    },
  });

  const addEpisodeMutation = useMutation({
    mutationFn: ({ chapterId, payload }) =>
      addEpisodeApi(chapterId, {
        title: payload.title,
        order_index: payload.sort_order,
        video_url: payload.videoName || 'intro.mp4',
        duration_seconds: (parseInt(payload.duration, 10) || 10) * 60,
        is_free_preview: Boolean(payload.is_free),
      }),
    onSuccess: (res, { chapterId, payload }) => {
      const createdEpId =
        res?.id || res?.data?.id || res?.episode?.id || Date.now();
      setChapters((prev) =>
        prev.map((ch) => {
          if (ch.id !== chapterId) return ch;
          return {
            ...ch,
            episodes: [
              ...ch.episodes,
              {
                id: createdEpId,
                title: payload.title,
                duration: payload.duration,
                video: payload.video,
                is_free: payload.is_free,
                sort_order: payload.sort_order,
              },
            ],
          };
        }),
      );
      setEpisodeForm({ title: '', duration: '', video: null, is_free: false });
      setEpisodeVideoName('');
      setOpenChapter(null);
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      toast.success('اپیزود با موفقیت به فصل اضافه شد.');
    },
    onError: (err) => {
      toast.error(err?.message || 'خطا در افزودن اپیزود.');
    },
  });

  const handleCourseSubmit = (form) => {
    createCourseMutation.mutate(form);
  };

  const handleAddChapter = (title) => {
    addChapterMutation.mutate({
      title,
      orderIndex: chapters.length + 1,
    });
  };

  const handleAddEpisode = (chapterId) => {
    if (!episodeForm.title.trim()) return;
    const targetChapter = chapters.find((ch) => ch.id === chapterId);
    const nextOrder = (targetChapter?.episodes?.length || 0) + 1;

    addEpisodeMutation.mutate({
      chapterId,
      payload: {
        title: episodeForm.title.trim(),
        duration: episodeForm.duration.trim(),
        video: episodeForm.video,
        videoName: episodeVideoName,
        is_free: episodeForm.is_free,
        sort_order: nextOrder,
      },
    });
  };

  const handleOpenChapter = (id) => {
    if (openChapter === id) {
      setOpenChapter(null);
    } else {
      setOpenChapter(id);
      setEpisodeForm({ title: '', duration: '', video: null, is_free: false });
      setEpisodeVideoName('');
    }
  };

  const handleFinish = () => {
    queryClient.invalidateQueries({ queryKey: ['courses'] });
    queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
    toast.success('ساخت دوره و سرفصل‌ها با موفقیت تکمیل شد.');
    navigate('/panel-admin/courses');
  };

  return (
    <>
      <CourseStepper step={step} />

      {step === 'course' && (
        <CourseInfoForm
          onSubmit={handleCourseSubmit}
          isSubmitting={createCourseMutation.isPending}
        />
      )}

      {step === 'content' && (
        <>
          <CourseSuccessBanner courseId={courseId} courseTitle={courseTitle} />

          <AddChapterForm
            nextOrder={chapters.length + 1}
            onAdd={handleAddChapter}
          />

          <ChapterList
            chapters={chapters}
            openChapter={openChapter}
            onToggleChapter={handleOpenChapter}
            episodeForm={episodeForm}
            setEpisodeForm={setEpisodeForm}
            episodeVideoName={episodeVideoName}
            setEpisodeVideoName={setEpisodeVideoName}
            onAddEpisode={handleAddEpisode}
          />

          <div className="mt-25 flex flex-col-reverse gap-12 sm:flex-row sm:justify-end">
            <Link
              to="/panel-admin/courses"
              className="rounded-xl bg-[#EDF1F8] px-20 py-12 text-center text-[11px] font-bold text-[#8A96B0] shadow-[-3px_-3px_7px_0px_#FFFFFFE5,_4px_4px_10px_0px_#A3B1C673] transition duration-200 hover:text-[#1C2B4A]"
            >
              بازگشت به لیست دوره‌ها
            </Link>
            <button
              type="button"
              onClick={handleFinish}
              className="to-primary-600 cursor-pointer rounded-xl bg-gradient-to-br from-[#1E4D9C] px-20 py-12 text-[11px] font-black text-white shadow-[3px_3px_8px_0px_#193B734D] transition duration-200 hover:brightness-110"
            >
              پایان و ذخیره دوره
            </button>
          </div>
        </>
      )}
    </>
  );
}

export default PanelAdminCourseCreate;
