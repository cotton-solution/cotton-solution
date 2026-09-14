"use client";

import {
  forwardRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import { cn } from "@/lib/utils";

/** Text/email input with a floating label row and inline error message. */
export const FormField = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    error?: string;
    icon?: ReactNode;
    rightSlot?: ReactNode;
  }
>(({ label, error, icon, rightSlot, id, className, ...props }, ref) => {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label
          htmlFor={id}
          className="text-sm font-semibold text-[var(--auth-text-primary)]"
        >
          {label}
        </label>
        {rightSlot}
      </div>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--auth-text-disabled)]">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "h-12 w-full rounded-[10px] border bg-[var(--auth-surface)] text-[15px] text-[var(--auth-text-primary)] placeholder:text-[var(--auth-text-disabled)]",
            "border-[var(--auth-border-strong)] px-3.5 transition-colors duration-150",
            "focus:border-[var(--auth-primary-600)] focus:outline-none focus:ring-4 focus:ring-[var(--auth-primary-600)]/15",
            "disabled:bg-[var(--auth-surface-soft)] disabled:text-[var(--auth-text-disabled)]",
            icon && "pl-10",
            error &&
              "border-[var(--auth-error)] focus:border-[var(--auth-error)] focus:ring-[var(--auth-error)]/10",
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />
      </div>
      {error && (
        <p
          id={`${id}-error`}
          className="mt-1.5 text-xs font-medium text-[var(--auth-error)]"
        >
          {error}
        </p>
      )}
    </div>
  );
});
FormField.displayName = "FormField";

/** Password input with a lock icon, show/hide toggle, and an optional
 *  top-right slot (e.g. "Forgot password?"). */
export const PasswordField = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    error?: string;
    rightSlot?: ReactNode;
  }
>(({ label, error, rightSlot, id, className, ...props }, ref) => {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label
          htmlFor={id}
          className="text-sm font-semibold text-[var(--auth-text-primary)]"
        >
          {label}
        </label>
        {rightSlot}
      </div>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--auth-text-disabled)]">
          <LockKeyhole size={18} />
        </span>
        <input
          ref={ref}
          id={id}
          type={visible ? "text" : "password"}
          className={cn(
            "h-12 w-full rounded-[10px] border bg-[var(--auth-surface)] pl-10 pr-11 text-[15px] text-[var(--auth-text-primary)] placeholder:text-[var(--auth-text-disabled)]",
            "border-[var(--auth-border-strong)] transition-colors duration-150",
            "focus:border-[var(--auth-primary-600)] focus:outline-none focus:ring-4 focus:ring-[var(--auth-primary-600)]/15",
            "disabled:bg-[var(--auth-surface-soft)] disabled:text-[var(--auth-text-disabled)]",
            error &&
              "border-[var(--auth-error)] focus:border-[var(--auth-error)] focus:ring-[var(--auth-error)]/10",
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          tabIndex={-1}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-0 top-0 flex h-full w-11 items-center justify-center text-[var(--auth-text-disabled)] transition-colors duration-150 hover:text-[var(--auth-text-secondary)]"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && (
        <p
          id={`${id}-error`}
          className="mt-1.5 text-xs font-medium text-[var(--auth-error)]"
        >
          {error}
        </p>
      )}
    </div>
  );
});
PasswordField.displayName = "PasswordField";

/** Full-width solid button with a built-in loading state. */
export function PrimaryButton({
  loading,
  loadingText = "Loading…",
  children,
  className,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingText?: string;
}) {
  return (
    <button
      className={cn(
        "flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[var(--auth-primary-800)] text-[15px] font-semibold text-white transition-colors duration-150",
        "hover:bg-[var(--auth-primary-900)] active:bg-[var(--auth-primary-900)]",
        "focus:outline-none focus:ring-4 focus:ring-[var(--auth-primary-600)]/15",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      disabled={loading || disabled}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {loading ? loadingText : children}
    </button>
  );
}

/** Full-width outlined button — visually secondary to PrimaryButton. */
export const SecondaryButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "flex h-12 w-full items-center justify-center gap-2 rounded-[10px] border bg-transparent text-[15px] font-semibold text-[var(--auth-primary-800)] transition-colors duration-150",
        "border-[var(--auth-border-strong)] hover:border-[var(--auth-primary-600)] hover:bg-[var(--auth-primary-50)]",
        "focus:outline-none focus:ring-4 focus:ring-[var(--auth-primary-600)]/15",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
SecondaryButton.displayName = "SecondaryButton";
