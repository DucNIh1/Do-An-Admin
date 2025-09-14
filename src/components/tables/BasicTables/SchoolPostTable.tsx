import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { FaTrash, FaEye } from "react-icons/fa";
import { MdRefresh } from "react-icons/md";
import axiosConfig from "../../../axios/config";
import ConfirmModal from "../../common/ConfirmModal";
import PostPreviewModal from "../../posts/PostPreviewModal";
import { getPostsAPI } from "../../../service/postService";
import { CiEdit } from "react-icons/ci";
import EditPostModal from "../../posts/EditPostModal";
type Post = {
  id: string;
  title: string;
  teaser: string;
  content: string;
  thumbnail?: string;
  isFeatured: boolean;
  deletedAt: string | null;
  createdAt: string;
  images: any[];
};

export default function SchoolPostsTable() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [editModalState, setEditModalState] = useState<{
    isOpen: boolean;
    post: Post | null;
  }>({
    isOpen: false,
    post: null,
  });
  const closeEditModal = () => setEditModalState({ isOpen: false, post: null });
  const [status, setStatus] = useState("");
  const limit = 5;

  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    post: Post | null;
  }>({
    isOpen: false,
    post: null,
  });

  const [previewModalState, setPreviewModalState] = useState<{
    isOpen: boolean;
    post: Post | null;
  }>({
    isOpen: false,
    post: null,
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["posts", page, debouncedSearch, status],
    queryFn: async () =>
      await getPostsAPI({
        page,
        limit,
        title: debouncedSearch,
        isFromSchool: true,
        isFeatured: status || undefined,
      }),
    keepPreviousData: true,
  });
  console.log(data);
  const closeDeleteModal = () =>
    setDeleteModalState({ isOpen: false, post: null });
  const closePreviewModal = () =>
    setPreviewModalState({ isOpen: false, post: null });

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

  const handleDeleteClick = (post: Post) => {
    setDeleteModalState({ isOpen: true, post });
  };

  if (isLoading) return <div className="p-4">Đang tải...</div>;
  if (isError)
    return (
      <div className="p-4 text-red-500">Lỗi khi tải danh sách bài viết</div>
    );

  const { posts, currentPage, totalPages } = data;

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen text-[#344054] dark:text-[#D0D5DD]">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <h1 className="text-xl font-bold">Quản lý bài viết</h1>
        <button
          onClick={() => {
            setSearch("");
            setDebouncedSearch("");
            setStatus("");
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
          className="px-3 py-2 border rounded w-full sm:w-1/3 dark:bg-gray-800 dark:border-gray-700"
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border rounded w-full sm:w-1/4 dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="">Tất cả bài viết</option>
          <option value="true">Nổi bật</option>
          <option value="false">Bình thường</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full overflow-x-scroll border border-gray-200 dark:border-gray-700 rounded">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="px-3 py-2 text-left font-semibold min-w-[132px]">
                Ảnh
              </th>
              <th className="px-3 py-2 text-left font-semibold min-w-[250px]">
                Tiêu đề
              </th>
              <th className="px-3 py-2 text-left font-semibold">Teaser</th>
              <th className="px-3 py-2 text-center font-semibold">Featured</th>
              <th className="px-3 py-2 text-center font-semibold">Ngày tạo</th>
              <th className="px-3 py-2 text-center font-semibold">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {posts &&
              posts?.map((p: Post) => (
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
                  <td className="px-3 py-2 text-gray-600 text-sm max-w-xs truncate">
                    {p.teaser}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {p.isFeatured ? (
                      <span className="px-2 py-1 text-xs bg-yellow-200 text-yellow-800 rounded">
                        Featured
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs bg-gray-200 text-gray-800 rounded">
                        Normal
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center text-sm">
                    {new Date(p.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-3 py-2 flex gap-2 justify-center">
                    <button
                      onClick={() => handlePreviewClick(p)}
                      className="p-2 bg-slate-400 text-white rounded transition-colors"
                      title="Xem trước bài viết"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() =>
                        setEditModalState({ isOpen: true, post: p })
                      }
                      className="p-2 bg-[#083970] text-white rounded transition-colors"
                      title="Xem trước bài viết"
                    >
                      <CiEdit />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(p)}
                      className="p-2 bg-[#be202e] text-white rounded hover:bg-red-700 transition-colors"
                      title="Xóa vĩnh viễn"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

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

      {/* Delete Confirmation Modal */}
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
      {/* Edit Modal */}
      <EditPostModal
        isOpen={editModalState.isOpen}
        onClose={closeEditModal}
        post={editModalState.post}
      />
      {/* Preview Modal */}
      <PostPreviewModal
        isOpen={previewModalState.isOpen}
        onClose={closePreviewModal}
        title={previewModalState.post?.title || ""}
        teaser={previewModalState.post?.teaser || ""}
        isFromSchool={true}
        content={previewModalState.post?.content || ""}
        isFeatured={previewModalState.post?.isFeatured || false}
        thumbnailPreview={previewModalState.post?.images[0]?.url || null}
      />
    </div>
  );
}
