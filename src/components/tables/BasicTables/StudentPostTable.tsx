import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { FaTrash, FaEye, FaCheck } from "react-icons/fa";
import { MdRefresh } from "react-icons/md";
import { FaUndo } from "react-icons/fa";
import axiosConfig from "../../../axios/config";
import ConfirmModal from "../../common/ConfirmModal";
import PostPreviewModal from "../../posts/PostPreviewModal";
import { getPostsAPI } from "../../../service/postService";
import Select from "react-select";
import customStyles from "../../../utils/SelectCustomStyles";

type Post = {
  id: string;
  title: string;
  teaser: string;
  content: string;
  thumbnail?: string;
  isFeatured: boolean;
  deletedAt: string | null;
  createdAt: string;
  status: string;
  images: any[];
  major?: { id: string; name: string };
  author?: { id: string; name: string; role: string };
};

type Major = { value: string; label: string };
type Status = { value: string; label: string };

export default function StudentPostsTable() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [selectedMajor, setSelectedMajor] = useState<Major | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<Status | null>(null);

  const limit = 5;

  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    post: Post | null;
  }>({ isOpen: false, post: null });

  const [previewModalState, setPreviewModalState] = useState<{
    isOpen: boolean;
    post: Post | null;
  }>({ isOpen: false, post: null });

  const [approveModalState, setApproveModalState] = useState<{
    isOpen: boolean;
    post: Post | null;
  }>({ isOpen: false, post: null });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const { data: majorsData } = useQuery({
    queryKey: ["majors"],
    queryFn: async () => {
      const res = await axiosConfig.get("/api/majors", {
        params: { limit: 1000 },
      });
      return res.data.majors.map((m: any) => ({
        value: m.id,
        label: m.name,
      }));
    },
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["posts", page, debouncedSearch, selectedMajor, selectedStatus],
    queryFn: async () =>
      await getPostsAPI({
        page,
        limit,
        title: debouncedSearch,
        isFromSchool: false,
        majorId: selectedMajor?.value,
        status: selectedStatus?.value,
      }),
    keepPreviousData: true,
  });

  const closeDeleteModal = () =>
    setDeleteModalState({ isOpen: false, post: null });
  const closePreviewModal = () =>
    setPreviewModalState({ isOpen: false, post: null });
  const closeApproveModal = () =>
    setApproveModalState({ isOpen: false, post: null });

  const toggleStatusMutation = useMutation({
    mutationFn: (post: Post) =>
      axiosConfig.patch(`/api/posts/${post.id}/status`, {
        status: post.status === "verified" ? "pending" : "verified",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      closeApproveModal();
    },
  });

  const handleToggleStatus = (post: Post) => {
    setApproveModalState({ isOpen: true, post });
  };

  const handleConfirmApprove = () => {
    if (!approveModalState.post) return;
    toggleStatusMutation.mutate(approveModalState.post);
  };

  const deletePostMutation = useMutation({
    mutationFn: (id: string) => axiosConfig.delete(`/api/posts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      closeDeleteModal();
    },
  });

  const handleConfirmDelete = () => {
    if (!deleteModalState.post) return;
    deletePostMutation.mutate(deleteModalState.post.id);
  };

  const handlePreviewClick = (post: Post) => {
    setPreviewModalState({ isOpen: true, post });
  };

  if (isLoading) return <div className="p-4">Đang tải...</div>;
  if (isError)
    return (
      <div className="p-4 text-red-500">Lỗi khi tải danh sách bài viết</div>
    );

  const { posts, currentPage, totalPages } = data;

  const statusOptions: Status[] = [
    { value: "", label: "Tất cả" },
    { value: "pending", label: "Chờ duyệt" },
    { value: "verified", label: "Đã duyệt" },
  ];

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen text-[#344054] dark:text-[#D0D5DD]">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <h1 className="text-xl font-bold">Quản lý bài viết tư vấn/ hỏi đáp</h1>
        <button
          onClick={() => {
            setSearch("");
            setDebouncedSearch("");
            setSelectedMajor(null);
            setSelectedStatus(null);
            setPage(1);
            refetch();
          }}
          className="flex items-center gap-2 px-3 py-2 bg-[#083970] hover:bg-opacity-90 text-white rounded"
        >
          <MdRefresh /> Làm mới
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Tìm theo tiêu đề..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
          className="px-3 py-2 border bg-white focus:outline-[#083970]  rounded w-full sm:w-1/3 dark:bg-gray-800 dark:border-gray-700"
        />
        <div className="w-full sm:w-1/3">
          <Select
            options={majorsData || []}
            styles={customStyles}
            value={selectedMajor}
            onChange={(opt) => {
              setSelectedMajor(opt);
              setPage(1);
            }}
            placeholder="Chọn ngành..."
            isClearable
          />
        </div>
        <div className="w-full sm:w-1/3">
          <Select
            options={statusOptions}
            styles={customStyles}
            value={selectedStatus}
            onChange={(opt) => {
              setSelectedStatus(opt);
              setPage(1);
            }}
            placeholder="Chọn trạng thái..."
            isClearable
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-200 dark:border-gray-700 rounded">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Ảnh</th>
              <th className="px-3 py-2 text-left font-semibold">Tiêu đề</th>
              <th className="px-3 py-2 text-left font-semibold">Tác giả</th>
              <th className="px-3 py-2 text-left font-semibold">Role</th>
              <th className="px-3 py-2 text-center font-semibold">Ngành</th>
              <th className="px-3 py-2 text-center font-semibold">
                Trạng thái
              </th>
              <th className="px-3 py-2 text-center font-semibold">Ngày tạo</th>
              <th className="px-3 py-2 text-center font-semibold">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {posts &&
              posts.map((p: Post) => (
                <tr
                  key={p.id}
                  className="border-t border-gray-200 dark:border-gray-700"
                >
                  <td className="px-3 py-2">
                    {p.images[0] ? (
                      <img
                        src={p.images[0]?.url}
                        alt={p.title}
                        className="w-32 object-cover rounded"
                      />
                    ) : (
                      <span className="text-gray-400 italic">No Image</span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-medium">{p.title}</td>
                  <td className="px-3 py-2">{p.author?.name || "N/A"}</td>
                  <td className="px-3 py-2">{p.author?.role || "N/A"}</td>
                  <td className="px-3 py-2 text-center">
                    {p.major?.name || "-"}
                  </td>
                  <td className="px-3 py-2 text-center text-sm">
                    {p.status === "pending" ? "Chờ duyệt" : "Đã duyệt"}
                  </td>
                  <td className="px-3 py-2 text-center text-sm">
                    {new Date(p.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => handlePreviewClick(p)}
                        className="p-2 bg-slate-400 hover:bg-gray-600 text-white rounded"
                        title="Xem trước"
                      >
                        <FaEye />
                      </button>

                      {p.status === "pending" ? (
                        <button
                          onClick={() => handleToggleStatus(p)}
                          className="p-2 bg-[#083970] text-white rounded"
                          title="Duyệt bài viết"
                        >
                          <FaCheck />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleStatus(p)}
                          className="p-2 bg-yellow-600 text-white rounded"
                          title="Chuyển về chờ duyệt"
                        >
                          <FaUndo />
                        </button>
                      )}

                      <button
                        onClick={() =>
                          setDeleteModalState({ isOpen: true, post: p })
                        }
                        className="p-2 bg-[#be202e] hover:bg-red-700 text-white rounded"
                        title="Xóa vĩnh viễn"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {posts && posts.length === 0 ? (
        <div className="p-4 text-center">Không có bài viết nào.</div>
      ) : (
        <div className="flex justify-center items-center gap-4 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Trước
          </button>
          <span>
            Trang {currentPage}/{totalPages}
          </span>
          <button
            onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        variant="warning"
        title="Xóa vĩnh viễn bài viết?"
        message={
          <span>
            Bạn có chắc chắn muốn xóa bài viết{" "}
            <strong>{deleteModalState.post?.title}</strong>?<br />
            <span className="text-red-600 dark:text-red-400">
              Hành động này không thể hoàn tác.
            </span>
          </span>
        }
        confirmText="Xóa"
        isConfirming={deletePostMutation.isPending}
      />

      {/* Confirm Approve / Unapprove Modal */}
      <ConfirmModal
        isOpen={approveModalState.isOpen}
        onClose={closeApproveModal}
        onConfirm={handleConfirmApprove}
        variant="info"
        title={
          approveModalState.post?.status === "pending"
            ? "Duyệt bài viết?"
            : "Chuyển về chờ duyệt?"
        }
        message={
          <span>
            Bạn có chắc chắn muốn{" "}
            {approveModalState.post?.status === "pending"
              ? "duyệt"
              : "chuyển về chờ duyệt"}{" "}
            bài viết <strong>{approveModalState.post?.title}</strong>?
          </span>
        }
        confirmText="Xác nhận"
        isConfirming={toggleStatusMutation.isPending}
      />

      {/* Preview Modal */}
      <PostPreviewModal
        isOpen={previewModalState.isOpen}
        onClose={closePreviewModal}
        title={previewModalState.post?.title || ""}
        isFromSchool={false}
        content={previewModalState.post?.content || ""}
        thumbnailPreview={previewModalState.post?.images[0]?.url || null}
      />
    </div>
  );
}
