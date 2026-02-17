import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import SmallScreenNotice from "../components/SmallScreenNotice";

describe("SmallScreenNotice", () => {
  afterEach(() => cleanup());

  it("renders the title and body", () => {
    render(<SmallScreenNotice />);
    expect(
      screen.getByText(/Best viewed on larger screens/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/optimized for tablets and desktops/i),
    ).toBeInTheDocument();
  });
});
