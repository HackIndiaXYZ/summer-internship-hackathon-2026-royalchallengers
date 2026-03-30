import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white pt-16 pb-24 border-t border-emerald-900/5 px-6">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 text-center md:text-left">
        <div className="md:col-span-8 flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#005144] rounded-xl flex items-center justify-center shadow-lg shadow-[#005144]/20 group-hover:scale-110 transition-transform">
              <span className="text-white font-black text-xl">M</span>
            </div>
            <span className="text-xl font-bold text-[#005144] tracking-tighter sm:block">MEDO VEDA</span>
          </div>
          <p className="text-sm md:text-base text-[#3e4946] leading-relaxed font-medium max-w-md mx-auto md:mx-0 opacity-70">
            Advancing global health standards and clinical precision through nine-agent AI architecture.
          </p>
        </div>
        
        <div className="md:col-span-4 flex flex-col items-center md:items-end justify-center gap-6">
          <div className="flex flex-wrap justify-center md:justify-end gap-x-8 gap-y-4">
            {['Privacy', 'Protocol', 'Research', 'Contact'].map((item) => (
              <Link key={item} to="#" className="text-[10px] font-black uppercase tracking-widest text-[#005144]/40 hover:text-[#005144] transition-colors">{item}</Link>
            ))}
          </div>
          <div className="flex items-center justify-center md:justify-end gap-3 text-[9px] font-black uppercase tracking-[0.3em] text-[#5f6965]/40 pt-6 border-t border-[#005144]/5 w-full md:w-auto">
            <span>© 2024</span>
            <div className="w-1 h-1 rounded-full bg-primary/20"></div>
            <span className="flex items-center gap-2 text-[#005144] opacity-80">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              Clinical Intelligence
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
