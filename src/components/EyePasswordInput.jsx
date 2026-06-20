import { useState } from "react";

function EyePasswordInput({
  label = "Password",
  value,
  onChange,
  placeholder = "Enter your password",
  name = "password",
  autoComplete = "current-password",
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <label className="eyePasswordField">
      {label}

      <div className="eyePasswordBox">
        <input
          name={name}
          type={showPassword ? "text" : "password"}
          value={value}
          autoComplete={autoComplete}
          placeholder={placeholder}
          onChange={onChange}
        />

        <button
          type="button"
          className="eyePasswordButton"
          onClick={() => setShowPassword((current) => !current)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          title={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 3L21 21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M10.6 10.6A2 2 0 0 0 13.4 13.4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M9.9 5.1A9.6 9.6 0 0 1 12 4.9C17.5 4.9 21 12 21 12A14.5 14.5 0 0 1 18.6 15.3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M6.5 6.5C4.2 8.1 3 12 3 12S6.5 19.1 12 19.1A9.7 9.7 0 0 0 16.1 18.2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
              <path
                d="M2.5 12S6 5 12 5S21.5 12 21.5 12S18 19 12 19S2.5 12 2.5 12Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <circle
                cx="12"
                cy="12"
                r="3"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          )}
        </button>
      </div>
    </label>
  );
}

export default EyePasswordInput;