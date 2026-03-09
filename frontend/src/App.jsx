import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login.jsx";
import SuperAdminDashboard from "./pages/SuperAdminDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import OperatorDashboard from "./pages/OperatorDashboard.jsx";
import UserDashboard from "./pages/UserDashboard.jsx";
import ClientHome from "./pages/ClientHome.jsx";
import ClientPage from "./pages/ClientPage.jsx";
import ClientRequest from "./pages/ClientRequest.jsx";
import ScanLanding from "./pages/ScanLanding.jsx";
import Search from "./pages/Search.jsx";
import PlaylistView from "./pages/PlaylistView.jsx";

function App() {
  return (
    <Router>
      <Routes>
        {/* Page de connexion - page par défaut */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        
        {/* Client PWA Routes - accessible aux clients qui scannent le QR */}
        <Route path="/client" element={<ClientPage />} />
        <Route path="/clienthome" element={<ClientHome />} />
        <Route path="/scan" element={<ScanLanding />} />
        <Route path="/request" element={<ClientRequest />} />
        <Route path="/search" element={<Search />} />
        <Route path="/playlist" element={<PlaylistView />} />
        
        {/* Admin/Operator/User Routes - après connexion */}
        <Route path="/dashboard/superadmin" element={<SuperAdminDashboard />} />
        <Route path="/dashboard/admin" element={<AdminDashboard />} />
        <Route path="/dashboard/operator" element={<OperatorDashboard />} />
        <Route path="/dashboard/user" element={<UserDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
