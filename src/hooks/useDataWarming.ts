import {
  type QueryKey,
  type UseQueryOptions,
  useQueryClient,
} from '@tanstack/react-query'
import { useEffect } from 'react'
import {
  getGetCategoriesQueryOptions,
  getGetDashboardQueryOptions,
  getGetDepartmentsQueryOptions,
  getGetDocSourcesQueryOptions,
  getGetDocumentsQueryOptions,
  getGetTasksQueryOptions,
} from '@/api/generated'
import { DEFAULT_PAGE_SIZE, CATEGORY_TYPE } from '@/constants/task'
import { useAuthStore } from '@/store/auth.store'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function useDataWarming() {
  const queryClient = useQueryClient()
  const token = useAuthStore((s) => s.user?.token)

  useEffect(() => {
    if (!token) return

    const warming = async () => {
      try {
        console.log('[DataWarming] Starting staggered cache warming...')

        // Helper để prefetch rồi nghỉ một lát, tránh dồn dập request lên server
        const staggeredPrefetch = async <
          TQueryFnData,
          TError,
          TData,
          TQueryKey extends QueryKey,
        >(
          queryOptions: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
        ) => {
          await queryClient.prefetchQuery({
            queryKey: queryOptions.queryKey,
            queryFn: queryOptions.queryFn,
          })
          await sleep(400)
        }

        // 1. Dashboard
        await staggeredPrefetch(getGetDashboardQueryOptions())

        // 2. Nhiệm vụ - trang đầu (default filter của TasksPage)
        await staggeredPrefetch(
          getGetTasksQueryOptions({
            Tab: undefined,
            Page: 1,
            PageSize: DEFAULT_PAGE_SIZE,
            Keyword: undefined,
            DepartmentId: undefined,
          }),
        )

        // 3. Văn bản - trang đầu (default filter của DocumentsPage)
        await staggeredPrefetch(
          getGetDocumentsQueryOptions({
            Page: 1,
            PageSize: DEFAULT_PAGE_SIZE,
            Keyword: undefined,
            SourceId: undefined,
          }),
        )

        // 4. Danh mục dùng chung cho dropdown
        await staggeredPrefetch(getGetDocSourcesQueryOptions())
        await staggeredPrefetch(getGetCategoriesQueryOptions({ type: CATEGORY_TYPE.DOC_TYPE }))
        await staggeredPrefetch(getGetDepartmentsQueryOptions({ activeOnly: true }))

        console.log('[DataWarming] Cache warming completed successfully.')
      } catch (error) {
        // Prefetch fail không nên làm crash ứng dụng
        console.warn('[DataWarming] Prefetching encountered an issue:', error)
      }
    }

    // Đợi 1.5s sau khi vào trang rồi mới bắt đầu "làm ấm" cache
    const timeout = setTimeout(warming, 1500)
    return () => clearTimeout(timeout)
  }, [queryClient, token])
}
