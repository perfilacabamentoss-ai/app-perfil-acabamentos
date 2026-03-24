
import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger'
}) => {
  if (!isOpen) return null;

  const colors = {
    danger: 'bg-rose-500 hover:bg-rose-600 shadow-rose-200 text-white',
    warning: 'bg-amber-500 hover:bg-amber-600 shadow-amber-200 text-white',
    info: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 text-white'
  };

  const iconColors = {
    danger: 'text-rose-500 bg-rose-50',
    warning: 'text-amber-500 bg-amber-50',
    info: 'text-blue-500 bg-blue-50'
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100"
        >
          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div className={`p-4 rounded-2xl ${iconColors[type]}`}>
                <AlertTriangle size={32} />
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"
              >
                <X size={24} />
              </button>
            </div>

            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">
              {title}
            </h3>
            <p className="text-slate-500 font-medium leading-relaxed">
              {message}
            </p>

            <div className="grid grid-cols-2 gap-4 mt-10">
              <button
                onClick={onClose}
                className="px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg ${colors[type]}`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ConfirmModal;
