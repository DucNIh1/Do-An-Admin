import { Navigate } from "react-router";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

export default function PrivateRoute({ children }) {
  const { user } = useContext(AuthContext);
  if (!user && user?.role !== "ADMIN") {
    return <Navigate to="/signin" replace />;
  }

  return children;
}
