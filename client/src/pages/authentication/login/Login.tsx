import React, { useState, FormEvent } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa6";
import { Link } from "@tanstack/react-router";
import "../Authentication.css";

export interface LoginProps {
  onSubmit?: (payload: { username: string; password: string }) => void;
  onSwitchToRegister?: () => void;
  forgotPasswordUrl?: string;
}

const Login: React.FC<LoginProps> = ({
  onSubmit,
  forgotPasswordUrl,
}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isHidden, setIsHidden] = useState<boolean>(true);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const payload = { username, password };
    if (onSubmit) onSubmit(payload);
  };

  const toggleHidden = () => {
    setIsHidden((prev) => !prev);
  };

  return (
    <div className="auth-page">
      <main className="form-container">
        <form className="auth-card" onSubmit={handleSubmit} noValidate>
          <h1 className="auth-title">Welcome Back!</h1>
          <div className="auth-subtitle">Please enter your details</div>

          <label className="form-label" htmlFor="login-username">
            Username
          </label>
          <input
            id="login-username"
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            placeholder=""
            required
          />

          <label className="form-label" htmlFor="login-password">
            Password
          </label>

          <div className="password-wrapper">
            <input
              id="login-password"
              className="input"
              type={isHidden ? "password" : "text"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder=""
              required
            />
            <button
              type="button"
              className="eye-button"
              onClick={toggleHidden}
              aria-label={isHidden ? "Show password" : "Hide password"}
              title={isHidden ? "Show password" : "Hide password"}
            >              
              {isHidden ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <div className="forgot-row">
            {forgotPasswordUrl ? (
              <a href={forgotPasswordUrl} className="forgot-link">
                Forgot password?
              </a>
            ) : (
              <span className="forgot-link">Forgot password?</span>
            )}
          </div>

          <button type="submit" className="primary-btn">
            Log In
          </button>

          <div className="auth-footer">
            <span>Don't have an account? </span>
            <Link to="/register" className="link-button">Register</Link>
          </div>
        </form>
      </main>
    </div>
  );
};

export default Login;
