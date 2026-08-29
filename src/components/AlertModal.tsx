import React from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

interface AlertModalProps {
  isOpen: boolean;
  type?: "info" | "warning" | "success" | "confirm";
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  type = "warning",
  title,
  message,
  confirmText = "확인",
  cancelText = "취소",
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-3 mx-auto" />;
      case "confirm":
        return <AlertCircle className="w-10 h-10 text-sky-500 mb-3 mx-auto" />;
      case "info":
        return <Info className="w-10 h-10 text-sky-500 mb-3 mx-auto" />;
      default:
        return <AlertCircle className="w-10 h-10 text-amber-500 mb-3 mx-auto" />;
    }
  };

  return (
    <div
      id="custom-alert-backdrop"
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 transition-opacity animate-in fade-in duration-200"
    >
      <div
        id="custom-alert-box"
        className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full text-center border border-slate-100 transform transition-all scale-100"
      >
        {getIcon()}
        {title && <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>}
        <p className="text-slate-600 font-medium mb-6 text-sm leading-relaxed whitespace-pre-line">
          {message}
        </p>

        <div className="flex gap-2">
          {onCancel && (
            <button
              id="alert-cancel-btn"
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition active:scale-95 text-sm"
            >
              {cancelText}
            </button>
          )}
          <button
            id="alert-confirm-btn"
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-sm transition active:scale-95 text-sm"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
