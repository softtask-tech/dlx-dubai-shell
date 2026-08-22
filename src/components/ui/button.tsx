import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-sans font-medium transition-all duration-base ease-editorial disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 outline-none focus-visible:ring-1 focus-visible:ring-ring",
  {
    variants: {
      variant: {
        /* --- The two the site actually uses --------------------------------
         * `primary` is the outlined editorial button: restraint reads as
         * confidence, so even the main call to action is a hairline and
         * letter-spaced caps until you hover it. `ghost` is its quiet twin. */
        primary:
          "eyebrow border border-foreground/20 text-foreground hover:border-foreground hover:bg-foreground hover:text-primary-foreground",
        ghost: "eyebrow text-foreground hover:text-accent",
        /** The one filled form. One per view, never two. */
        accent: "eyebrow bg-accent text-accent-foreground hover:bg-foreground",
        /** A rule under the label rather than a box around it. */
        quiet:
          "eyebrow border-b border-foreground/25 pb-2 text-foreground hover:border-accent hover:text-accent",

        /* --- Roles the shadcn primitives expect ---------------------------- */
        default: "bg-primary text-primary-foreground text-caption hover:bg-accent",
        destructive: "bg-destructive text-destructive-foreground text-caption hover:opacity-90",
        outline:
          "border border-foreground/20 text-foreground text-caption hover:border-foreground hover:bg-foreground hover:text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground text-caption hover:bg-accent-soft",
        link: "text-foreground text-caption underline-offset-4 hover:underline",
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
    defaultVariants: { variant: "primary", size: "md" },
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
