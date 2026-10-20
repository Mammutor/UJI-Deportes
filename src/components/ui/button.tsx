import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative isolate inline-flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-full text-sm font-medium tracking-wide transition-[box-shadow,background-color] duration-200 ease-[cubic-bezier(0.2,0,0,1)] before:absolute before:inset-0 before:-z-10 before:bg-current before:opacity-0 before:transition-opacity hover:before:opacity-[0.08] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--md-primary)] active:before:opacity-[0.12] disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[color:var(--md-primary)] text-white shadow-[var(--md-elevation-1)] hover:shadow-[var(--md-elevation-2)]",
        secondary:
          "bg-[color:var(--md-primary-container)] text-[color:var(--md-on-primary-container)] hover:shadow-[var(--md-elevation-1)]",
        outline:
          "border border-[color:var(--md-outline)] bg-white text-[color:var(--md-primary)] hover:bg-[color:var(--md-surface-high)]",
        ghost: "text-inherit",
        destructive:
          "bg-[color:var(--md-error)] text-white shadow-[var(--md-elevation-1)] hover:shadow-[var(--md-elevation-2)]",
      },
      size: {
        default: "h-10 px-6",
        sm: "h-8 px-4 text-[0.8125rem]",
        lg: "h-12 px-8 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
