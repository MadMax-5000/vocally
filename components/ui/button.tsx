import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-ink text-canvas hover:bg-ink/90",
        primary: "bg-primary text-white hover:bg-primary/90 active:bg-primary-active",
        secondary: "bg-surface-strong text-ink hover:bg-surface-strong/80",
        outline: "border border-hairline-strong bg-transparent text-ink hover:border-secondary hover:bg-secondary/20",
        ghost: "bg-transparent text-ink hover:bg-surface-strong",
        destructive: "bg-semantic-error/10 text-semantic-error hover:bg-semantic-error/20",
        link: "text-ink underline-offset-4 hover:underline",
        icon: "bg-transparent text-ink hover:bg-surface-strong rounded-md",
      },
      size: {
        default: "h-8 px-3 py-1 text-button",
        xs: "h-7 px-2.5 text-body-sm gap-1.5",
        sm: "h-7 px-3 text-body-sm",
        lg: "h-10 px-5 text-button",
        icon: "h-8 w-8",
        "icon-sm": "h-7 w-7",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
