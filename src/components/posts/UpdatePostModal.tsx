import React, { useMemo, useEffect, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { updatePostAPI, uploadImagesAPI } from "../../service/postService";
import { toast } from "react-toastify";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import DropzoneComponent from "../form/form-elements/DropZone";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type FormValues = {
  title: string;
  teaser: string;
  content: string;
  isFeatured: boolean;
  thumbnail: File | null;
};

const schema = yup.object({
  title: yup.string().required("Tiêu đề không được để trống"),
  teaser: yup
    .string()
    .required("Teaser không được để trống")
    .max(250, "Teaser tối đa 250 ký tự"),
  content: yup.string().required("Nội dung không được để trống"),
  isFeatured: yup.boolean(),
  thumbnail: yup.mixed<File>().nullable(), // Cho phép bỏ trống khi update
});

const UpdatePostModal = ({ isOpen, onClose, post }) => {
  const queryClient = useQueryClient();
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    clearErrors,
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

  // Prefill dữ liệu khi mở modal
  useEffect(() => {
    if (post) {
      setValue("title", post.title || "");
      setValue("teaser", post.teaser || "");
      setValue("content", post.content || "");
      setValue("isFeatured", post.isFeatured || false);
      setThumbnailPreview(post.thumbnailUrl || null);
    }
  }, [post, setValue]);

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
          ["bold", "italic", "underline"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["link", "image"],
          ["clean"],
        ],
        handlers: { image: imageHandler },
      },
    }),
    []
  );

  const handleThumbnailSelect = (file: File | null) => {
    setValue("thumbnail", file);
    if (file) {
      clearErrors("thumbnail");
      const previewUrl = URL.createObjectURL(file);
      setThumbnailPreview(previewUrl);
    } else {
      setThumbnailPreview(null);
    }
  };

  const updatePostMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const updatedPost = await updatePostAPI(post.id, {
        title: data.title,
        teaser: data.teaser,
        content: data.content,
        isFeatured: data.isFeatured,
      });

      if (data.thumbnail) {
        const formData = new FormData();
        formData.append("file", data.thumbnail);
        await uploadImagesAPI(formData, { folder: "posts", postId: post.id });
      }

      return updatedPost;
    },
    onSuccess: () => {
      toast.success("Cập nhật bài viết thành công!");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || "Cập nhật thất bại!");
    },
  });

  const onSubmit = (data: FormValues) => {
    updatePostMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Chỉnh sửa bài viết
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input
            {...register("title")}
            placeholder="Tiêu đề bài viết..."
            className="w-full p-3 border rounded-md"
          />
          {errors.title && (
            <p className="text-red-500 text-sm">{errors.title.message}</p>
          )}

          <textarea
            {...register("teaser")}
            placeholder="Teaser / mô tả ngắn..."
            className="w-full p-3 border rounded-md resize-none"
            rows={3}
          />
          {errors.teaser && (
            <p className="text-red-500 text-sm">{errors.teaser.message}</p>
          )}

          <DropzoneComponent onFileSelect={handleThumbnailSelect} />
          {thumbnailPreview && (
            <img
              src={thumbnailPreview}
              alt="thumbnail preview"
              className="w-32 rounded-md"
            />
          )}

          <div className="flex items-center gap-2">
            <input type="checkbox" {...register("isFeatured")} />
            <span>Đặt làm bài viết nổi bật</span>
          </div>

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
              />
            )}
          />
          {errors.content && (
            <p className="text-red-500 text-sm">{errors.content.message}</p>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={updatePostMutation.isLoading}
            >
              {updatePostMutation.isLoading ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdatePostModal;
