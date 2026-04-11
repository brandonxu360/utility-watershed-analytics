import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Auth from "../pages/Auth";

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

describe("Auth — login mode", () => {
  describe("rendering", () => {
    it("renders without crashing", () => {
      render(<Auth mode="login" />);
    });

    it("displays the correct heading", () => {
      render(<Auth mode="login" />);
      expect(screen.getByText("Welcome Back!")).toBeInTheDocument();
    });

    it("has username and password fields", () => {
      render(<Auth mode="login" />);
      expect(screen.getByLabelText("Username")).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
    });

    it("does not show confirm password field", () => {
      render(<Auth mode="login" />);
      expect(
        screen.queryByLabelText("Confirm Password"),
      ).not.toBeInTheDocument();
    });

    it("has a Log In submit button", () => {
      render(<Auth mode="login" />);
      expect(
        screen.getByRole("button", { name: /log in/i }),
      ).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("calls onSubmit with username and password", () => {
      const mockOnSubmit = vi.fn();
      render(<Auth mode="login" onSubmit={mockOnSubmit} />);

      fireEvent.change(screen.getByLabelText("Username"), {
        target: { value: "testuser" },
      });
      fireEvent.change(screen.getByLabelText("Password"), {
        target: { value: "password123" },
      });
      fireEvent.click(screen.getByRole("button", { name: /log in/i }));

      expect(mockOnSubmit).toHaveBeenCalledWith({
        username: "testuser",
        password: "password123",
      });
    });

    it("toggles password visibility", () => {
      render(<Auth mode="login" />);
      const passwordInput = screen.getByLabelText(
        "Password",
      ) as HTMLInputElement;
      const toggleButton = screen.getByRole("button", {
        name: /show password/i,
      });

      expect(passwordInput.type).toBe("password");
      fireEvent.click(toggleButton);
      expect(passwordInput.type).toBe("text");
      fireEvent.click(screen.getByRole("button", { name: /hide password/i }));
      expect(passwordInput.type).toBe("password");
    });
  });
});

describe("Auth — register mode", () => {
  describe("rendering", () => {
    it("renders without crashing", () => {
      render(<Auth mode="register" />);
    });

    it("displays the correct heading", () => {
      render(<Auth mode="register" />);
      expect(screen.getByText("Create an account!")).toBeInTheDocument();
    });

    it("has username, password, and confirm password fields", () => {
      render(<Auth mode="register" />);
      expect(screen.getByLabelText("Username")).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
      expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
    });

    it("has a Sign Up submit button", () => {
      render(<Auth mode="register" />);
      expect(
        screen.getByRole("button", { name: /sign up/i }),
      ).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("calls onSubmit with username, password, and confirmPassword", () => {
      const mockOnSubmit = vi.fn();
      render(<Auth mode="register" onSubmit={mockOnSubmit} />);

      fireEvent.change(screen.getByLabelText("Username"), {
        target: { value: "testuser" },
      });
      fireEvent.change(screen.getByLabelText("Password"), {
        target: { value: "password123" },
      });
      fireEvent.change(screen.getByLabelText("Confirm Password"), {
        target: { value: "password123" },
      });
      fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

      expect(mockOnSubmit).toHaveBeenCalledWith({
        username: "testuser",
        password: "password123",
        confirmPassword: "password123",
      });
    });

    it("toggles password visibility", () => {
      render(<Auth mode="register" />);
      const passwordInput = screen.getByLabelText(
        "Password",
      ) as HTMLInputElement;

      expect(passwordInput.type).toBe("password");
      fireEvent.click(screen.getByRole("button", { name: /show password/i }));
      expect(passwordInput.type).toBe("text");
    });

    it("toggles confirm password visibility and updates accessibility attributes", () => {
      render(<Auth mode="register" />);
      const confirmInput = screen.getByLabelText(
        "Confirm Password",
      ) as HTMLInputElement;

      expect(confirmInput.type).toBe("password");
      const showButton = screen.getByRole("button", {
        name: /show confirm password/i,
      });
      expect(showButton).toHaveAttribute("title", "Show confirm password");
      expect(showButton).toHaveAttribute("aria-pressed", "false");

      fireEvent.click(showButton);
      expect(confirmInput.type).toBe("text");

      const hideButton = screen.getByRole("button", {
        name: /hide confirm password/i,
      });
      expect(hideButton).toHaveAttribute("title", "Hide confirm password");
      expect(hideButton).toHaveAttribute("aria-pressed", "true");
    });
  });
});
