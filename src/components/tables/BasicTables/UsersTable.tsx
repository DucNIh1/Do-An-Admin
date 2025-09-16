import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useContext } from "react";
import { FaTrash, FaUserSlash, FaUserCheck } from "react-icons/fa";
import { MdRefresh } from "react-icons/md";
import axiosConfig from "../../../axios/config";
import UserAvatar from "../../common/UserAvatar";
import ConfirmModal from "../../common/ConfirmModal";
import { CiEdit } from "react-icons/ci";
import Select from "react-select";
import customStyles from "../../../utils/SelectCustomStyles";
import { AuthContext } from "../../../context/AuthContext";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  isActive: boolean;
  deletedAt: string | null;
  createdAt: string;
};

export default function UsersTable() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useContext(AuthContext);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const limit = 10;
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedMajor, setSelectedMajor] = useState<{
    value: string;
    label: string;
  } | null>(null);

  const { data: majors } = useQuery({
    queryKey: ["majors"],
    queryFn: async () => {
      const res = await axiosConfig.get("/api/majors");
      return res.data.majors;
    },
  });

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    user: User | null;
    action: "deactivate" | "delete" | "activate" | "edit" | null;
  }>({
    isOpen: false,
    user: null,
    action: null,
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    if (modalState.action === "edit" && modalState.user) {
      setSelectedRole(modalState.user.role);
      setSelectedMajor(modalState.user.majorId || "");
      if (modalState.user.major) {
        const found = majors.find((m) => m.id === modalState.user.major.id);
        setSelectedMajor(found ? { value: found.id, label: found.name } : null);
      } else {
        setSelectedMajor(null);
      }
    }
  }, [modalState, majors]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["users", page, debouncedSearch, role, status],
    queryFn: async () => {
      const res = await axiosConfig.get("/api/users", {
        params: {
          page,
          limit,
          search: debouncedSearch,
          role: role || undefined,
          isActive: status || undefined,
        },
      });
      return res.data;
    },
    keepPreviousData: true,
  });

  const softDeleteMutation = useMutation({
    mutationFn: (id: string) =>
      axiosConfig.patch(`/api/users/${id}/soft-delete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      closeModal();
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { role: string; majorId?: string };
    }) => axiosConfig.patch(`/api/users/${id}/role`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      closeModal();
    },
  });

  const restoreUserMutation = useMutation({
    mutationFn: (id: string) => axiosConfig.patch(`/api/users/${id}/restore`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      closeModal();
    },
  });

  const hardDeleteMutation = useMutation({
    mutationFn: (id: string) => axiosConfig.delete(`/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      closeModal();
    },
  });

  const handleConfirm = () => {
    if (!modalState.user) return;
    switch (modalState.action) {
      case "deactivate":
        softDeleteMutation.mutate(modalState.user.id);
        break;
      case "activate":
        restoreUserMutation.mutate(modalState.user.id);
        break;
      case "delete":
        hardDeleteMutation.mutate(modalState.user.id);
        break;
    }
  };

  const closeModal = () =>
    setModalState({ isOpen: false, user: null, action: null });
  if (isLoading) return <div className="p-4">Đang tải...</div>;
  if (isError)
    return <div className="p-4 text-red-500">Lỗi khi tải dữ liệu</div>;

  const { results: users, currentPage, totalPages } = data;

  const getModalContent = () => {
    if (!modalState.action) return {};
    switch (modalState.action) {
      case "deactivate":
        return {
          variant: "notice",
          title: "Vô hiệu hóa người dùng?",
          message: "Bạn có chắc chắn muốn vô hiệu hóa người dùng",
          confirmText: "Vô hiệu hóa",
        };
      case "activate":
        return {
          variant: "notice",
          title: "Kích hoạt người dùng?",
          message: "Bạn có chắc chắn muốn kích hoạt lại người dùng",
          confirmText: "Kích hoạt",
        };
      case "delete":
        return {
          variant: "warning",
          title: "Xóa vĩnh viễn người dùng?",
          message: "Bạn có chắc chắn muốn xóa vĩnh viễn người dùng",
          confirmText: "Xóa vĩnh viễn",
        };
      default:
        return {};
    }
  };
  const modalContent = getModalContent();

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen text-[#344054] dark:text-[#D0D5DD]">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <h1 className="text-xl font-bold">Quản lý người dùng</h1>
        <button
          onClick={() => {
            setSearch("");
            setDebouncedSearch("");
            setRole("");
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
          placeholder="Tìm theo tên hoặc email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
          className="px-3 py-2 border rounded w-full sm:w-1/3 dark:bg-gray-800 dark:border-gray-700"
        />
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border rounded w-full sm:w-1/4 dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="">Tất cả quyền</option>
          <option value="ADMIN">Admin</option>
          <option value="STUDENT">Học sinh</option>
          <option value="ADVISOR">Tư vấn viên</option>
        </select>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border rounded w-full sm:w-1/4 dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-200 dark:border-gray-700 rounded">
          <thead className="bg-gray-100 dark:bg-gray-800 ">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Tên</th>
              <th className="px-3 py-2 text-left font-semibold">Avatar</th>
              <th className="px-3 py-2 text-left font-semibold">Email</th>
              <th className="px-3 py-2 text-center font-semibold">Role</th>
              <th className="px-3 py-2 text-center font-semibold">
                Trạng thái
              </th>
              <th className="px-3 py-2 text-center font-semibold">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u: User) => (
              <tr
                key={u.id}
                className={`border-t border-gray-200 dark:border-gray-700 ${
                  u.id === currentUser.id
                    ? "bg-slate-200 cursor-not-allowed"
                    : ""
                }`}
              >
                <td className="px-3 py-2">{u.name}</td>
                <td className="px-3 py-2">
                  <UserAvatar name={u.name} src={u.avatar} />
                </td>
                <td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2 text-center">{u.role}</td>
                <td className="px-3 py-2 text-center">
                  {u.isActive ? (
                    <span className="px-2 py-1 text-xs bg-green-200 text-green-800 dark:bg-green-700 dark:text-green-100 rounded">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs bg-red-200 text-red-800 dark:bg-red-700 dark:text-red-100 rounded">
                      Inactive
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 flex gap-2 justify-center">
                  {u.isActive ? (
                    <button
                      onClick={() =>
                        setModalState({
                          isOpen: true,
                          user: u,
                          action: "deactivate",
                        })
                      }
                      disabled={u.id === currentUser.id}
                      className={`p-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors ${
                        u.id === currentUser.id ? "cursor-not-allowed" : ""
                      }`}
                      title="Vô hiệu hóa"
                    >
                      <FaUserSlash />
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        setModalState({
                          isOpen: true,
                          user: u,
                          action: "activate",
                        })
                      }
                      disabled={u.id === currentUser.id}
                      className={`p-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors ${
                        u.id === currentUser.id ? "cursor-not-allowed" : ""
                      } `}
                      title="Kích hoạt lại"
                    >
                      <FaUserCheck />
                    </button>
                  )}

                  <button
                    disabled={u.id === currentUser.id}
                    onClick={() =>
                      setModalState({
                        isOpen: true,
                        user: u,
                        action: "edit",
                      })
                    }
                    className={`p-2 bg-[#083970] text-white rounded transition-colors ${
                      u.id === currentUser.id ? "cursor-not-allowed" : ""
                    }`}
                    title="Cập nhật thông tin người dùng"
                  >
                    <CiEdit />
                  </button>
                  <button
                    disabled={u.id === currentUser.id}
                    onClick={() =>
                      setModalState({ isOpen: true, user: u, action: "delete" })
                    }
                    className={`p-2 bg-[#be202e] text-white rounded hover:bg-red-700 transition-colors ${
                      u.id === currentUser.id ? "cursor-not-allowed" : ""
                    }`}
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

      {users.length === 0 ? (
        <div className="p-4 text-center">Không có người dùng nào.</div>
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

      <ConfirmModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={handleConfirm}
        variant={modalContent.variant as "warning" | "notice"}
        title={modalContent.title}
        message={
          <span>
            {modalContent.message} <strong>{modalState.user?.name}</strong>?
            {modalState.action === "delete" && (
              <p className="mt-2 text-red-600 dark:text-red-400">
                Hành động này không thể hoàn tác.
              </p>
            )}
          </span>
        }
        confirmText={modalContent.confirmText}
        isConfirming={
          softDeleteMutation.isPending ||
          hardDeleteMutation.isPending ||
          restoreUserMutation.isPending
        }
      />

      {modalState.action === "edit" && modalState.user && (
        <ConfirmModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          onConfirm={() => {
            if (selectedRole === "ADVISOR" && !selectedMajor) {
              alert("Tư vấn viên bắt buộc phải có ngành!");
              return;
            }
            updateUserMutation.mutate({
              id: modalState.user.id,
              data: {
                role: selectedRole,
                majorId:
                  selectedRole === "ADVISOR" ? selectedMajor.value : undefined,
              },
            });
          }}
          title="Chỉnh sửa người dùng"
          confirmText="Lưu"
          variant="notice"
          message={
            <div className="flex flex-col gap-3">
              <label className="flex flex-col">
                <span className="mb-1 font-medium">Chọn role</span>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="STUDENT">Học sinh</option>
                  <option value="ADVISOR">Tư vấn viên</option>
                </select>
              </label>

              {selectedRole === "ADVISOR" && (
                <label className="flex flex-col">
                  <Select
                    options={majors?.map((m) => ({
                      value: m.id,
                      label: m.name,
                    }))}
                    value={selectedMajor}
                    onChange={(option) => setSelectedMajor(option)}
                    placeholder="Chọn ngành..."
                    isClearable
                    className="text-black dark:text-white"
                    styles={customStyles}
                  />
                </label>
              )}
            </div>
          }
          isConfirming={updateUserMutation.isPending}
        />
      )}
    </div>
  );
}
