import React, { useMemo, useState, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { updatePostAPI, uploadImagesAPI } from "../../service/postService";
import { toast } from "react-toastify";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import DropzoneComponent from "../form/form-elements/DropZone";
import { IoClose, IoSave } from "react-icons/io5";
import { FaEdit } from "react-icons/fa";

type Post = {
  id: string;
  title: string;
  teaser: string;
  content: string;
  isFeatured: boolean;
  images: any[];
};

type FormValues = {
  title: string;
  teaser: string;
  content: string;
  isFeatured: boolean;
  thumbnail: File | null;
};

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post | null;
}

const schema = yup.object({
  title: yup.string().required("Tiêu đề không được để trống"),
  teaser: yup
    .string()
    .required("Teaser không được để trống")
    .max(250, "Teaser tối đa 250 ký tự"),
  content: yup.string().required("Nội dung không được để trống"),
  isFeatured: yup.boolean(),
  thumbnail: yup
    .mixed<File>()
    .nullable()
    .test("fileType", "Chỉ chấp nhận file ảnh", (value) => {
      if (!value) return true;
      return [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/svg+xml",
      ].includes(value.type);
    })
    .test("fileSize", "File không được vượt quá 5MB", (value) => {
      if (!value) return true;
      return value.size <= 5 * 1024 * 1024;
    }),
});

const EditPostModal: React.FC<EditPostModalProps> = ({
  isOpen,
  onClose,
  post,
}) => {
  const queryClient = useQueryClient();
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    clearErrors,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      title: "",
      teaser: "",
      content: "",
      isFeatured: false,
      thumbnail: null,
    },
  });

  useEffect(() => {
    if (isOpen && post) {
      reset({
        title: post.title,
        teaser: post.teaser,
        content: post.content,
        isFeatured: post.isFeatured,
        thumbnail: null,
      });

      if (post.images && post.images[0]) {
        setThumbnailPreview(post.images[0].url);
      } else {
        setThumbnailPreview(null);
      }
    }
  }, [isOpen, post, reset]);

  useEffect(() => {
    if (!isOpen) {
      reset();
      if (thumbnailPreview && thumbnailPreview.startsWith("blob:")) {
        URL.revokeObjectURL(thumbnailPreview);
      }
      setThumbnailPreview(null);
    }
  }, [isOpen, reset]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const imageHandler = async () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        try {
          const base64String = await fileToBase64(file);
          const quill = document.querySelector(".ql-editor");
          if (quill) {
            const range = window.getSelection()?.getRangeAt(0);
            if (range) {
              const img = document.createElement("img");
              img.src = base64String;
              img.style.maxWidth = "100%";
              range.insertNode(img);
            }
          }
        } catch (error) {
          console.error("Error converting image to base64:", error);
          toast.error("Lỗi khi tải ảnh lên");
        }
      }
    };
  };

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          [{ font: [] }],
          [{ size: ["small", false, "large", "huge"] }],
          ["bold", "italic", "underline", "strike"],
          ["blockquote", "code-block"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ script: "sub" }, { script: "super" }],
          [{ indent: "-1" }, { indent: "+1" }],
          [{ direction: "rtl" }],
          [{ color: [] }, { background: [] }],
          [{ align: [] }],
          ["link", "image", "video"],
          ["clean"],
        ],
        handlers: {
          image: imageHandler,
        },
      },
    }),
    []
  );

  const handleThumbnailSelect = (file: File | null) => {
    setValue("thumbnail", file);
    if (file) {
      clearErrors("thumbnail");
      if (thumbnailPreview && thumbnailPreview.startsWith("blob:")) {
        URL.revokeObjectURL(thumbnailPreview);
      }
      const previewUrl = URL.createObjectURL(file);
      setThumbnailPreview(previewUrl);
    }
  };

  const updatePostMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!post) throw new Error("Không tìm thấy bài viết!");

      const updatedPost = await updatePostAPI(post.id, {
        title: data.title,
        teaser: data.teaser,
        content: data.content,
        isFeatured: data.isFeatured,
      });

      if (data.thumbnail) {
        const formData = new FormData();
        formData.append("file", data.thumbnail);

        try {
          await uploadImagesAPI(formData, { folder: "posts", postId: post.id });
        } catch (error) {
          throw new Error("Không thể tải ảnh thumbnail mới.");
        }
      }

      return updatedPost;
    },
    onSuccess: () => {
      toast.success("Cập nhật bài viết thành công!");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || "Có lỗi xảy ra, vui lòng thử lại!");
    },
  });

  const onSubmit = (data: FormValues) => {
    updatePostMutation.mutate(data);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-99999 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-4xl h-full max-h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <FaEdit className="h-5 w-5 text-[#083970]" />
            <h3 className="text-lg font-semibold text-gray-800">
              Chỉnh sửa bài viết
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

        <div className="overflow-y-auto h-full pb-50">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Tiêu đề bài viết *
              </label>
              <input
                {...register("title")}
                placeholder="Tiêu đề bài viết..."
                className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Teaser / Mô tả ngắn *
              </label>
              <textarea
                {...register("teaser")}
                placeholder="Teaser / mô tả ngắn..."
                className="w-full p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              {errors.teaser && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.teaser.message}
                </p>
              )}
            </div>

            {thumbnailPreview && (
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Ảnh thumbnail hiện tại
                </label>
                <img
                  src={thumbnailPreview}
                  alt="Current thumbnail"
                  className="w-32 h-32 object-cover rounded-md border"
                />
              </div>
            )}

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Thay đổi ảnh thumbnail (tùy chọn)
              </label>
              <DropzoneComponent onFileSelect={handleThumbnailSelect} />
              {errors.thumbnail && (
                <p className="text-red-500 text-sm mt-2">
                  {errors.thumbnail.message}
                </p>
              )}
            </div>

            {/* isFeatured Checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isFeatured-edit"
                {...register("isFeatured")}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="isFeatured-edit" className="text-gray-700">
                Đặt làm bài viết nổi bật
              </label>
            </div>

            {/* ReactQuill */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Nội dung bài viết *
              </label>
              <Controller
                name="content"
                control={control}
                render={({ field }) => (
                  <ReactQuill
                    theme="snow"
                    value={field.value}
                    onChange={field.onChange}
                    modules={modules}
                    placeholder="Nội dung bài viết..."
                    className="bg-white"
                    style={{ minHeight: "300px" }}
                  />
                )}
              />
              {errors.content && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.content.message}
                </p>
              )}
            </div>
          </form>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              onClick={handleSubmit(onSubmit)}
              disabled={updatePostMutation.isPending}
              className="flex items-center gap-2 px-6 py-2 bg-[#083970] text-white rounded-md hover:bg-[#062a54] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IoSave className="h-4 w-4" />
              {updatePostMutation.isPending ? "Đang cập nhật..." : "Cập nhật"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPostModal;
