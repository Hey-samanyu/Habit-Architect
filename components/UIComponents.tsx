import React, { ReactNode } from 'react';
import { X } from 'lucide-react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 transition-colors duration-300 ${className}`}>
    {children}
  </div>
);

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="font-semibold text-slate-800 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

interface ProgressBarProps {
  current: number;
  max: number;
  colorClass?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, max, colorClass = "bg-violet-500" }) => {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));
  return (
    <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
      <div 
        className={`h-full rounded-full transition-all duration-500 ease-out ${colorClass}`} 
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};