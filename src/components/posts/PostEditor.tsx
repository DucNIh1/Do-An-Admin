import React, { useMemo, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  createPostAPI,
  deletePostAPI,
  uploadImagesAPI,
} from "../../service/postService";
import { toast } from "react-toastify";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import DropzoneComponent from "../form/form-elements/DropZone";
import axiosConfig from "../../axios/config";
import Select from "react-select";

type FormValues = {
  title: string;
  teaser: string;
  content: string;
  isFeatured: boolean;
  thumbnail: File | null;
  major?: { value: string; label: string } | null;
};

const schema = yup.object({
  title: yup.string().required("Tiêu đề không được để trống"),
  teaser: yup.string().required("Teaser không được để trống"),
  content: yup.string().required("Nội dung không được để trống"),
  isFeatured: yup.boolean(),
  thumbnail: yup
    .mixed<File>()
    .nullable()
    .required("Ảnh chính không được để trống")
    .test("fileType", "Chỉ chấp nhận file ảnh", (value) => {
      if (!value) return false;
      return [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/svg+xml",
      ].includes(value.type);
    })
    .test("fileSize", "File không được vượt quá 5MB", (value) => {
      if (!value) return false;
      return value.size <= 5 * 1024 * 1024;
    }),
});

const PostEditor = () => {
  const queryClient = useQueryClient();
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [dropzoneKey, setDropzoneKey] = useState(0);
  const {
    register,
    handleSubmit,
    control,
    watch,
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

  const watchedContent = watch("content");
  const watchedTitle = watch("title");
  const watchedTeaser = watch("teaser");

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
      const previewUrl = URL.createObjectURL(file);
      setThumbnailPreview(previewUrl);
    } else {
      setThumbnailPreview(null);
    }
  };

  const createPostMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const createdPost = await createPostAPI({
        title: data.title,
        teaser: data.teaser,
        content: data.content,
        isFeatured: data.isFeatured,
        isFromSchool: true,
        majorId: data.major?.value || null,
      });

      const postId = createdPost?.data?.id;
      if (!postId) throw new Error("Không lấy được ID bài viết!");

      if (data.thumbnail) {
        const formData = new FormData();
        formData.append("file", data.thumbnail);

        try {
          await uploadImagesAPI(formData, { folder: "posts", postId });
        } catch (error) {
          await deletePostAPI(postId);
          throw new Error(
            "Không thể tải ảnh thumbnail. Bài viết đã được tự động hủy."
          );
        }
      }

      return createdPost;
    },
    onSuccess: () => {
      toast.success("Đăng bài viết thành công!");
      queryClient.invalidateQueries({ queryKey: ["posts"] });

      setValue("title", "");
      setValue("teaser", "");
      setValue("content", "");
      setValue("isFeatured", false);
      setValue("thumbnail", null);
      if (thumbnailPreview) {
        URL.revokeObjectURL(thumbnailPreview);
        setThumbnailPreview(null);
      }
      setDropzoneKey((prev) => prev + 1);
    },
    onError: (error: any) => {
      toast.error(error.message || "Có lỗi xảy ra, vui lòng thử lại!");
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

  const onSubmit = (data: FormValues) => {
    createPostMutation.mutate(data);
  };

  React.useEffect(() => {
    return () => {
      if (thumbnailPreview) {
        URL.revokeObjectURL(thumbnailPreview);
      }
    };
  }, [thumbnailPreview]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-4xl mx-auto my-8 p-6 bg-gray-50 rounded-lg shadow-lg"
    >
      <h2 className="text-center mb-6 text-3xl font-bold text-gray-800">
        Tạo bài viết mới
      </h2>
      <div className="flex justify-end mb-8">
        <button
          type="submit"
          disabled={createPostMutation.isPending}
          className="px-6 py-2.5 disabled:cursor-not-allowed disabled:bg-slate-400 bg-[#083970]  text-white rounded-lg hover:bg-[#062a54] transition-colors"
        >
          {createPostMutation.isPending ? "Đang đăng..." : "Đăng bài viết"}
        </button>
      </div>
      {/* Title */}
      <div className="mb-4">
        <input
          {...register("title")}
          placeholder="Tiêu đề bài viết..."
          className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#083970]"
        />
        {errors.title && (
          <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
        )}
      </div>

      <div className="mb-4">
        <textarea
          {...register("teaser")}
          placeholder="Teaser / mô tả ngắn..."
          className="w-full p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-[#083970]"
          rows={3}
        />
        {errors.teaser && (
          <p className="text-red-500 text-sm mt-1">{errors.teaser.message}</p>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 mb-2">
          Ngành (không bắt buộc)
        </label>
        <Controller
          name="major"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              options={majorsData || []}
              isClearable
              placeholder="Chọn ngành..."
              value={field.value || null}
              onChange={(val) => field.onChange(val)}
            />
          )}
        />
      </div>
      {/* Thumbnail Upload sử dụng DropZone */}
      <div className="mb-4">
        <DropzoneComponent
          onFileSelect={handleThumbnailSelect}
          key={dropzoneKey}
        />
        {errors.thumbnail && (
          <p className="text-red-500 text-sm mt-2">
            {errors.thumbnail.message}
          </p>
        )}
      </div>

      <div className="mb-4 flex items-center gap-2">
        <input
          type="checkbox"
          id="isFeatured"
          {...register("isFeatured")}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
        />
        <label htmlFor="isFeatured" className="text-gray-700">
          Đặt làm bài viết nổi bật
        </label>
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 mb-2">Nội dung bài viết</label>
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
            />
          )}
        />
        {errors.content && (
          <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>
        )}
      </div>

      <div className="mt-8 p-6 border border-gray-300 rounded-lg bg-white">
        {watchedTitle && (
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            {watchedTitle}
          </h2>
        )}

        {watchedTeaser && (
          <p className="text-gray-600 italic mb-4 text-lg">{watchedTeaser}</p>
        )}

        <div
          className="ql-editor border rounded-lg p-4 bg-white"
          dangerouslySetInnerHTML={
            watchedContent
              ? { __html: watchedContent }
              : {
                  __html:
                    "<p class='text-gray-500 italic'>Nhập nội dung để xem preview...</p>",
                }
          }
        />
      </div>
    </form>
  );
};

export default PostEditor;
