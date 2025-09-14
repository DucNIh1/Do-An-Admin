import { createContext, useEffect, useState, ReactNode } from "react";
import axiosConfig from "../axios/config.ts";

interface User {
  id: string;
  email: string;
  name?: string;
}

interface StoredUser {
  value: User;
  expiry: number;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface GoogleCredentialResponse {
  credential: string;
}

interface AuthContextValue {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<unknown>;
  logout: () => Promise<string>;
  setUser: (user: User | null) => void;
  loginWithGoogle: (
    credentialResponse: GoogleCredentialResponse
  ) => Promise<void>;
  openProfile: boolean;
  setOpenProfile: (open: boolean) => void;
}

interface AuthContextProviderProps {
  children: ReactNode;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

const AuthContextProvider = ({ children }: AuthContextProviderProps) => {
  const getStoredUser = (): User | null => {
    const stored = localStorage.getItem("user");
    if (!stored) return null;

    try {
      const parsedStored: StoredUser = JSON.parse(stored);
      if (parsedStored.expiry && parsedStored.expiry > Date.now()) {
        return parsedStored.value;
      } else {
        localStorage.removeItem("user");
        return null;
      }
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  };

  const [user, setUser] = useState<User | null>(getStoredUser());
  const [openProfile, setOpenProfile] = useState<boolean>(false);

  const login = async ({
    email,
    password,
  }: LoginCredentials): Promise<unknown> => {
    const res = await axiosConfig.post("/api/auth/login", { email, password });
    if (!res.data.user) return res;
    setUser(res.data?.user);
    return res;
  };

  const logout = async (): Promise<string> => {
    const res = await axiosConfig.post("/api/auth/logout");
    setUser(null);
    return res.data?.message;
  };

  const loginWithGoogle = async (
    credentialResponse: GoogleCredentialResponse
  ): Promise<void> => {
    try {
      const res = await axiosConfig.post(`/api/auth/google-auth`, {
        token: credentialResponse.credential,
      });
      console.log(res);
      setUser(res.data?.user);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (user) {
      const item: StoredUser = {
        value: user,
        expiry: Date.now() + 60 * 60 * 1000,
      };
      localStorage.setItem("user", JSON.stringify(item));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  const contextValue: AuthContextValue = {
    user,
    login,
    logout,
    setUser,
    loginWithGoogle,
    openProfile,
    setOpenProfile,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export default AuthContextProvider;
