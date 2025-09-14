import React, { useState, useEffect } from "react";
import ComponentCard from "../../common/ComponentCard";
import { useDropzone } from "react-dropzone";

type DropzoneComponentProps = {
  onFileSelect: (file: File | null) => void;
  key: any;
};

const DropzoneComponent: React.FC<DropzoneComponentProps> = ({
  onFileSelect,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      onFileSelect(file);

      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      "image/png": [],
      "image/jpeg": [],
      "image/webp": [],
      "image/svg+xml": [],
    },
  });

  // cleanup khi unmount hoặc khi chọn ảnh mới
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <ComponentCard title="Thumbnail">
      <div
        {...getRootProps()}
        className={`transition border border-gray-300 border-dashed cursor-pointer rounded-xl p-7 lg:p-10 flex flex-col items-center justify-center
          ${
            isDragActive
              ? "border-blue-500 bg-gray-100"
              : "border-gray-300 bg-gray-50"
          }
        `}
      >
        <input {...getInputProps()} />
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Thumbnail Preview"
            className="max-h-48 rounded-lg object-contain shadow-sm"
          />
        ) : (
          <div className="dz-message flex flex-col items-center">
            <div className="mb-5 flex justify-center">
              <div className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-gray-200 text-gray-700">
                <svg
                  className="fill-current"
                  width="29"
                  height="28"
                  viewBox="0 0 29 28"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M14.5 3.9c-.2 0-.4.1-.5.3L8.6 9.5c-.3.3-.3.8 0 1.1s.8.3 1.1 0l4.1-4.1V18.7c0 .4.3.8.8.8s.8-.3.8-.8V6.5l4.1 4.1c.3.3.8.3 1.1 0s.3-.8 0-1.1l-5.3-5.3c-.1-.2-.3-.3-.6-.3ZM5.9 18.7c0-.4-.3-.8-.8-.8s-.8.3-.8.8v3.2c0 1.2 1 2.2 2.2 2.2h15.7c1.2 0 2.2-1 2.2-2.2v-3.2c0-.4-.3-.8-.8-.8s-.8.3-.8.8v3.2c0 .4-.3.8-.8.8H6.7c-.4 0-.8-.3-.8-.8v-3.2Z"
                  />
                </svg>
              </div>
            </div>
            <h4 className="mb-3 font-semibold text-gray-800">
              {isDragActive ? "Thả ảnh vào đây" : "Kéo & thả ảnh vào đây"}
            </h4>
            <span className="text-sm text-gray-500">PNG, JPG, WebP, SVG</span>
          </div>
        )}
      </div>
    </ComponentCard>
  );
};

export default DropzoneComponent;
