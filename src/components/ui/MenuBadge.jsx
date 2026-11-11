export default function MenuBadge({ count, dot, label, compact = false }) {
  if (!count && !dot) return null;

  if (dot) {
    return (
      <span
        aria-label={label}
        title={label}
        className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"
      />
    );
  }

  return (
    <span
      aria-label={label}
      title={label}
      className={`absolute right-2 top-2 inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-5 text-white ring-2 ring-white ${
        compact ? 'min-w-4 px-1 text-[9px] leading-4' : ''
      }`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
