import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-3 whitespace-nowrap font-sans text-[0.6875rem] uppercase tracking-[0.24em] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        solid: "bg-primary text-primary-foreground hover:bg-accent",
        outline:
          "border border-foreground/20 text-foreground hover:border-foreground hover:bg-foreground hover:text-primary-foreground",
        accent: "bg-accent text-accent-foreground hover:bg-foreground",
        ghost: "text-foreground hover:text-accent",
        quiet:
          "border-b border-foreground/25 pb-2 text-foreground hover:border-accent hover:text-accent",
      },
      size: {
        sm: "h-9 px-5",
        md: "h-12 px-8",
        lg: "h-14 px-11",
        none: "p-0",
      },
    },
    defaultVariants: { variant: "outline", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";

export { buttonVariants };
