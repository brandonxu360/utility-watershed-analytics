import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Login from "../pages/Login";

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal();
  return Object.assign({}, actual, {
    Link: ({
      children,
      to,
      ...props
    }: {
      children: React.ReactNode;
      to: string;
      [key: string]: unknown;
    }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  });
});

describe("Login Component", () => {
  describe("rendering", () => {
    it("renders without crashing", () => {
      render(<Login />);
    });

    it("displays the correct heading", () => {
      const { getByText } = render(<Login />);
      expect(getByText("Welcome Back!")).toBeInTheDocument();
    });

    it("has username and password input fields", () => {
      const { getByLabelText } = render(<Login />);
      expect(getByLabelText("Username")).toBeInTheDocument();
      expect(getByLabelText("Password")).toBeInTheDocument();
    });

    it("has a submit button", () => {
      const { getByRole } = render(<Login />);
      expect(getByRole("button", { name: /log in/i })).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("calls onSubmit with username and password when form is submitted", () => {
      const mockOnSubmit = vi.fn();
      const { getByLabelText, getByRole } = render(
        <Login onSubmit={mockOnSubmit} />,
      );

      const usernameInput = getByLabelText("Username") as HTMLInputElement;
      const passwordInput = getByLabelText("Password") as HTMLInputElement;
      const submitButton = getByRole("button", { name: /log in/i });

      // Simulate user input
      fireEvent.change(usernameInput, { target: { value: "testuser" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });

      // Simulate form submission
      fireEvent.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith({
        username: "testuser",
        password: "password123",
      });
    });

    it("toggles password visibility when the toggle button is clicked", () => {
      const { getByLabelText, getByRole } = render(<Login />);

      const passwordInput = getByLabelText("Password") as HTMLInputElement;
      const toggleButton = getByRole("button", { name: /show password/i });

      // Initially, password should be hidden
      expect(passwordInput.type).toBe("password");

      // Click to show password
      fireEvent.click(toggleButton);
      expect(passwordInput.type).toBe("text");

      // Click again to hide password
      fireEvent.click(toggleButton);
      expect(passwordInput.type).toBe("password");
    });
  });
});
