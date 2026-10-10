import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", hoverable = false, children, ...props }, ref) => {
    const baseStyles = "bg-surface-container-lowest border border-warm-stone rounded-2xl p-5 md:p-6 flex flex-col gap-3";
    const hoverStyles = hoverable ? "shadow-sm hover:shadow-md hover:border-[#ccd4cf] transition-all duration-200 relative overflow-hidden group" : "shadow-sm";

    return (
      <div ref={ref} className={`${baseStyles} ${hoverStyles} ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <div ref={ref} className={`flex items-center justify-between ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <h4 ref={ref} className={`font-headline text-base font-semibold text-charcoal tracking-tight ${className}`} {...props}>
        {children}
      </h4>
    );
  }
);

CardTitle.displayName = "CardTitle";
