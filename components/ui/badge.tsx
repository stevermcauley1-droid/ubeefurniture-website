import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "outline";

const badgeBase =
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide transition-colors";

const badgeVariants: Record<BadgeVariant, string> = {
  default: "border-transparent bg-primary text-primary-foreground",
  secondary: "border-transparent bg-secondary text-secondary-foreground",
  outline: "border-zinc-200 bg-white text-zinc-700",
};

function Badge({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & { variant?: BadgeVariant }) {
  return <div className={cn(badgeBase, badgeVariants[variant], className)} {...props} />;
}

export { Badge };
