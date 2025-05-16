import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// Types for toast
export type ToastProps = {
  id?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive" | "success" | "warning" | "info";
};

type ToastContextType = {
  toasts: ToastProps[];
  addToast: (toast: ToastProps) => void;
  dismissToast: (id: string) => void;
};

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);

  const addToast = React.useCallback((toast: ToastProps) => {
    const id = toast.id || Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);

    // Auto-dismiss after 5 seconds if no action
    if (!toast.action) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    }
  }, []);

  const dismissToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, dismissToast }}>
      {children}
      <div className="fixed top-0 right-0 p-4 z-50 flex flex-col space-y-2 max-h-screen overflow-hidden">
        {toasts.map((toast) => (
          <Toast 
            key={toast.id} 
            toast={toast} 
            onDismiss={() => dismissToast(toast.id || '')} 
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const Toast = ({ 
  toast, 
  onDismiss 
}: { 
  toast: ToastProps; 
  onDismiss: () => void 
}) => {
  return (
    <div
      className={cn(
        "max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex items-center overflow-hidden border",
        {
          "border-red-500 bg-red-50": toast.variant === "destructive",
          "border-green-500 bg-green-50": toast.variant === "success",
          "border-yellow-500 bg-yellow-50": toast.variant === "warning",
          "border-blue-500 bg-blue-50": toast.variant === "info",
          "border-gray-200": toast.variant !== "destructive" && 
                               toast.variant !== "success" && 
                               toast.variant !== "warning" && 
                               toast.variant !== "info"
        }
      )}
    >
      <div className="flex-1 p-4">
        {toast.title && (
          <div className="font-semibold text-gray-900">{toast.title}</div>
        )}
        {toast.description && (
          <div className="mt-1 text-sm text-gray-700">{toast.description}</div>
        )}
        {toast.action}
      </div>
      <button
        onClick={onDismiss}
        className="flex items-center justify-center w-10 h-10 ml-auto text-gray-400 hover:text-gray-500"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

// Create a singleton instance of the toast context
let toastContext: ToastContextType | null = null;

// Initialize the toast context
const initializeToastContext = () => {
  if (!toastContext) {
    const toasts: ToastProps[] = [];
    const addToast = (toast: ToastProps) => {
      const id = toast.id || Math.random().toString(36).substring(2, 9);
      toasts.push({ ...toast, id });
      
      // Auto-dismiss after 5 seconds if no action
      if (!toast.action) {
        setTimeout(() => {
          const index = toasts.findIndex(t => t.id === id);
          if (index !== -1) {
            toasts.splice(index, 1);
          }
        }, 5000);
      }
    };
    
    const dismissToast = (id: string) => {
      const index = toasts.findIndex(t => t.id === id);
      if (index !== -1) {
        toasts.splice(index, 1);
      }
    };
    
    toastContext = { toasts, addToast, dismissToast };
  }
  return toastContext;
};

// Initialize the toast context
initializeToastContext();

// Create toast methods that don't use hooks
const createToast = () => {
  const toastMethods = {
    default: (props: ToastProps | string) => {
      const context = toastContext;
      if (!context) return;
      
      if (typeof props === "string") {
        context.addToast({ description: props, variant: "default" });
      } else {
        context.addToast({ ...props, variant: "default" });
      }
    },
    success: (props: ToastProps | string) => {
      const context = toastContext;
      if (!context) return;
      
      if (typeof props === "string") {
        context.addToast({ description: props, variant: "success" });
      } else {
        context.addToast({ ...props, variant: "success" });
      }
    },
    error: (props: ToastProps | string) => {
      const context = toastContext;
      if (!context) return;
      
      if (typeof props === "string") {
        context.addToast({ description: props, variant: "destructive" });
      } else {
        context.addToast({ ...props, variant: "destructive" });
      }
    },
    destructive: (props: ToastProps | string) => {
      const context = toastContext;
      if (!context) return;
      
      if (typeof props === "string") {
        context.addToast({ description: props, variant: "destructive" });
      } else {
        context.addToast({ ...props, variant: "destructive" });
      }
    },
    info: (props: ToastProps | string) => {
      const context = toastContext;
      if (!context) return;
      
      if (typeof props === "string") {
        context.addToast({ description: props, variant: "info" });
      } else {
        context.addToast({ ...props, variant: "info" });
      }
    },
    warning: (props: ToastProps | string) => {
      const context = toastContext;
      if (!context) return;
      
      if (typeof props === "string") {
        context.addToast({ description: props, variant: "warning" });
      } else {
        context.addToast({ ...props, variant: "warning" });
      }
    }
  };

  // Also allow direct callable function 
  return Object.assign(
    // Default function when toast() is called directly
    (props: ToastProps | string) => toastMethods.default(props),
    toastMethods
  );
};

export const toast = createToast();
