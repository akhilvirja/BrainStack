import React from "react";

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: "sage" | "stone" | "lavender" | "peach";
  interactive?: boolean;
}

export const Tag = React.forwardRef<HTMLSpanElement, TagProps>(
  ({ className = "", variant = "sage", interactive = false, children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-transparent transition-colors";
    
    const variants = {
      sage: "bg-sage-light text-sage-dark hover:border-sage/30 hover:bg-sage/20",
      stone: "bg-surface-container text-on-surface-variant hover:border-stone-border hover:bg-surface-container-high hover:text-charcoal",
      lavender: "bg-[#e8e5f5] text-[#4e4866] hover:bg-[#d8d5e5]",
      peach: "bg-[#fef6e4] text-[#695725] hover:bg-[#eee6d4]",
    };

    const variantClass = variants[variant] || variants.sage;
    const interactiveClass = interactive ? "cursor-pointer" : "cursor-default";

    return (
      <span ref={ref} className={`${baseStyles} ${variantClass} ${interactiveClass} ${className}`} {...props}>
        {children}
      </span>
    );
  }
);

Tag.displayName = "Tag";
