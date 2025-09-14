import { useState } from "react";

interface UserAvatarProps {
  src?: string;
  alt?: string;
  size?: string;
  name: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  src = "",
  alt = "",
  size = "w-8 h-8",
  name,
}) => {
  const [imgError, setImgError] = useState(false);

  if (imgError || !src) {
    return (
      <div
        className={`${size} bg-[#1d4699] rounded-full flex items-center justify-center text-white text-sm font-medium`}
      >
        {name?.charAt(0)?.toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${size} rounded-full object-cover`}
      onError={() => setImgError(true)}
    />
  );
};

export default UserAvatar;
