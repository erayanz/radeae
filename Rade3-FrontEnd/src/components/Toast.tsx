import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface ToastProps {
  message: ToastMessage;
  onClose: (id: string) => void;
}

const Toast = ({ message, onClose }: ToastProps) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onClose(message.id), 300);
    }, message.duration || 3000);

    return () => clearTimeout(timer);
  }, [message, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />
  };

  const colors = {
    success: 'bg-green-600 border-green-500',
    error: 'bg-red-600 border-red-500',
    warning: 'bg-yellow-600 border-yellow-500',
    info: 'bg-blue-600 border-blue-500'
  };

  return (
    <div
      className={`
        ${colors[message.type]} 
        border-r-4 rounded-lg shadow-lg p-4 mb-3 
        flex items-center gap-3 min-w-[300px] max-w-md
        transition-all duration-300 backdrop-blur-sm
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
      `}
    >
      <div className="text-white">{icons[message.type]}</div>
      <p className="text-white flex-1 font-medium">{message.message}</p>
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(() => onClose(message.id), 300);
        }}
        className="text-white hover:text-gray-200 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

export const ToastContainer = ({ toasts, onClose }: { toasts: ToastMessage[], onClose: (id: string) => void }) => {
  return (
    <div className="fixed top-6 left-6 z-50 space-y-3">
      {toasts.map(toast => (
        <Toast key={toast.id} message={toast} onClose={onClose} />
      ))}
    </div>
  );
};
