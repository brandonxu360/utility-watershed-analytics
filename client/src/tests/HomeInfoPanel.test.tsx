import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HomeSidePanelContent from "../components/side-panels/home-info/HomeInfoPanel";

describe("HomeSidePanelContent", () => {
    describe("rendering", () => {
        it("renders without crashing", () => {
            render(<HomeSidePanelContent />);
            expect(screen.getByText("Explore Watershed Analytics")).toBeInTheDocument();
        });

        it("renders the main heading", () => {
            render(<HomeSidePanelContent />);
            const heading = screen.getByRole("heading", { level: 2 });
            expect(heading).toHaveTextContent("Explore Watershed Analytics");
        });

        it("renders the introductory description", () => {
            render(<HomeSidePanelContent />);
            expect(
                screen.getByText(/Visualize and analyze hydrologic and environmental data/i)
            ).toBeInTheDocument();
        });
    });

    describe("Tier 1 Watersheds section", () => {
        it("renders Tier 1 heading", () => {
            render(<HomeSidePanelContent />);
            expect(screen.getByText("Tier 1 Watersheds")).toBeInTheDocument();
        });

        it("renders Tier 1 description", () => {
            render(<HomeSidePanelContent />);
            expect(
                screen.getByText(/Access modeled results that provide initial insights/i)
            ).toBeInTheDocument();
        });
    });

    describe("Tier 2 Watersheds section", () => {
        it("renders Tier 2 heading", () => {
            render(<HomeSidePanelContent />);
            expect(screen.getByText("Tier 2 Watersheds")).toBeInTheDocument();
        });

        it("renders Tier 2 description", () => {
            render(<HomeSidePanelContent />);
            expect(
                screen.getByText(/Explore calibrated model results for enhanced accuracy/i)
            ).toBeInTheDocument();
        });
    });

    describe("call to action", () => {
        it("renders the get started message", () => {
            render(<HomeSidePanelContent />);
            expect(
                screen.getByText(/Get Started: Select a watershed to explore its data/i)
            ).toBeInTheDocument();
        });

        it("renders the get started message as strong/bold", () => {
            const { container } = render(<HomeSidePanelContent />);
            const strongElement = container.querySelector("strong");
            expect(strongElement).toBeInTheDocument();
            expect(strongElement).toHaveTextContent("Get Started");
        });
    });

    describe("structure", () => {
        it("renders with correct container class", () => {
            const { container } = render(<HomeSidePanelContent />);
            const homePanel = container.querySelector(".home-panel");
            expect(homePanel).toBeInTheDocument();
        });

        it("renders all headings in correct hierarchy", () => {
            render(<HomeSidePanelContent />);
            const h2Elements = screen.getAllByRole("heading", { level: 2 });
            const h3Elements = screen.getAllByRole("heading", { level: 3 });

            expect(h2Elements).toHaveLength(1);
            expect(h3Elements).toHaveLength(2);
        });

        it("renders tier headings as h3 elements", () => {
            render(<HomeSidePanelContent />);
            const h3Elements = screen.getAllByRole("heading", { level: 3 });

            expect(h3Elements[0]).toHaveTextContent("Tier 1 Watersheds");
            expect(h3Elements[1]).toHaveTextContent("Tier 2 Watersheds");
        });
    });
});
