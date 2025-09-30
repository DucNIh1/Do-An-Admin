import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import axiosConfig from "../../../axios/config";
import { MdRefresh } from "react-icons/md";
import ConfirmModal from "../../common/ConfirmModal";
import Select from "react-select";
import useDebounce from "../../../hooks/useDebounce";
import { FaTrash } from "react-icons/fa";

type ConsultationRequest = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  status: "PENDING" | "IN_PROGRESS" | "DONE" | "REJECTED";
  major: { id: string; name: string } | null;
  createdAt: string;
};

const statusOptions = [
  { value: "", label: "Tất cả" },
  { value: "PENDING", label: "Chờ xử lý" },
  { value: "IN_PROGRESS", label: "Đang xử lý" },
  { value: "DONE", label: "Hoàn thành" },
  { value: "REJECTED", label: "Từ chối" },
];

export default function ConsultationRequestsTable() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const limit = 10;

  const [filterEmail, setFilterEmail] = useState("");
  const [filterMajor, setFilterMajor] = useState<any>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState("");
  const debouncedSearch = useDebounce(filterEmail, 500);

  // modal trạng thái
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    request: ConsultationRequest | null;
    nextStatus: ConsultationRequest["status"] | null;
  }>({
    isOpen: false,
    request: null,
    nextStatus: null,
  });

  // modal xoá
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    request: ConsultationRequest | null;
  }>({
    isOpen: false,
    request: null,
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [
      "consultationRequests",
      page,
      debouncedSearch,
      filterMajor,
      sortOrder,
      statusFilter,
    ],
    queryFn: async () => {
      const res = await axiosConfig.get("/api/consultation-requests", {
        params: {
          page,
          limit,
          search: debouncedSearch || "",
          majorId: filterMajor ? filterMajor?.value : "",
          sort: sortOrder,
          status: statusFilter,
        },
      });
      return res.data;
    },
    keepPreviousData: true,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: ConsultationRequest["status"];
    }) =>
      axiosConfig.patch(`/api/consultation-requests/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultationRequests"] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      axiosConfig.delete(`/api/consultation-requests/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultationRequests"] });
      setDeleteModal({ isOpen: false, request: null });
    },
  });

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

  const closeModal = () =>
    setModalState({ isOpen: false, request: null, nextStatus: null });

  const handleConfirm = () => {
    if (!modalState.request || !modalState.nextStatus) return;
    updateStatusMutation.mutate({
      id: modalState.request.id,
      status: modalState.nextStatus,
    });
  };

  if (isLoading) return <div className="p-4">Đang tải...</div>;
  if (isError)
    return <div className="p-4 text-red-500">Lỗi khi tải dữ liệu</div>;

  const { requests, currentPage, totalPage } = data;

  const statusLabels: Record<ConsultationRequest["status"], string> = {
    PENDING: "Chờ xử lý",
    IN_PROGRESS: "Đang xử lý",
    DONE: "Hoàn thành",
    REJECTED: "Từ chối",
  };

  const statusColors: Record<ConsultationRequest["status"], string> = {
    PENDING: "bg-yellow-200 text-yellow-800",
    IN_PROGRESS: "bg-blue-200 text-blue-800",
    DONE: "bg-green-200 text-green-800",
    REJECTED: "bg-red-200 text-red-800",
  };

  const customStyles = {
    control: (provided: any) => ({
      ...provided,
      minHeight: "40px",
      height: "42px",
    }),
    valueContainer: (provided: any) => ({
      ...provided,
      height: "42px",
      padding: "0 8px",
    }),
    input: (provided: any) => ({
      ...provided,
      margin: 0,
      padding: 0,
    }),
    indicatorsContainer: (provided: any) => ({
      ...provided,
      height: "42px",
    }),
  };

  const modalContent = modalState.nextStatus
    ? {
        variant: "notice" as const,
        title: "Thay đổi trạng thái?",
        message: (
          <span>
            Bạn có chắc chắn muốn đổi trạng thái của yêu cầu{" "}
            <strong>{modalState.request?.fullName}</strong> thành{" "}
            <strong>{statusLabels[modalState.nextStatus]}</strong>?
          </span>
        ),
        confirmText: "Xác nhận",
      }
    : null;

  const deleteModalContent = deleteModal.request
    ? {
        variant: "danger" as const,
        title: "Xoá yêu cầu?",
        message: (
          <span>
            Bạn có chắc chắn muốn xoá yêu cầu tư vấn của{" "}
            <strong>{deleteModal.request.fullName}</strong>?
          </span>
        ),
        confirmText: "Xoá",
      }
    : null;

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen text-[#344054] dark:text-[#D0D5DD]">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <h1 className="text-xl font-bold">Quản lý yêu cầu tư vấn</h1>
        <button
          onClick={() => {
            setPage(1);
            refetch();
            setFilterEmail("");
            setFilterMajor("");
            setStatusFilter("");
            setSortOrder("desc");
          }}
          className="flex items-center gap-2 px-3 py-2 bg-[#083970] hover:bg-opacity-90 text-white rounded"
        >
          <MdRefresh /> Làm mới
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Lọc theo email..."
          value={filterEmail}
          onChange={(e) => {
            setPage(1);
            setFilterEmail(e.target.value);
          }}
          className="px-3 py-2 border rounded w-full sm:w-1/3 dark:bg-gray-800 dark:border-gray-700"
        />

        <div className="w-full sm:w-1/4">
          <Select
            styles={customStyles}
            options={majorsData || []}
            value={filterMajor}
            onChange={(opt: any) => {
              setFilterMajor(opt);
              setPage(1);
            }}
            placeholder="Chọn ngành..."
            isClearable
          />
        </div>

        <select
          value={sortOrder}
          onChange={(e) => {
            setPage(1);
            setSortOrder(e.target.value as "asc" | "desc");
          }}
          className="px-3 py-2 border rounded w-full sm:w-1/4 dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="desc">Mới nhất</option>
          <option value="asc">Cũ nhất</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value);
          }}
          className="px-3 py-2 border rounded text-sm dark:bg-gray-800 dark:border-gray-700"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border border-gray-200 dark:border-gray-700 rounded">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Tên</th>
              <th className="px-3 py-2 text-left font-semibold">Email</th>
              <th className="px-3 py-2 text-left font-semibold">SĐT</th>
              <th className="px-3 py-2 text-left font-semibold">Ngành</th>
              <th className="px-3 py-2 text-center font-semibold">
                Trạng thái
              </th>
              <th className="px-3 py-2 text-center font-semibold">Ngày tạo</th>
              <th className="px-3 py-2 text-center font-semibold">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r: ConsultationRequest) => (
              <tr
                key={r.id}
                className="border-t border-gray-200 dark:border-gray-700"
              >
                <td className="px-3 py-2">{r.fullName}</td>
                <td className="px-3 py-2">{r.email}</td>
                <td className="px-3 py-2">{r.phoneNumber}</td>
                <td className="px-3 py-2">{r.major?.name || "-"}</td>
                <td className="px-3 py-2 text-center">
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      statusColors[r.status]
                    }`}
                  >
                    {statusLabels[r.status]}
                  </span>
                </td>
                <td className="px-3 py-2 text-center">
                  {new Date(r.createdAt).toLocaleString("vi-VN")}
                </td>
                <td className="px-3 py-2 text-center flex gap-2 justify-center">
                  <select
                    value=""
                    onChange={(e) =>
                      setModalState({
                        isOpen: true,
                        request: r,
                        nextStatus: e.target
                          .value as ConsultationRequest["status"],
                      })
                    }
                    className="px-2 py-1 border rounded text-sm dark:bg-gray-800 dark:border-gray-700"
                  >
                    <option value="">Đổi trạng thái...</option>
                    {Object.entries(statusLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setDeleteModal({ isOpen: true, request: r })}
                    className="p-2 bg-[#be202e] hover:bg-red-700 text-white rounded"
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

      {requests.length === 0 ? (
        <div className="p-4 text-center">Không có yêu cầu nào.</div>
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
            Trang {currentPage}/{totalPage}
          </span>
          <button
            onClick={() => setPage((p) => (p < totalPage ? p + 1 : p))}
            disabled={currentPage === totalPage}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      )}

      {/* Modal đổi trạng thái */}
      {modalContent && (
        <ConfirmModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          onConfirm={handleConfirm}
          variant={modalContent.variant}
          title={modalContent.title}
          message={modalContent.message}
          confirmText={modalContent.confirmText}
          isConfirming={updateStatusMutation.isPending}
        />
      )}

      {deleteModalContent && (
        <ConfirmModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, request: null })}
          onConfirm={() =>
            deleteMutation.mutate(deleteModal.request?.id as string)
          }
          variant={"warning"}
          title={deleteModalContent.title}
          message={deleteModalContent.message}
          confirmText={deleteModalContent.confirmText}
          isConfirming={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
