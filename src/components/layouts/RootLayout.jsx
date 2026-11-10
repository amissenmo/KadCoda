import { Outlet } from 'react-router';
import { Toaster } from 'sonner';

import ScrollToTop from '../common/ScrollToTop';

export default function RootLayout() {
  return (
    <>
      <ScrollToTop />
      <Toaster position="top-center" richColors dir="rtl" />
      <Outlet />
    </>
  );
}
