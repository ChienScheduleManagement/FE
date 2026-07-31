export function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-md w-full text-center">
        <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-[48px]">block</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          403 - Không có quyền truy cập
        </h1>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          Bạn không có quyền truy cập vào trang này.
          <br />
          Vui lòng kiểm tra lại quyền hoặc liên hệ quản trị viên.
        </p>
        <a
          href="/"
          className="inline-block bg-primary hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow transition-all"
        >
          Về trang chủ
        </a>
      </div>
    </div>
  )
}
