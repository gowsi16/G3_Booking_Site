import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { User, LogOut } from 'lucide-react';

import Home from './pages/Home';
import Booking from './pages/Booking';
import Tracking from './pages/Tracking';
import About from './pages/About';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

const fontDisplay = { fontFamily: "'Space Grotesk', sans-serif" };
const fontBody = { fontFamily: "'IBM Plex Sans', sans-serif" };

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();

  const links = [
    { name: 'Home', path: '/' },
    { name: 'Book', path: '/book' },
    { name: 'Track', path: '/track' },
    { name: 'About', path: '/about' },
  ];

  return (
    <nav className="sticky top-0 z-50 glass-panel mb-8 border-b-0 border-slate-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between flex-wrap gap-4">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="G3 Transport Logo" className="w-10 h-10 object-contain drop-shadow-sm" />
          <div>
            <h1 style={fontDisplay} className="text-xl font-bold leading-tight text-slate-800 tracking-tight">G3 Transport</h1>
          </div>
        </Link>
        <div className="flex items-center gap-5 text-sm font-medium" style={fontBody}>
          {links.map(l => (
            <Link 
              key={l.path} 
              to={l.path} 
              className={`transition-colors hover:text-amber-500 ${location.pathname === l.path ? 'text-blue-600 font-semibold' : 'text-slate-600'}`}
            >
              {l.name}
            </Link>
          ))}

          {/* User state in navbar */}
          {isLoggedIn ? (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
              <div className="flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-200/80 px-3 py-1.5 rounded-full text-xs font-semibold">
                <User size={13} className="text-amber-600" />
                <span className="max-w-[120px] truncate">{user.name.split(' ')[0]}</span>
              </div>
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                title="Logout"
                className="text-slate-400 hover:text-red-600 transition-colors p-1"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link 
              to="/login" 
              className={`transition-colors hover:text-amber-500 font-semibold ${location.pathname === '/login' ? 'text-blue-600' : 'text-slate-700'}`}
            >
              Login
            </Link>
          )}

          <Link to="/admin" className="text-xs px-3 py-1.5 border border-slate-300 rounded-full text-slate-500 hover:bg-slate-100 transition-colors">
            Admin
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="mt-16 bg-slate-900 text-slate-300 py-12" style={fontBody}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between gap-8 text-sm">
        <div className="mb-6 md:mb-0 max-w-sm">
          <h3 style={fontDisplay} className="text-white font-bold text-xl mb-4">G3 Transport</h3>
          <p className="mb-1">3/93, Kalaignar Street, Vellalagundam,</p>
          <p className="mb-4">Vazhapady Taluk, Salem – 636111</p>
          <p className="text-slate-500 text-xs mt-6">&copy; {new Date().getFullYear()} G3 Transport. All rights reserved.</p>
        </div>
        <div className="text-left md:text-right">
          <h3 style={fontDisplay} className="text-white font-bold text-xl mb-4">Contact Us</h3>
          <p className="mb-1 text-amber-400 font-mono text-base tracking-wider">9488289991 &bull; 9080942982</p>
          <p className="mb-1">gthreetransport@gmail.com</p>
          <p>gowsilan16@gmail.com</p>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="w-full flex flex-col min-h-screen font-sans bg-slate-50">
          <Navbar />
          <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 relative">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/book" element={<Booking />} />
              <Route path="/track" element={<Tracking />} />
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
