import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Modal = ({ isOpen, onClose, title, children, footer }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-[#005144]/10"
          >
            {/* Header */}
            <div className="px-8 py-6 border-b border-[#005144]/5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-[#005144] tracking-tighter uppercase">{title}</h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-[#005144]/5 text-[#3e4946] transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="px-8 py-10">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="px-8 py-6 bg-[#f2fcf9] border-t border-[#005144]/5">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
