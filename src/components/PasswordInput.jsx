import { useState } from "react";

function PasswordInput({
  label,
  value,
  onChange,
  placeholder,
  name,
  autoComplete,
}) {
  const inputId = name || label?.toLowerCase().replaceAll(" ", "-");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <label className="passwordField passwordInputLabel" htmlFor={inputId}>
      {label}

      <div className="passwordRevealBox">
        <input
          id={inputId}
          name={name}
          type={showPassword ? "text" : "password"}
          value={value}
          autoComplete={autoComplete}
          placeholder={placeholder}
          onChange={onChange}
        />

        <button
          type="button"
          className="passwordRevealBtn"
          onClick={() => setShowPassword((current) => !current)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          title={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? "🙈" : "👁️"}
        </button>
      </div>
    </label>
  );
}

export default PasswordInput;