import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HomeSidePanelContent from "../components/side-panels/HomeInfoPanel";

describe("HomeSidePanelContent", () => {
  describe("rendering", () => {
    it("renders without crashing", () => {
      render(<HomeSidePanelContent />);
      expect(
        screen.getByText("Explore Fire and Watershed Impacts"),
      ).toBeInTheDocument();
    });

    it("renders the introductory description", () => {
      render(<HomeSidePanelContent />);
      expect(
        screen.getByText(
          /This tool helps watershed and water utility managers/i,
        ),
      ).toBeInTheDocument();
    });
  });

  describe("call to action", () => {
    it("renders the get started message", () => {
      render(<HomeSidePanelContent />);
      expect(
        screen.getByText(
          /Get Started: Select a watershed to explore its data/i,
        ),
      ).toBeInTheDocument();
    });
  });
});
