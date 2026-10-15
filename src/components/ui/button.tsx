import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const baseVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        secondary: "border border-border bg-card text-foreground hover:bg-muted",
        ghost: "text-foreground hover:bg-muted",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "min-h-9 px-3 text-sm",
        md: "px-5 text-base",
        lg: "min-h-13 px-7 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

/**
 * Shared with links styled as buttons: `<Link className={buttonVariants()} />`.
 * Extra classes are merged so they win over the defaults (e.g. `whitespace-normal`
 * lets a long label like a portal name wrap instead of spilling out of the button).
 */
export function buttonVariants(props: Parameters<typeof baseVariants>[0] = {}): string {
  const { className, ...rest } = props ?? {};
  return cn(baseVariants(rest), className);
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof baseVariants>;

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
