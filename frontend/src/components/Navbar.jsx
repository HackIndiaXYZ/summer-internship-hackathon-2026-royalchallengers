import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ onLogoClick }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const navLinks = [
    { name: 'Home', path: '/', icon: <span className="material-symbols-outlined text-[18px]">home</span> },
    { name: 'Dashboard', path: '/dashboard', icon: <span className="material-symbols-outlined text-[18px]">dashboard</span> },
    { name: 'Scan Lab', path: '/scan', icon: <span className="material-symbols-outlined text-[18px]">biotech</span> },
    { name: 'Reports', path: '/history', icon: <span className="material-symbols-outlined text-[18px]">clinical_notes</span> }
  ];

  const internalPages = ['/dashboard', '/scan', '/history', '/profile-setup', '/analysis'];
  const isInternalPage = internalPages.some(path => location.pathname.startsWith(path));

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-[#f2fcf9]/80 backdrop-blur-md border-b border-[#005144]/10">
        <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex items-center h-20 relative">
          {/* Left Section: Logo / Toggle */}
          <div className="flex items-center lg:w-[280px] flex-1 lg:flex-none">
            <div
              className="flex items-center gap-1.5 sm:gap-2 cursor-pointer group"
              onClick={() => {
                if (isInternalPage) onLogoClick();
                else navigate('/');
              }}
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#005144] rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-[#005144]/20 group-hover:scale-110 transition-transform flex-shrink-0">
                <span className="text-white font-black text-lg sm:text-xl">M</span>
              </div>
              <span className="text-base xs:text-lg sm:text-xl font-bold text-[#005144] tracking-tighter whitespace-nowrap flex-shrink-0">MEDO VEDA</span>
            </div>
          </div>

          {/* Center Section: Navigation Buttons */}
          <div className="hidden lg:flex flex-1 justify-center items-center gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all duration-300 ${location.pathname === link.path
                  ? 'bg-[#005144] text-white shadow-xl shadow-[#005144]/20'
                  : 'text-[#3e4946] hover:bg-[#005144]/5'
                  }`}
              >
                {link.icon} {link.name}
              </Link>
            ))}
          </div>

          {/* Right Section: Auth/Profile */}
          <div className="flex items-center justify-end lg:w-[280px] gap-2 sm:gap-4">
            {user ? (
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 sm:gap-3 bg-white p-1 pr-3 sm:pr-4 rounded-xl sm:rounded-2xl border border-[#005144]/10 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#005144] flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-white text-lg sm:text-xl">person</span>
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-sm font-bold text-[#141d1c] leading-tight">{user.name}</p>
                    <p className="text-[10px] text-[#005144] font-medium uppercase tracking-wider">Member</p>
                  </div>
                </motion.button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-[#005144]/10 p-2 z-50"
                      >
                        <div className="px-4 py-3 border-b border-[#005144]/5 mb-2">
                          <p className="text-sm font-bold text-[#141d1c]">{user.name}</p>
                          <p className="text-xs text-[#3e4946] truncate">{user.email}</p>
                        </div>
                        <Link
                          to="/profile-setup"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-[#3e4946] hover:bg-[#005144]/5 rounded-xl transition-all font-medium"
                        >
                          <span className="material-symbols-outlined text-lg">person</span> Profile Settings
                        </Link>
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            logout();
                            navigate('/');
                          }}
                          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-all font-semibold"
                        >
                          <span className="material-symbols-outlined text-lg">logout</span> Sign Out
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to="/auth"
                className="bg-[#005144] hover:bg-[#003d33] text-white px-5 py-2.5 sm:px-8 sm:py-3 rounded-xl sm:rounded-2xl font-bold shadow-lg shadow-[#005144]/20 transition-all flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-lg sm:text-xl">person</span> Sign In
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 text-[#005144] bg-[#005144]/5 rounded-xl"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="material-symbols-outlined text-2xl">
                {isMenuOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </nav>

    {/* Mobile Menu Overlay */}
    <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-[#141d1c]/40 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed top-0 right-0 h-full w-[60vw] bg-white z-[1000] shadow-[0_0_50px_rgba(0,0,0,0.1)] flex flex-col"
            >
              <div className="p-8 flex flex-col h-full">
                <div className="flex items-center justify-between mb-12">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#005144] rounded-lg flex items-center justify-center">
                      <span className="text-white font-black text-sm">M</span>
                    </div>
                    <span className="text-lg font-bold text-[#005144] tracking-tighter">MEDO VEDA</span>
                  </div>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#005144]/5 text-[#005144]"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="space-y-2 flex-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.name}
                      to={link.path}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${location.pathname === link.path
                        ? 'bg-[#005144] text-white shadow-lg shadow-[#005144]/20'
                        : 'text-[#3e4946] hover:bg-[#005144]/5'
                        }`}
                    >
                      {link.icon} <span className="text-sm uppercase tracking-widest">{link.name}</span>
                    </Link>
                  ))}
                </div>

                <div className="mt-auto pt-8 border-t border-[#005144]/10">
                  {user ? (
                    <div className="space-y-3">
                      <div className="px-4 py-3 bg-[#005144]/5 rounded-2xl mb-4">
                        <p className="text-sm font-bold text-[#141d1c]">{user.name}</p>
                        <p className="text-[10px] text-[#005144] font-medium uppercase tracking-wider">{user.email}</p>
                      </div>
                      <Link
                        to="/profile-setup"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 w-full px-6 py-4 text-sm text-[#3e4946] font-bold hover:bg-[#005144]/5 rounded-2xl transition-all"
                      >
                        <span className="material-symbols-outlined">settings</span> Account Settings
                      </Link>
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          logout();
                          navigate('/');
                        }}
                        className="flex items-center gap-3 w-full px-6 py-4 text-sm text-red-500 font-bold hover:bg-red-50 rounded-2xl transition-all"
                      >
                        <span className="material-symbols-outlined">logout</span> Sign Out
                      </button>
                    </div>
                  ) : (
                    <Link
                      to="/auth"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-center gap-3 w-full bg-[#005144] text-white py-5 rounded-2xl font-bold shadow-xl shadow-[#005144]/20"
                    >
                      <span className="material-symbols-outlined text-xl">person</span> Authenticate Specialist
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};


export default Navbar;
