import { render, fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Register from "../pages/Register";

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

describe("Register Component", () => {
  describe("rendering", () => {
    it("renders without crashing", () => {
      render(<Register />);
    });

    it("displays the correct heading", () => {
      const { getByText } = render(<Register />);
      expect(getByText("Create an account!")).toBeInTheDocument();
    });

    it("has username, password, and confirm password input fields", () => {
      const { getByLabelText } = render(<Register />);
      expect(getByLabelText("Username")).toBeInTheDocument();
      expect(getByLabelText("Password")).toBeInTheDocument();
      expect(getByLabelText("Confirm Password")).toBeInTheDocument();
    });

    it("has a submit button", () => {
      const { getByRole } = render(<Register />);
      expect(getByRole("button", { name: /Sign Up/i })).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("calls onSubmit with username, password, and confirmPassword when form is submitted", () => {
      const mockOnSubmit = vi.fn();
      const { getByLabelText, getByRole } = render(
        <Register onSubmit={mockOnSubmit} />,
      );

      const usernameInput = getByLabelText("Username") as HTMLInputElement;
      const passwordInput = getByLabelText("Password") as HTMLInputElement;
      const confirmPasswordInput = getByLabelText(
        "Confirm Password",
      ) as HTMLInputElement;
      const submitButton = getByRole("button", { name: /Sign Up/i });

      // Simulate user input
      fireEvent.change(usernameInput, { target: { value: "testuser" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "password123" },
      });

      // Simulate form submission
      fireEvent.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith({
        username: "testuser",
        password: "password123",
        confirmPassword: "password123",
      });
    });

    it("toggles password visibility when the toggle button is clicked", () => {
      const { getByLabelText, getByRole } = render(<Register />);

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

    it("toggles confirm password visibility and updates accessibility attributes", () => {
      render(<Register />);

      const confirmInput = screen.getByLabelText(
        "Confirm Password",
      ) as HTMLInputElement;

      // Initially hidden
      expect(confirmInput.type).toBe("password");
      const showButton = screen.getByRole("button", {
        name: /show confirm password/i,
      });
      expect(showButton).toHaveAttribute("title", "Show confirm password");
      expect(showButton).toHaveAttribute("aria-pressed", "false");

      // Toggle to visible
      fireEvent.click(showButton);
      expect(confirmInput.type).toBe("text");

      const hideButton = screen.getByRole("button", {
        name: /hide confirm password/i,
      });
      expect(hideButton).toHaveAttribute("title", "Hide confirm password");
      expect(hideButton).toHaveAttribute("aria-pressed", "true");

      // Toggle back to hidden
      fireEvent.click(hideButton);
      expect(confirmInput.type).toBe("password");
      expect(
        screen.getByRole("button", { name: /show confirm password/i }),
      ).toBeInTheDocument();
    });
  });
});
