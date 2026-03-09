import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer select-none",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-[#2563EB] to-[#1D4ED8] text-white border border-[#1E40AF] hover:from-[#3B82F6] hover:to-[#2563EB] active:from-[#1D4ED8] active:to-[#1E40AF] active:translate-y-[1px]",
        destructive:
          "bg-gradient-to-b from-[#EF4444] to-[#DC2626] text-white border border-[#B91C1C] hover:from-[#F87171] hover:to-[#EF4444] active:from-[#DC2626] active:to-[#B91C1C] active:translate-y-[1px] focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "bg-gradient-to-b from-white to-[#F8FAFC] border border-[#E2E8F0] text-[#334155] hover:from-[#F8FAFC] hover:to-[#F1F5F9] hover:border-[#CBD5E1] active:from-[#F1F5F9] active:to-[#E2E8F0] active:translate-y-[1px] dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-gradient-to-b from-[#F1F5F9] to-[#E2E8F0] text-[#334155] border border-[#CBD5E1] hover:from-[#E2E8F0] hover:to-[#CBD5E1] active:translate-y-[1px]",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 active:bg-[#E2E8F0]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-lg px-6 has-[>svg]:px-4",
        icon: "size-9 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const shadowMap: Record<string, string> = {
  default: "var(--btn-shadow-primary)",
  destructive: "0 2px 4px rgba(220, 38, 38, 0.3), 0 4px 8px rgba(220, 38, 38, 0.15), inset 0 1px 0 rgba(255,255,255,0.15)",
  outline: "var(--btn-shadow)",
  secondary: "var(--btn-shadow)",
};

const activeShadow = "var(--btn-shadow-active)";

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
      asChild?: boolean;
    }
>(({ className, variant, size, asChild = false, style, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  const v = variant ?? "default";
  const shadow = shadowMap[v];

  return (
    <Comp
      ref={ref}
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      style={{
        boxShadow: shadow ?? undefined,
        ...style,
      }}
      onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => {
        if (shadow) {
          (e.currentTarget as HTMLElement).style.boxShadow = activeShadow;
        }
        props.onMouseDown?.(e);
      }}
      onMouseUp={(e: React.MouseEvent<HTMLButtonElement>) => {
        if (shadow) {
          (e.currentTarget as HTMLElement).style.boxShadow = shadow;
        }
        props.onMouseUp?.(e);
      }}
      onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
        if (shadow) {
          (e.currentTarget as HTMLElement).style.boxShadow = shadow;
        }
        props.onMouseLeave?.(e);
      }}
      {...props}
    />
  );
});

Button.displayName = "Button";

export { Button, buttonVariants };
