import { Helmet } from 'react-helmet-async';
import { APP_NAME } from '@/constants/ui';

export function NotFoundPage() {
  return (
    <>
      <Helmet>
        <title>404 - {APP_NAME}</title>
      </Helmet>
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold">404</h1>
          <p className="mt-2 text-muted-foreground">Trang không tồn tại</p>
        </div>
      </div>
    </>
  );
}
