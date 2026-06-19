import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function PublicLayout() {
  return (
    <div className="site">
      <div className="publicTop">
        <Navbar />
      </div>

      <Outlet />

      <Footer />
    </div>
  );
}

export default PublicLayout;