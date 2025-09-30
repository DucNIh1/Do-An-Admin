import { useQuery } from "@tanstack/react-query";
import { BoxIconLine, GroupIcon } from "../../icons";
import axiosConfig from "../../axios/config";

export default function EcommerceMetrics() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["generalStatistics"],
    queryFn: async () => {
      const res = await axiosConfig.get("/api/analytics/general");
      return res.data.data;
    },
  });

  if (isLoading) return <div>Đang tải...</div>;
  if (isError) return <div>Lỗi khi tải thống kê</div>;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Tổng số sinh viên
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {data.totalStudents}
            </h4>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Tổng số bài viết
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {data.totalPosts}
            </h4>
          </div>
        </div>
      </div>
    </div>
  );
}
