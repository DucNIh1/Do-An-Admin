import { useContext, useState } from "react";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { useNavigate } from "react-router";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import UserAvatar from "../common/UserAvatar";

export default function UserDropdown() {
  const { user, logout } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const toggleDropdown = () => setIsOpen((prev) => !prev);
  const closeDropdown = () => setIsOpen(false);

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.removeItem("user");
      navigate("/signin");
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại!!");
    }
  };

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/signin")}
          className="px-4 py-2 text-white bg-[#083970] rounded-lg hover:bg-opacity-90 transition"
        >
          Đăng nhập
        </button>
      </div>
    );
  }

  // Nếu đã login -> hiển thị dropdown
  return (
    <div className="relative">
      {/* Avatar + tên */}
      <button
        onClick={toggleDropdown}
        className="flex items-center text-gray-700 dropdown-toggle dark:text-gray-400"
      >
        <span className="mr-3 overflow-hidden rounded-full">
          <UserAvatar name={user?.name} src={user?.avatar} size="h-11 w-11" />
        </span>

        <span className="block mr-1 font-medium text-theme-sm">
          {user?.name}
        </span>

        <svg
          className={`stroke-gray-500 dark:stroke-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          width="18"
          height="20"
          viewBox="0 0 18 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Dropdown menu */}
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        {/* Thông tin user */}
        <div>
          <span className="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">
            {user?.name}
          </span>
          <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
            {user?.email}
          </span>
        </div>

        {/* Menu item */}
        <ul className="flex flex-col gap-1 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800">
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              to="/profile"
              className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
            >
              {/* Hồ sơ cá nhân */}
              <svg
                className="fill-gray-500 group-hover:fill-gray-700 dark:fill-gray-400 dark:group-hover:fill-gray-300"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 3.5C7.30558 3.5 3.5 7.30558 3.5 12C3.5 14.1526 4.3002 16.1184 5.61936 17.616C6.17279 15.3096 8.24852 13.5955 10.7246 13.5955H13.2746C15.7509 13.5955 17.8268 15.31 18.38 17.6167C19.6996 16.119 20.5 14.153 20.5 12C20.5 7.30558 16.6944 3.5 12 3.5ZM17.0246 18.8566V18.8455C17.0246 16.7744 15.3457 15.0955 13.2746 15.0955H10.7246C8.65354 15.0955 6.97461 16.7744 6.97461 18.8455V18.856C8.38223 19.8895 10.1198 20.5 12 20.5C13.8798 20.5 15.6171 19.8898 17.0246 18.8566ZM2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12ZM11.9991 7.25C10.8847 7.25 9.98126 8.15342 9.98126 9.26784C9.98126 10.3823 10.8847 11.2857 11.9991 11.2857C13.1135 11.2857 14.0169 10.3823 14.0169 9.26784C14.0169 8.15342 13.1135 7.25 11.9991 7.25ZM8.48126 9.26784C8.48126 7.32499 10.0563 5.75 11.9991 5.75C13.9419 5.75 15.5169 7.32499 15.5169 9.26784C15.5169 11.2107 13.9419 12.7857 11.9991 12.7857C10.0563 12.7857 8.48126 11.2107 8.48126 9.26784Z"
                  fill=""
                />
              </svg>
              Hồ sơ cá nhân
            </DropdownItem>
          </li>

          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              to="/settings"
              className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
            >
              {/* Cài đặt tài khoản */}
              <svg
                className="fill-gray-500 group-hover:fill-gray-700 dark:fill-gray-400 dark:group-hover:fill-gray-300"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M10.4858 3.5H13.5182C13.9233 3.5 14.2518 3.8285 14.2518 4.2338C14.2518 5.9529 16.1129 7.028 17.602 6.1682C17.9528 5.9657 18.4014 6.0859 18.6039 6.4367L20.1203 9.0631C20.3229 9.4141 20.2027 9.8629 19.8517 10.0655C18.3625 10.9253 18.3625 13.0747 19.8517 13.9345C20.2026 14.1372 20.3229 14.5859 20.1203 14.9369L18.6039 17.5634C18.4013 17.9142 17.9528 18.0344 17.602 17.8318C16.1129 16.9721 14.2518 18.0471 14.2518 19.7663C14.2518 20.1715 13.9233 20.5 13.5182 20.5H10.4858C10.0804 20.5 9.7518 20.1714 9.7518 19.766C9.7518 18.0461 7.8898 16.9717 6.4007 17.8314C6.0495 18.0342 5.6004 17.9139 5.3977 17.5628L3.8817 14.937C3.679 14.586 3.7993 14.1372 4.1503 13.9346C5.6395 13.0748 5.6395 10.9253 4.1503 10.0655C3.7993 9.8628 3.679 9.414 3.8816 9.063L5.3976 6.4373C5.6003 6.0862 6.0494 5.9658 6.4006 6.1686C7.8898 7.0284 9.7518 5.9539 9.7518 4.234C9.7518 3.8286 10.0804 3.5 10.4858 3.5Z"
                  fill=""
                />
              </svg>
              Cài đặt tài khoản
            </DropdownItem>
          </li>
        </ul>

        {/* Đăng xuất */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 mt-3 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
        >
          <svg
            className="fill-gray-500 group-hover:fill-gray-700 dark:group-hover:fill-gray-300"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M15.1007 19.247C14.6865 19.247 14.3507 18.9112 14.3507 18.497V14.245H12.8507V18.497C12.8507 19.7396 13.8581 20.747 15.1007 20.747H18.5007C19.7434 20.747 20.7507 19.7396 20.7507 18.497V5.496C20.7507 4.253 19.7433 3.246 18.5007 3.246H15.1007C13.8581 3.246 12.8507 4.253 12.8507 5.496V9.745H14.3507V5.496C14.3507 5.082 14.6865 4.746 15.1007 4.746H18.5007C18.9149 4.746 19.2507 5.082 19.2507 5.496V18.497C19.2507 18.911 18.9149 19.247 18.5007 19.247H15.1007ZM3.2507 11.998C3.2507 12.214 3.342 12.409 3.4882 12.546L8.0948 17.156C8.3876 17.449 8.8625 17.449 9.1555 17.156C9.4485 16.863 9.4486 16.388 9.1558 16.095L5.8112 12.748H16.0007C16.415 12.748 16.7507 12.413 16.7507 11.998C16.7507 11.584 16.415 11.248 16.0007 11.248H5.8153L9.1559 7.906C9.4486 7.613 9.4485 7.138 9.1555 6.845C8.8625 6.552 8.3876 6.552 8.0948 6.845L3.5231 11.42C3.3567 11.558 3.2507 11.766 3.2507 11.998Z"
              fill=""
            />
          </svg>
          Đăng xuất
        </button>
      </Dropdown>
    </div>
  );
}
