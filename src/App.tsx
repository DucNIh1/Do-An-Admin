import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";

import Calendar from "./pages/Calendar";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import ManageUsers from "./pages/Users/ManageUsers";
import PostEditor from "./components/posts/PostEditor";
import ManageSchoolPosts from "./pages/Posts/ManageSchoolPosts";
import ManageStudentPosts from "./pages/Posts/ManageStudentPosts";
import ConsultationRequest from "./pages/ConsultationRequest";
import PrivateRoute from "./components/auth/PrivateRoute";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />

        <Routes>
          <Route
            element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            }
          >
            <Route index path="/" element={<Home />} />

            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />

            <Route path="/form-elements" element={<FormElements />} />

            <Route path="/quan-li-nguoi-dung" element={<ManageUsers />} />
            <Route path="/tao-bai-viet" element={<PostEditor />} />
            <Route
              path="/quan-li-bai-viet-nha-truong"
              element={<ManageSchoolPosts />}
            />
            <Route
              path="/quan-li-bai-viet-hoc-sinh"
              element={<ManageStudentPosts />}
            />
            <Route
              path="/quan-li-yeu-cau-tu-van"
              element={<ConsultationRequest />}
            />
          </Route>

          <Route path="/signin" element={<SignIn />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
