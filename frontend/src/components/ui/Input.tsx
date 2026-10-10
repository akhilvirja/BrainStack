import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className = "", icon, label, error, hint, fullWidth = true, ...props },
    ref
  ) => {
    const widthClass = fullWidth ? "w-full" : "";
    
    return (
      <div className={`flex flex-col gap-1.5 ${widthClass}`}>
        {label && (
          <label className="font-headline text-xs font-semibold text-on-surface flex items-center justify-between">
            <span>{label}</span>
            {hint && <span className="text-[11px] text-outline font-normal">{hint}</span>}
          </label>
        )}
        
        <div className="relative flex items-center">
          {icon && (
            <span className="absolute left-3 flex items-center text-outline pointer-events-none">
              {icon}
            </span>
          )}
          
          <input
            ref={ref}
            className={`
              w-full py-2.5 rounded-xl bg-linen border text-charcoal placeholder:text-outline/70 font-body text-sm transition-all
              focus:bg-white focus:outline-none focus:ring-2 focus:ring-sage/20
              ${icon ? "pl-10 pr-4" : "px-4"}
              ${error 
                ? "border-error focus:border-error" 
                : "border-stone-border focus:border-sage"}
              ${className}
            `}
            {...props}
          />
        </div>
        
        {error && (
          <span className="text-xs text-error font-medium">{error}</span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
