import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
type ButtonSize = "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg";

const baseClasses =
  "group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg border border-transparent text-sm font-medium transition-all outline-none disabled:pointer-events-none disabled:opacity-50";

const variantClasses: Record<ButtonVariant, string> = {
  default: "bg-primary text-primary-foreground hover:opacity-95",
  outline: "border-border bg-background hover:bg-muted hover:text-foreground",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  ghost: "hover:bg-muted hover:text-foreground",
  destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20",
  link: "text-primary underline-offset-4 hover:underline",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-8 gap-1.5 px-2.5",
  xs: "h-6 gap-1 px-2 text-xs",
  sm: "h-7 gap-1 px-2.5 text-[0.8rem]",
  lg: "h-9 gap-1.5 px-2.5",
  icon: "size-8",
  "icon-xs": "size-6",
  "icon-sm": "size-7",
  "icon-lg": "size-9",
};

type ButtonProps = React.ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
};

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  children,
  ...props
}: ButtonProps) {
  const resolvedClassName = cn(baseClasses, variantClasses[variant], sizeClasses[size], className);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ className?: string }>, {
      className: cn((children as React.ReactElement<{ className?: string }>).props.className, resolvedClassName),
    });
  }

  return (
    <button className={resolvedClassName} {...props}>
      {children}
    </button>
  );
}

export { Button };
