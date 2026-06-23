import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const loaderVariants = cva(
  "animate-spin rounded-full border-2 border-primary/20 border-t-primary",
  {
    variants: {
      size: {
        sm: "h-5 w-5 border-[1.5px]",
        md: "h-8 w-8",
        lg: "h-12 w-12 border-[3px]",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

type CircularLoaderProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof loaderVariants> & {
    label?: string;
  };

function CircularLoader({ className, size, label, ...props }: CircularLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label ?? "Loading"}
      className={cn("flex flex-col items-center justify-center gap-3", className)}
      {...props}
    >
      <div className={loaderVariants({ size })} />
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  );
}

export { CircularLoader, loaderVariants };
