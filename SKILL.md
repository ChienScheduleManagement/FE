# SKILL: Chuẩn khởi tạo và phát triển dự án FE (Vite + React + TS)

Tài liệu mẫu đúc kết từ dự án ScheduleManagement FE, dùng làm chuẩn khi bắt đầu dự án
mới hoặc đọc lại để tránh các sai lầm đã gặp.

## 1. Stack chuẩn

| Thành phần | Lựa chọn |
|---|---|
| Build | Vite + React 19 + TypeScript |
| Router | TanStack Router (file-based) |
| Data fetching | TanStack Query v5 |
| API client | Axios (instance duy nhất có interceptor auth + refresh token) |
| Sinh API code | orval (`client: react-query`, mutator dùng instance riêng) |
| Form | react-hook-form + zod + `zodResolver` |
| Schema | Zod v4, tách riêng trong `src/schemas/` |
| Style | Tailwind CSS + shadcn/ui (thư mục `src/components/ui`) |
| State | Zustand (auth store...) |
| Toast | sonner |
| Lint/Format | Biome |
| Table | TanStack Table + component `DataTable` tự viết |

## 2. Checklist khởi tạo dự án mới

1. Scaffold Vite React-TS, cài đủ stack ở mục 1.
2. Thiết lập orval ngay từ đầu (xem `orval.config.ts` mẫu):
   - `input` = swagger BE (dùng env `ORVAL_INPUT`), `output` gồm `generated.ts` +
     `schemas` tách riêng `src/api/model`, `mutator` trỏ tới `apiOrvalClient`.
   - Script: `"gen:api": "orval"`.
   - Sau mỗi lần BE đổi API: chạy `npm run gen:api` RỒI mới sửa UI.
3. Thiết kế theme system typesafe từ đầu (`src/constants/theme.ts` + CSS block
   trong `global.css`): light/dark + màu thương hiệu (blue/pink).
4. Viết component lưới chuẩn `DataTable` (sort, select, pagination) dùng chung.
5. Định nghĩa `showError(error: unknown, fallback?)` và `toastSmartPromise`
   dùng chung cho toàn bộ thao tác async.
6. Xóa file cấu hình trùng (VD: `vite.config.js` nếu đã có `.ts` — Vite ưu tiên `.js`).

## 3. Cấu trúc thư mục chuẩn

```
src/
├── api/
│   ├── client.ts          # axios instance + interceptor + refresh token + apiOrvalClient
│   ├── generated.ts       # orval sinh: hook react-query (useGetX, useCreateX, useUpdateXById, useDeleteXById)
│   ├── model/             # orval sinh: request/response/params types
│   └── utils.ts           # showError, toastSmartPromise, invalidate helper
├── schemas/               # Zod schema cho form, tách theo domain (task.schema.ts, auth.schema.ts...)
├── constants/             # theme.ts, ui.ts (APP_NAME...)
├── lib/                   # unwrapApiResponse, utils
├── store/                 # zustand
├── components/            # ui/ (shadcn), DataTable/, ConfirmDialog, TooltipButton...
└── ui/pages/<module>/     # page + components/ con
```

## 4. Patterns bắt buộc

### API: chỉ dùng hook orval, không gọi axios trực tiếp

```ts
// Query
const { data, isLoading, isError, error, refetch } = useGetBaseSalaries()

// Mutation
const { mutateAsync: createX } = useCreateBaseSalaries()
await toastSmartPromise(createX({ data: payload }), {
  loading: 'Đang lưu...', success: 'Thành công!',
})

// Refetch sau khi đổi dữ liệu
queryClient.invalidateQueries({ queryKey: ['/api/base-salaries'] })
```

- Không gọi `apiClient.get(...)` ở page; chỉ dùng hàm/hook orval.
- Mutation luôn bọc `toastSmartPromise`; lỗi hiển thị qua `showError`.
- Với request cần bỏ auth (login): dùng `useLoginAuth({ request: { skipAuth: true } })`
  chứ không tự viết `useMutation`.
- Response chuẩn dạng `{ success, data, message }` phải unwrap bằng
  `unwrapApiResponse<T>(data)`.

### Form: schema Zod tập trung + zodResolver

- Schema nằm ở `src/schemas/<domain>.schema.ts`, import vào page/dialog.
- Validate cross-field (VD: xác nhận mật khẩu) dùng `.refine()`.
- Type riêng: `type LoginFormValues = z.infer<typeof loginFormSchema>`.

### Theme: không hard-code màu thương hiệu

- Dùng biến theme: `bg-primary text-primary-foreground` — TUYỆT ĐỐI không viết
  `bg-primary text-white` (dark mode primary = trắng sẽ hỏng).
- Nhãn/trạng thái dùng `bg-primary/10 text-primary`.
- Gradient theo theme: `from-primary via-primary to-primary/30`.
- Chỉ giữ màu semantic cứng: đỏ (lỗi/xóa), emerald (thành công/hiện tại), amber/vàng (cảnh báo).
- Thêm theme mới: sửa `constants/theme.ts` (THEMES, THEME_ORDER, THEME_CLASSES,
  THEME_LABELS, icon) + CSS block trong `global.css`.

## 5. Sai lầm đã gặp — không lặp lại

1. **`bg-primary text-white`** → mất chữ trong dark mode. Dùng `text-primary-foreground`.
2. **Gọi API thủ công** (`apiClient.get('/api/x')`, tự viết `useQuery`/`useMutation`)
   → dễ lệch URL/params/model, mất type safety. Chỉ dùng code orval.
3. **Validate form tự viết trong file component** → rải rác, lệch BE. Tách schema,
   rồi audit từng rule với FluentValidation BE: maxLength, min/range (`>=`), required.
4. **FE gửi payload thiếu field BE bắt buộc** → API lỗi 400. Mỗi khi BE có validator
   (VD: `CompletedDate.NotNull()`), phải đối chiếu request FE đủ field chưa.
5. **Xử lý input số để nhận chuỗi rỗng** → bug `Math.max(0, x)` cho kết quả sai khi
   x = -1. Chuyển đổi an toàn trước khi validate.
6. **Nhiều file config vite (`.js` + `.ts`)** → Vite đọc `.js` bỏ qua `.ts`. Chỉ giữ một.
7. **Overlay gradient tối dùng `bg-black/40` cố định** → tối đen trong dark mode.
   Dùng `bg-slate-950/40 dark:bg-black/60`.
8. **Import type lẫn với import thường** → sau khi tách schema, cập nhật `import type`
   cho các type (biome cũng báo).

## 6. Quy ước và quy trình kết thúc

- UI text, toast message, commit message viết tiếng Việt.
- Commit: prefix `feat:` / `fix:` / `style:` / `chore:` + ngắn gọn, mô tả ở body nếu cần.
- Trước khi bàn giao luôn chạy: `npm run typecheck` và `npm run lint` (cả hai phải pass).
- Commit theo chủ đề, tách riêng từng loại thay đổi (feat/fix/chore không trộn).
