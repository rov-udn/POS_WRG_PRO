import { cva } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const cardVariants = cva(
  "rounded-xl border bg-white shadow-sm transition-all",
  {
    variants: {
      variant: {
        default: "border-slate-200 bg-white",
        muted: "border-slate-100 bg-slate-50",
        outline: "border-slate-300 bg-transparent",
      },
      padding: {
        none: "p-0",
        sm: "p-3",
        md: "p-4",
        lg: "p-6",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
    },
  }
);

export function Card({ children, variant, padding, className, ...props }) {
  return (
    <div className={cn(cardVariants({ variant, padding }), className)} {...props}>
      {children}
    </div>
  );
}

export default Card;
export { cardVariants };