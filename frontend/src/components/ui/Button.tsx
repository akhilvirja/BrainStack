import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      icon,
      iconPosition = "left",
      fullWidth = false,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = "inline-flex items-center justify-center font-headline font-semibold transition-all duration-200 focus:outline-none";
    
    const variants = {
      primary: "bg-sage-dark text-white hover:bg-sage shadow-sm hover:shadow-md hover:-translate-y-0.5",
      secondary: "bg-surface-container-low border border-stone-border text-charcoal hover:bg-surface-container shadow-xs",
      outline: "bg-transparent border border-outline-variant/60 text-charcoal hover:bg-surface-container-low",
      ghost: "bg-transparent text-on-surface-variant hover:text-charcoal hover:bg-surface-container-low",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
      md: "px-4 py-2 text-sm rounded-xl gap-2",
      lg: "px-6 py-3.5 text-sm rounded-xl gap-2",
    };

    const widthClass = fullWidth ? "w-full" : "";
    const variantClass = variants[variant] || variants.primary;
    const sizeClass = sizes[size] || sizes.md;

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantClass} ${sizeClass} ${widthClass} ${className}`}
        {...props}
      >
        {icon && iconPosition === "left" && icon}
        {children && <span>{children}</span>}
        {icon && iconPosition === "right" && icon}
      </button>
    );
  }
);

Button.displayName = "Button";
