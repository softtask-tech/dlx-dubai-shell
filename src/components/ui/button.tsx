import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 outline-none focus-visible:ring-1 focus-visible:ring-ring",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-accent",
        destructive: "bg-destructive text-destructive-foreground hover:opacity-90",
        outline:
          "border border-foreground/20 text-foreground hover:border-foreground hover:bg-foreground hover:text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-accent-soft",
        ghost: "text-foreground hover:text-accent",
        link: "text-foreground underline-offset-4 hover:underline",
        /* --- DLX editorial variants --- */
        editorial:
          "border border-foreground/20 text-foreground font-sans text-[0.6875rem] uppercase tracking-[0.24em] hover:border-foreground hover:bg-foreground hover:text-primary-foreground",
        accent:
          "bg-accent text-accent-foreground font-sans text-[0.6875rem] uppercase tracking-[0.24em] hover:bg-foreground",
        quiet:
          "border-b border-foreground/25 pb-2 font-sans text-[0.6875rem] uppercase tracking-[0.24em] text-foreground hover:border-accent hover:text-accent",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 px-4",
        lg: "h-14 px-11",
        md: "h-12 px-8",
        icon: "size-10",
        none: "p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
