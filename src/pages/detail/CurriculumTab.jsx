import { useState } from 'react';

import AccordionItem from './AccordionItem';

export default function CurriculumTab({ course }) {
  const curriculum = course?.curriculum || [];
  const [openIds, setOpenIds] = useState(() =>
    curriculum[0]?.id ? [curriculum[0].id] : [],
  );

  const toggle = (id) =>
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  return (
    <div className="space-y-16">
      <div className="mb-16 sm:mb-24">
        <h3 className="text-primary text-md mb-4 font-bold sm:text-lg">
          ریز سرفصل‌های تفکیک شده
        </h3>
        <p className="mt-4 text-xs text-[#64748B] sm:mt-0">
          روی هر سرفصل کلیک کنید تا جزییات دقیق زمان‌ها و موضوعات را ببینید.
        </p>
      </div>

      {curriculum.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E4E4F7] p-24 text-center text-xs text-[#64748B]">
          سرفصل‌های این دوره به‌زودی منتشر خواهند شد.
        </div>
      ) : (
        curriculum.map((section) => (
          <AccordionItem
            key={section.id}
            item={section}
            isOpen={openIds.includes(section.id)}
            onToggle={() => toggle(section.id)}
          />
        ))
      )}
    </div>
  );
}
