import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const MobileBottomNav = () => {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const itemClass = (active) =>
    `flex flex-col items-center justify-center min-w-[56px] gap-1 transition-all ${active ? 'text-[#005144]' : 'text-[#4b5b56]'}`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[120] lg:hidden pointer-events-none">
      <div className="mx-auto max-w-xl px-3 pb-[calc(env(safe-area-inset-bottom,0px)+10px)] pointer-events-auto">
        <div className="relative rounded-[28px] bg-white/95 backdrop-blur-md border border-[#005144]/10 shadow-[0_12px_40px_rgba(0,81,68,0.18)] px-4 py-2.5">
          <div className="grid grid-cols-5 items-end">
            <Link to="/" className={itemClass(isActive('/'))}>
              <span className="material-symbols-outlined text-[22px]">home</span>
              <span className="text-[10px] font-black uppercase tracking-[0.14em]">Home</span>
            </Link>

            <Link to="/dashboard" className={itemClass(isActive('/dashboard'))}>
              <span className="material-symbols-outlined text-[22px]">dashboard</span>
              <span className="text-[10px] font-black uppercase tracking-[0.14em]">Dashboard</span>
            </Link>

            <div className="flex justify-center -mt-8">
              <Link
                to="/scan"
                className="w-[64px] h-[64px] rounded-full bg-[#005144] text-white shadow-[0_12px_24px_rgba(0,81,68,0.4)] border-4 border-white flex items-center justify-center active:scale-95 transition-transform"
                aria-label="Scan"
              >
                <span className="material-symbols-outlined text-[30px]">qr_code_scanner</span>
              </Link>
            </div>

            <Link to="/profile-setup" className={itemClass(isActive('/profile-setup'))}>
              <span className="material-symbols-outlined text-[22px]">person</span>
              <span className="text-[10px] font-black uppercase tracking-[0.14em]">Profile</span>
            </Link>

            <Link to="/history" className={itemClass(isActive('/history') || isActive('/analysis') || isActive('/report'))}>
              <span className="material-symbols-outlined text-[22px]">clinical_notes</span>
              <span className="text-[10px] font-black uppercase tracking-[0.14em]">Reports</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileBottomNav;
