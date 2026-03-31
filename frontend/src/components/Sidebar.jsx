import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/logo.jpeg';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { name: 'Scan Lab', path: '/scan', icon: 'biotech' },
    { name: 'History', path: '/history', icon: 'history_edu' },
    { name: 'Profile', path: '/profile-setup', icon: 'person' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <motion.aside
        initial={false}
        animate={{
          width: isOpen ? '280px' : '88px',
          x: 0
        }}
        className={`fixed left-0 top-0 h-full bg-white border-r border-[#005144]/10 z-[70] transition-all duration-300 ease-in-out flex flex-col ${!isOpen ? 'items-center' : 'p-6'
          } ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo / Toggle Header */}
        <div 
          className={`flex items-center cursor-pointer hover:opacity-80 transition-opacity ${isOpen ? 'justify-between mb-12' : 'justify-center mt-8 mb-12'} w-full`}
          onClick={toggleSidebar}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="logo-full"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-3"
              >
                <img 
                  src={logo} 
                  alt="Medo Veda" 
                  className="h-10 w-auto object-contain" 
                />
              </motion.div>
            ) : (
              <motion.div
                key="logo-small"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <img 
                  src={logo} 
                  alt="M" 
                  className="h-8 w-8 object-contain" 
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 w-full space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all group relative ${isActive
                    ? 'bg-[#005144] text-white shadow-lg shadow-[#005144]/15'
                    : 'text-[#3e4946] hover:bg-[#005144]/5'
                  } ${!isOpen && 'justify-center px-0'}`}
              >
                <span className={`material-symbols-outlined text-2xl ${isActive ? 'text-white' : 'text-[#005144]'}`}>
                  {item.icon}
                </span>

                {isOpen && (
                  <span className="font-bold text-sm tracking-tight">{item.name}</span>
                )}

                {/* Tooltip for collapsed state */}
                {!isOpen && (
                  <div className="absolute left-full ml-4 px-3 py-2 bg-[#005144] text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-2 group-hover:translate-x-0 z-[100] whitespace-nowrap shadow-xl">
                    {item.name}
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Section */}
        <div className={`mt-auto w-full pt-8 border-t border-[#005144]/5 ${!isOpen && 'hidden'}`}>
          <div className="bg-[#f2fcf9] p-5 rounded-3xl border border-[#005144]/5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#005144] mb-2">Member Tier</p>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-[#141d1c]">Clinical Elite</span>
              <span className="text-[10px] font-black text-white bg-[#005144] px-2 py-0.5 rounded-full">PRO</span>
            </div>
            <div className="w-full h-1.5 bg-white rounded-full overflow-hidden mb-1">
              <div className="h-full bg-[#005144] w-[75%] rounded-full shadow-[0_0_8px_rgba(0,81,68,0.3)]"></div>
            </div>
            <p className="text-[10px] text-[#3e4946] font-medium">12/15 Analysis Credits</p>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
