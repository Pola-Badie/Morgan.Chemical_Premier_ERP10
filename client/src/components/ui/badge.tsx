import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary bg-opacity-10 text-primary hover:bg-primary/80",
        secondary:
          "bg-secondary bg-opacity-10 text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "bg-destructive bg-opacity-10 text-destructive-foreground hover:bg-destructive/80",
        outline:
          "text-foreground border border-input hover:bg-accent hover:text-accent-foreground",
        success:
          "bg-green-100 text-green-700 hover:bg-green-200",
        warning:
          "bg-amber-100 text-amber-700 hover:bg-amber-200",
        danger:
          "bg-red-100 text-red-700 hover:bg-red-200",
        info:
          "bg-blue-100 text-blue-700 hover:bg-blue-200",
        purple:
          "bg-purple-100 text-purple-700 hover:bg-purple-200",
        teal:
          "bg-teal-100 text-teal-700 hover:bg-teal-200",
        orange:
          "bg-orange-100 text-orange-700 hover:bg-orange-200",
        darkorange:
          "bg-orange-200 text-orange-800 hover:bg-orange-300", 
        gray:
          "bg-slate-100 text-slate-700 hover:bg-slate-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
