import './App.css';
import Nav from './components/Nav';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Footer from './components/Footer';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import LogoutMessage from './components/LogoutMessage';
import UserLogin from './components/UserLogin';
import UserRegister from './components/UserRegister';
import DonorRegister from './components/DonorRegister';
import PatientLogin from './components/PatientLogin';
import PatientRegister from './components/PatientRegister';
import Home from './components/Home';
import DonorDashboard from './components/DonorDashboard';
import PatientDashboard from './components/PatientDashboard';
import NotificationToast from './components/NotificationToast';
import { AuthProvider } from './context/AuthContext';
import bg from './assets/bg.jpg'

function App() {
  return (
    <div className="App" style={{ backgroundImage: `url(${bg})` }}>
      <AuthProvider>
        <BrowserRouter>
          <Content />
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

function Content() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin-dashboard');
  const isPatientRoute = location.pathname.startsWith('/patient');
  const isDonorRoute = location.pathname.startsWith('/donor-dashboard');
  const isLoginPage = ['/admin', '/user', '/patient', '/donor', '/user-register', '/patient-register', '/donor-register'].includes(location.pathname);

  return (
    <>
      <NotificationToast />
      {!isAdminRoute && !isDonorRoute && !isPatientRoute && <Nav />}
      <div className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/user" element={<UserLogin />} />
          <Route path="/user-register" element={<UserRegister />} />
          <Route path="/patient" element={<PatientLogin />} />
          <Route path="/patient-register" element={<PatientRegister />} />
          <Route path="/donor-register" element={<DonorRegister />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin-dashboard/*" element={<AdminDashboard />} />
          <Route path="/donor-dashboard/*" element={<DonorDashboard />} />
          <Route path="/patient-dashboard/*" element={<PatientDashboard />} />
          <Route path="/logout" element={<LogoutMessage />} />
        </Routes>
      </div>
      {!isAdminRoute && !isPatientRoute && !isDonorRoute && !isLoginPage && <Footer />}
    </>
  );
}

export default App;