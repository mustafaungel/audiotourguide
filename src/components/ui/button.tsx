import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 touch-manipulation",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-[hsl(var(--primary-hover))] shadow-glow hover:shadow-[var(--shadow-interactive)] transform hover:scale-[1.02]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-[var(--shadow-interactive)]",
        outline: "border border-border bg-card/50 backdrop-blur-sm text-foreground hover:bg-card hover:border-primary/50 hover:shadow-[var(--shadow-card)]",
        secondary: "bg-secondary text-secondary-foreground hover:bg-[hsl(var(--secondary-hover))] hover:shadow-[var(--shadow-card)]",
        ghost: "hover:bg-muted hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        hero: "bg-gradient-primary text-primary-foreground hover:shadow-glow transform hover:scale-105 transition-bounce",
        audio: "bg-gradient-accent text-accent-foreground hover:shadow-accent-glow transform hover:scale-105 transition-bounce",
        glass: "bg-card/20 backdrop-blur-md border border-border/50 text-foreground hover:bg-card/30 hover:border-primary/50 hover:shadow-[var(--shadow-card)]",
        success: "bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] hover:bg-[hsl(var(--success-hover))] hover:shadow-[var(--shadow-interactive)] transform hover:scale-[1.02]",
        warning: "bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))] hover:bg-[hsl(var(--warning-hover))] hover:shadow-[var(--shadow-interactive)] transform hover:scale-[1.02]",
        tourism: "bg-gradient-tourism text-primary-foreground hover:shadow-tourism transform hover:scale-105 transition-bounce",
        ocean: "bg-gradient-ocean text-accent-foreground hover:shadow-accent-glow transform hover:scale-105 transition-bounce",
        sunset: "bg-gradient-sunset text-primary-foreground hover:shadow-glow transform hover:scale-105 transition-bounce",
      },
      size: {
        default: "h-10 px-4 py-2 min-h-touch",
        sm: "h-9 rounded-md px-3 min-h-touch-sm mobile-text",
        lg: "h-11 rounded-md px-8 min-h-touch-lg mobile-text",
        icon: "touch-target",
        "icon-sm": "h-9 w-9 min-h-touch-sm min-w-touch-sm",
        "icon-lg": "h-12 w-12 min-h-touch-lg min-w-touch-lg",
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

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
