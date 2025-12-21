
import React from 'react';

export interface ToastData {
    id: number;
    title: string;
    description: string;
    icon: React.ReactElement;
}

interface ToastProps {
    toast: ToastData;
    onDismiss: (id: number) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
    return (
        <div 
            onClick={() => onDismiss(toast.id)}
            className="w-full max-w-sm glass rounded-xl shadow-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden p-4 animate-in slide-in-from-bottom-5 duration-500"
        >
            <div className="flex items-start">
                <div className="flex-shrink-0 text-2xl">
                    {toast.icon}
                </div>
                <div className="ml-3 w-0 flex-1">
                    <p className="text-sm font-bold text-slate-100">{toast.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{toast.description}</p>
                </div>
                 <div className="ml-4 flex-shrink-0 flex">
                    <button onClick={() => onDismiss(toast.id)} className="inline-flex text-slate-400 hover:text-slate-100">
                        <span className="sr-only">Close</span>
                        &times;
                    </button>
                </div>
            </div>
        </div>
    );
};
