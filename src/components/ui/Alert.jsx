import { cva } from "class-variance-authority";

const alertVariants = cva(
    "relative flex items-center justify-between gap-3 p-4 rounded-xl border text-sm font-medium transition-all shadow-sm",
    {
        variants: {
            variant: {
                success: "bg-green-50 text-green-800 border-green-200",
                warning: "bg-yellow-50 text-yellow-800 border-yellow-200",
                danger: "bg-red-50 text-red-800 border-red-200",
                info: "bg-blue-50 text-blue-800 border-blue-200"
            },
        },
        defaultVariants: {
            variant: "info",
        },
    }
);

// Map Ikon bawaan sesuai varian
const ALERT_ICONS = {
  success: "✅",
  warning: "⚠️",
  danger: "❌",
  info: "ℹ️",
};

export function Alert({ variant = "info", children, onClose }) {
    return (
        <div className={alertVariants({ variant })}>
            <div className="flex items-center gap-2.5">
                <span className="text-base select-none">{ALERT_ICONS[variant]}</span>
                <div>{children}</div>
            </div>

            {onClose && (
                <button
                    onClick={onClose}
                    className="ml-auto flex h-6 items-center justify-between justify-center rounded-lg text-gray-500 hover:bg-black/5 hover:gray-800 transition-colors"
                    aria-label="Tutup alert"
                >
                    X
                </button>
            )}
        </div>
    );
}