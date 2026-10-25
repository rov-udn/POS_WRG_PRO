import { cva } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Helper utility untuk penggabungan class Tailwind yang aman
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const buttonVariants = cva(
  "rounded-lg font-medium transition-colors inline-flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800",
        danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
        ghost: "bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200",
        success: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:bg-emerald-200",
        warning: "bg-amber-50 text-amber-700 hover:bg-amber-100 active:bg-amber-200",
        info: "bg-blue-50 text-blue-700 hover:bg-blue-100 active:bg-blue-200",
      },
      size: {
        xs: "text-xs px-2.5 py-1.5",
        sm: "text-sm px-3 py-1.5",
        md: "text-base px-4 py-2", // Perbaikan: text-md diganti ke text-base
        lg: "text-lg px-6 py-3",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

function Button({ children, variant, size, className, type = "button", ...props }) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
export { buttonVariants };