
import React, { ReactNode, HTMLAttributes, useEffect, useRef } from 'react';
import { X, Check } from 'lucide-react';

// --- BUTTON ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, variant = 'primary', className = '', ...props 
}) => {
  const baseStyles = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20",
    secondary: "bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700",
    outline: "border border-zinc-600 text-zinc-300 hover:border-zinc-400 hover:text-white bg-transparent",
    danger: "bg-red-900/50 text-red-200 border border-red-900 hover:bg-red-900/80",
    ghost: "bg-transparent hover:bg-zinc-800 text-zinc-400 hover:text-white p-2"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

// --- CARD ---
export interface CardProps extends HTMLAttributes<HTMLDivElement> {}
export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => (
  <div className={`bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-sm ${className}`} {...props}>
    {children}
  </div>
);

// --- INPUT ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
export const Input: React.FC<InputProps> = ({ className = '', ...props }) => (
  <input 
    className={`w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-zinc-600 ${className}`}
    {...props}
  />
);

// --- TEXTAREA ---
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}
export const TextArea: React.FC<TextAreaProps> = ({ className = '', ...props }) => (
  <textarea 
    className={`w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-zinc-600 min-h-[100px] resize-y ${className}`}
    {...props}
  />
);

// --- LABEL ---
export const Label: React.FC<{ children: ReactNode; className?: string }> = ({ children, className = '' }) => (
  <label className={`block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 ${className}`}>
    {children}
  </label>
);

// --- BADGE ---
export const Badge: React.FC<{ children: ReactNode; color?: 'indigo' | 'green' | 'purple' | 'zinc' }> = ({ children, color = 'zinc' }) => {
  const colors = {
    indigo: "bg-indigo-900/30 text-indigo-400 border-indigo-800",
    green: "bg-green-900/30 text-green-400 border-green-800",
    purple: "bg-purple-900/30 text-purple-400 border-purple-800",
    zinc: "bg-zinc-800 text-zinc-400 border-zinc-700"
  };
  return (
    <span className={`px-2.5 py-0.5 rounded text-xs font-medium border ${colors[color]}`}>
      {children}
    </span>
  );
};

// --- MODAL ---
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children?: ReactNode;
}
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h3 className="font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- VISUAL SELECT (COMPACT GRID 3-COLS) ---
interface VisualOption {
  id: string;
  label: string;
  icon?: React.ElementType;
  description?: string;
}

interface VisualSelectProps {
  options: VisualOption[];
  value: string;
  onChange: (val: string) => void;
}

export const VisualSelect: React.FC<VisualSelectProps> = ({ options, value, onChange }) => {
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((opt) => {
        const isSelected = value === opt.id;
        const Icon = opt.icon;
        return (
          <button
            type="button"
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all group text-center min-h-[90px] ${
              isSelected 
                ? 'bg-indigo-600/10 border-indigo-500 text-white shadow-inner shadow-indigo-500/10' 
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-800'
            }`}
            title={opt.description} 
          >
            {/* Icon Container */}
            {Icon && (
              <div className={`mb-2 p-1.5 rounded-md shrink-0 ${
                isSelected ? 'bg-indigo-500/20 text-indigo-400' : 'bg-zinc-800 text-zinc-500 group-hover:text-zinc-300'
              }`}>
                <Icon size={18} />
              </div>
            )}
            
            {/* Text Content */}
            <span className={`block text-[11px] font-bold leading-tight w-full truncate px-1 ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
              {opt.label}
            </span>

            {/* Selection Indicator (Small check top right) */}
            {isSelected && (
              <div className="absolute top-1.5 right-1.5 text-indigo-500">
                <Check size={12} strokeWidth={3} />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};
