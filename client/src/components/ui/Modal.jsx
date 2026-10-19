import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/40 backdrop-blur-[2px] transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog Content */}
      <div
        className={`relative w-full ${maxWidth} bg-white border-2 border-ink rounded-2xl shadow-2xl p-6 z-10 animate-in zoom-in-95 duration-150 overflow-hidden max-h-[90vh] flex flex-col`}
      >
        <div className="flex items-start justify-between pb-4 border-b border-ink/10">
          <div>
            <h3 className="text-xl font-bold text-ink tracking-tight">{title}</h3>
            {subtitle && (
              <p className="text-xs text-ink-muted mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-ink-muted hover:text-ink hover:bg-black/5 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        <div className="pt-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
