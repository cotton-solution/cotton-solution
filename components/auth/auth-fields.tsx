"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Shared auth form primitives built on top of the existing ui/* components.
 * These only add presentation (48px height, 10px radius, focus rings,
 * error states) — no validation, no auth logic.
 */

const fieldBase =
  "h-12 rounded-[10px] px-3.5 text-[15px] transition-colors duration-150 ease-out " +
  "border-slate-300 focus:border-green-600 focus:ring-4 focus:ring-green-600/15";

const fieldError =
  "border-red-600 focus:border-red-600 focus:ring-4 focus:ring-red-600/10";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  /** Optional element rendered on the right of the label row, e.g. a link. */
  labelAction?: ReactNode;
};

export const FormField = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, error, labelAction, id, className, ...props }, ref) => {
    const errorId = error && id ? `${id}-error` : undefined;

    return (
      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label
            htmlFor={id}
            className="mb-0 text-sm font-semibold text-slate-900"
          >
            {label}
          </Label>
          {labelAction}
        </div>
        <Input
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={errorId}
          className={cn(fieldBase, error && fieldError, className)}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1.5 text-xs font-medium text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);
FormField.displayName = "FormField";

export const PasswordField = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, error, labelAction, id, className, ...props }, ref) => {
    const errorId = error && id ? `${id}-error` : undefined;

    return (
      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label
            htmlFor={id}
            className="mb-0 text-sm font-semibold text-slate-900"
          >
            {label}
          </Label>
          {labelAction}
        </div>
        <PasswordInput
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={errorId}
          className={cn(fieldBase, error && fieldError, className)}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1.5 text-xs font-medium text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);
PasswordField.displayName = "PasswordField";

type PrimaryButtonProps = {
  children: ReactNode;
  loading?: boolean;
  loadingText?: string;
  className?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">;

export function PrimaryButton({
  children,
  loading = false,
  loadingText = "Signing in…",
  className,
  disabled,
  ...props
}: PrimaryButtonProps) {
  return (
    <Button
      disabled={disabled || loading}
      className={cn(
        "h-12 w-full gap-2 rounded-[10px] bg-green-800 text-[15px] font-semibold text-white",
        "transition-colors duration-150 ease-out hover:bg-green-900",
        "focus-visible:ring-4 focus-visible:ring-green-600/15",
        className
      )}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {loading ? loadingText : children}
    </Button>
  );
}

export function SecondaryButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Button
      type="button"
      variant="secondary"
      className={cn(
        "h-12 w-full rounded-[10px] border-slate-300 text-[15px] font-semibold text-green-800",
        "transition-colors duration-150 ease-out hover:border-green-600 hover:bg-green-50",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}
