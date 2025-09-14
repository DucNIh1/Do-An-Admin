import React, { useEffect } from "react";
import { IoClose, IoEye, IoCalendar, IoStar } from "react-icons/io5";
import { MdFeaturedVideo } from "react-icons/md";

interface PostPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  teaser?: string;
  content: string;
  isFromSchool?: boolean;
  isFeatured?: boolean;
  thumbnailPreview?: string | null;
}

const PostPreviewModal: React.FC<PostPreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  teaser,
  content,
  isFromSchool = false,
  isFeatured,
  thumbnailPreview,
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  const currentDate = new Date().toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      className="fixed inset-0 z-99999 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-4xl h-full max-h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <IoEye className="h-5 w-5 text-[#083970]" />
            <h3 className="text-lg font-semibold text-gray-800">
              Xem trước bài viết
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
            title="Đóng (ESC)"
          >
            <IoClose className="h-5 w-5 text-gray-500 group-hover:text-gray-700" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-full pb-40 ">
          <article className="max-w-3xl mx-auto p-6">
            {/* Featured Badge */}
            {isFeatured && (
              <div className="flex items-center gap-2 mb-6">
                <IoStar className="h-5 w-5 text-yellow-500" />
                <span className="text-sm font-medium text-yellow-700 bg-yellow-100 px-3 py-1 rounded-full flex items-center gap-1">
                  <MdFeaturedVideo className="h-4 w-4" />
                  Bài viết nổi bật
                </span>
              </div>
            )}

            {/* Thumbnail */}
            {thumbnailPreview && (
              <div className="mb-6">
                <img
                  src={thumbnailPreview}
                  alt="Thumbnail preview"
                  className="w-full h-64 object-cover rounded-lg shadow-md"
                />
              </div>
            )}

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
              {title || (
                <span className="text-gray-400 italic">
                  Nhập tiêu đề để xem preview...
                </span>
              )}
            </h1>

            {/* Meta info */}
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-6 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-1">
                <IoCalendar className="h-4 w-4" />
                <span>{currentDate}</span>
              </div>

              <span>•</span>
              <span>
                {isFromSchool
                  ? "Bài viết từ trường"
                  : "Bài viết tư vấn/ hỏi đáp"}{" "}
              </span>
              {isFeatured && (
                <>
                  <span>•</span>
                  <span className="text-yellow-600 font-medium">Nổi bật</span>
                </>
              )}
            </div>

            {/* Teaser */}
            {teaser && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border-l-4 border-[#083970]">
                <p className="text-gray-700 italic text-lg leading-relaxed">
                  {teaser}
                </p>
              </div>
            )}

            {/* Content */}
            <div className="prose max-w-none">
              {content ? (
                <div
                  className="ql-editor border-0 p-0"
                  style={{ fontSize: "16px", lineHeight: "1.6" }}
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              ) : (
                <p className="text-gray-400 italic text-center py-8">
                  Nhập nội dung bài viết để xem preview...
                </p>
              )}
            </div>

            {/* Empty state when no content */}
            {!title && !teaser && !content && !thumbnailPreview && (
              <div className="text-center py-12">
                <IoEye className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">
                  Chưa có nội dung để xem trước
                </p>
                <p className="text-gray-300 text-sm mt-2">
                  Hãy nhập tiêu đề và nội dung bài viết
                </p>
              </div>
            )}
          </article>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostPreviewModal;
