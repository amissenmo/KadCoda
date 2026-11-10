import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import { getCourses } from '../../services/courseApi';
import ArchiveSideBar from '../archive/ArchiveSideBar';
import ArchiveOnlineCourses from './ArchiveOnlineCourses';

export default function ArchiveOnlineContent() {
  const [sortBy, setSortBy] = useState('newest');
  const [onlyFree, setOnlyFree] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [limit, setLimit] = useState(12);

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      'courses',
      { type: 'online', sort: sortBy, search: searchQuery, limit },
    ],
    queryFn: () =>
      getCourses({
        type: 'online',
        sort: sortBy,
        search: searchQuery || undefined,
        limit,
      }),
  });

  const rawCourses = data?.items || [];
  const filteredCourses = onlyFree
    ? rawCourses.filter((c) => (c.final_price || 0) === 0)
    : rawCourses;
  const hasMore = (data?.total_items || 0) > rawCourses.length;

  return (
    <div className="container grid grid-cols-12 lg:gap-64 xl:gap-56">
      <div className="col-span-12 lg:col-span-3">
        <ArchiveSideBar
          sortBy={sortBy}
          onSortChange={setSortBy}
          onlyFree={onlyFree}
          onOnlyFreeChange={setOnlyFree}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      <div className="col-span-12 lg:col-span-9">
        <ArchiveOnlineCourses
          courses={filteredCourses}
          isLoading={isLoading}
          isError={isError}
          hasMore={hasMore}
          onLoadMore={() => setLimit((prev) => prev + 12)}
        />
      </div>
    </div>
  );
}
