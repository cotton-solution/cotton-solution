"use client";

import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export const PasswordInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        ref={ref}
        type={visible ? "text" : "password"}
        className={cn(
          "w-full h-10 sm:h-11 rounded-lg border border-slate-300 bg-white pl-3 pr-10 text-sm text-slate-900 placeholder:text-slate-400",
          "focus:border-brand-600 focus:ring-1 focus:ring-brand-600",
          "disabled:bg-slate-50 disabled:text-slate-400",
          className
        )}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-0 top-0 h-full w-10 flex items-center justify-center text-slate-400 hover:text-slate-600"
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
});
PasswordInput.displayName = "PasswordInput";
