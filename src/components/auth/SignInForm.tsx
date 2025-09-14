import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "react-toastify";
import { GoogleLogin } from "@react-oauth/google";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation } from "@tanstack/react-query";

import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import { AuthContext } from "../../context/AuthContext";

const schema = yup.object().shape({
  email: yup
    .string()
    .email("Email không hợp lệ")
    .required("Vui lòng nhập email"),
  password: yup
    .string()
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
    .required("Vui lòng nhập mật khẩu"),
});

interface FormData {
  email: string;
  password: string;
}

interface GoogleCredentialResponse {
  credential: string;
}

export default function SignInForm() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isChecked, setIsChecked] = useState<boolean>(false);

  const authContext = useContext(AuthContext);

  if (!authContext) {
    throw new Error("SignInForm must be used within AuthContext");
  }

  const { login: loginAPI, loginWithGoogle } = authContext;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const loginMutation = useMutation({
    mutationFn: loginAPI,
    onSuccess: () => {
      navigate("/");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Đăng nhập có lỗi xảy ra, vui lòng thử lại sau!"
      );
    },
  });

  const loginWithGoogleMutation = useMutation({
    mutationFn: loginWithGoogle,
    onSuccess: () => {
      navigate("/");
    },
    onError: () => {
      toast.error("Google Đăng nhập có lỗi xảy ra, vui lòng thử lại sau!");
    },
  });

  const onSubmit = (data: FormData): void => {
    loginMutation.mutate(data);
  };

  const handleGoogleSuccess = (
    credentialResponse: GoogleCredentialResponse
  ): void => {
    loginWithGoogleMutation.mutate(credentialResponse);
  };

  const handleGoogleError = (): void => {
    toast.error("Google sign in failed 😱");
  };

  return (
    <>
      <div className="flex flex-col flex-1">
        <div className="w-full max-w-md pt-10 mx-auto">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ChevronLeftIcon className="size-5" />
            Quay lại trang chủ
          </Link>
        </div>
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
          <div>
            <div className="mb-5 sm:mb-8">
              <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                Đăng nhập vào tài khoản của bạn
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Chào mừng bạn trở lại! Vui lòng nhập thông tin đăng nhập của
                bạn.
              </p>
            </div>
            <div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5">
                <div className="sm:col-span-2">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                  />
                </div>
              </div>
              <div className="relative py-3 sm:py-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="p-2 text-gray-400 bg-white dark:bg-gray-900 sm:px-5 sm:py-2">
                    Hoặc
                  </span>
                </div>
              </div>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-6">
                  <div>
                    <Label>
                      Email <span className="text-error-500">*</span>
                    </Label>
                    <Input
                      {...register("email")}
                      type="email"
                      placeholder="info@gmail.com"
                      error={!!errors.email}
                      hint={errors.email?.message}
                    />
                  </div>
                  <div>
                    <Label>
                      Mật khẩu <span className="text-error-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        {...register("password")}
                        type={showPassword ? "text" : "password"}
                        placeholder="Nhập mật khẩu"
                        error={!!errors.password}
                        hint={errors.password?.message}
                      />
                      <span
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                      >
                        {showPassword ? (
                          <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                        ) : (
                          <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox checked={isChecked} onChange={setIsChecked} />
                      <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                        Giữ đăng nhập
                      </span>
                    </div>
                    <Link
                      to="/reset-password"
                      className="text-sm  dark:text-brand-400"
                    >
                      Quên mật khẩu?
                    </Link>
                  </div>
                  <div>
                    <Button
                      type="submit"
                      className="w-full"
                      size="sm"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <div className="mx-auto w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                      ) : (
                        "Đăng nhập"
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
