export function Field({ label, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}

export function TextInput({ className = '', ...props }) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${className}`}
    />
  );
}

export function Textarea(props) {
  return (
    <textarea
      {...props}
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    />
  );
}

export function Select({ children, ...props }) {
  return (
    <select
      {...props}
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    >
      {children}
    </select>
  );
}

export function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-3">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <input
        type="checkbox"
        checked={Boolean(checked)}
        onChange={onChange}
        className="h-4 w-4 accent-blue-600"
      />
    </label>
  );
}

export function SectionCard({ title, children }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <h3 className="mb-4 text-base font-semibold text-gray-800">{title}</h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
