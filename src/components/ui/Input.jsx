function Input ({label, placeholder, type = "text", value, onChange, ...props }) {
    return(
        <div className="space-y-2">
            {label && (
                <label className="block bg-white text-sm font-medium">
                    {label}
                </label>
            )}

            <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            className="w-full rounded-lg bg-white-100 border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
            {...props}/>
        </div>
    )
}

export default Input