import axiosConfig from "../axios/config";

export const uploadImagesAPI = async (imageFiles, extraData = {}) => {
  const formData = new FormData();
  imageFiles.forEach((file) => {
    formData.append("images", file);
  });

  if (!extraData.folder) {
    formData.append("folder", "others");
  }

  Object.entries(extraData).forEach(([key, value]) => {
    if (value) formData.append(key, value);
  });
  const res = await axiosConfig.post(`api/images/upload`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};

export const createPostAPI = async (postData) => {
  const res = await axiosConfig.post(`api/posts`, postData);
  return res.data;
};

export const deletePostAPI = async (id) => {
  const res = await axiosConfig.delete(`api/posts/${id}`);
  return res.data;
};
export const deleteImagesAPI = async (imageIds) => {
  const res = await axiosConfig.delete(`api/images/delete`, {
    data: { ids: imageIds },
  });
  return res.data;
};

export const getPostsAPI = async (filters = {}) => {
  const res = await axiosConfig.get("api/posts", { params: filters });
  return res.data;
};

export const getPostAPI = async (id) => {
  const res = await axiosConfig.get(`api/posts/${id}`);
  console.log("Fetched post:", res.data);
  return res.data.post;
};

export const fetchCommentsAPI = async ({ queryKey, pageParam = 1 }) => {
  const [_key, postId] = queryKey;
  const response = await axiosConfig.get(`/api/posts/${postId}/comments`, {
    params: { page: pageParam, limit: 15, sort: "desc" },
  });

  return {
    comments: response.data.data.comments,
    nextPage:
      response.data.data.currentPage < response.data.data.totalPages
        ? pageParam + 1
        : undefined,
    totalComments: response.data.data.totalComments,
  };
};

export const toggleLikeAPI = async (postId) => {
  const response = await axiosConfig.post(`/api/posts/${postId}/like`);
  return response.data.data;
};

export const checkUserLikedAPI = async (postId) => {
  const response = await axiosConfig.get(`/api/posts/${postId}/like/check`);
  return response.data.data;
};

export const createCommentAPI = async ({ postId, text, images = [] }) => {
  const response = await axiosConfig.post(`/api/posts/${postId}/comments`, {
    text,
  });
  const comment = response.data.data.comment;

  if (images.length > 0) {
    try {
      await uploadImagesAPI(images, {
        folder: "comments",
        commentId: comment.id,
      });
    } catch (error) {
      console.error("Lỗi upload ảnh comment:", error);
    }
  }

  return response.data.data;
};

export const updateCommentAPI = async ({ commentId, text }) => {
  const response = await axiosConfig.put(`/api/posts/comments/${commentId}`, {
    text,
  });
  return response.data.data;
};

export const deleteCommentAPI = async (commentId) => {
  const response = await axiosConfig.delete(`/api/posts/comments/${commentId}`);
  return response.data.data;
};

export const getCommentAPI = async (commentId) => {
  const response = await axiosConfig.get(`/api/posts/comments/${commentId}`);
  return response.data.data;
};

export const updatePostAPI = async (
  postId: string,
  data: {
    title: string;
    teaser: string;
    content: string;
    isFeatured: boolean;
  }
) => {
  try {
    const response = await axiosConfig.put(`/api/posts/${postId}`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating post:", error);
    throw error;
  }
};
