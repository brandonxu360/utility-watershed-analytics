import React, { useState, FormEvent } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa6";
import { Link } from "@tanstack/react-router";
import "../Authentication.css";

type HiddenState = {
  password: boolean;
  confirm: boolean;
};

export interface RegisterProps {
  onSubmit?: (payload: {
    username: string;
    password: string;
    confirmPassword: string;
  }) => void;
}

const Register: React.FC<RegisterProps> = ({ onSubmit }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [hidden, setHidden] = useState<HiddenState>({
    password: true,
    confirm: true,
  });

  const toggleHidden = (field: keyof HiddenState) => {
    setHidden((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // TODO
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const payload = { username, password, confirmPassword };
    if (onSubmit) onSubmit(payload);
  };

  return (
    <div className="auth-page">
      <main className="form-container">
        <form className="auth-card" onSubmit={handleSubmit} noValidate>
          <h1 className="auth-title">Create an account!</h1>
          <div className="auth-subtitle">Please enter your details</div>

          <label className="form-label" htmlFor="reg-username">
            Username
          </label>
          <input
            id="reg-username"
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />

          <label className="form-label" htmlFor="reg-password">
            Password
          </label>
          <div className="password-wrapper" style={{marginBottom: "20px"}}>
            <input
              id="reg-password"
              className="input"
              type={hidden.password ? "password" : "text"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              className="eye-button"
              onClick={() => toggleHidden("password")}
              aria-label={hidden.password ? "Show password" : "Hide password"}
              title={hidden.password ? "Show password" : "Hide password"}
              aria-pressed={!hidden.password}
            >
              {hidden.password ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <label className="form-label" htmlFor="reg-confirm">
            Confirm Password
          </label>
          <div className="password-wrapper" style={{marginBottom: "30px"}}>
            <input
              id="reg-confirm"
              className="input"
              type={hidden.confirm ? "password" : "text"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              className="eye-button"
              onClick={() => toggleHidden("confirm")}
              aria-label={hidden.confirm ? "Show confirm password" : "Hide confirm password"}
              title={hidden.confirm ? "Show confirm password" : "Hide confirm password"}
              aria-pressed={!hidden.confirm}
            >
              {hidden.confirm ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <button type="submit" className="primary-btn">
            Sign Up
          </button>

          <div className="auth-footer">
            <span>Already have an account? </span>
            {/* likely should navigate to '/login' */}
            <Link to="/login" className="link-button">Login</Link>
          </div>
        </form>
      </main>
    </div>
  );
};

export default Register;
