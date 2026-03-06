import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import BottomPanel from "../components/bottom-panels/BottomPanel";

describe("BottomPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("returns null when isOpen is false", () => {
      const { container } = render(
        <BottomPanel isOpen={false}>
          <div>Child content</div>
        </BottomPanel>,
      );

      expect(container.firstChild).toBeNull();
      expect(screen.queryByText("Child content")).not.toBeInTheDocument();
    });

    it("renders panel when isOpen is true", () => {
      render(
        <BottomPanel isOpen={true}>
          <div>Child content</div>
        </BottomPanel>,
      );

      expect(screen.getByText("Child content")).toBeInTheDocument();
    });

    it("renders the grip lines icon", () => {
      render(
        <BottomPanel isOpen={true}>
          <div>Content</div>
        </BottomPanel>,
      );

      expect(screen.getByTestId("drag-handle-icon")).toBeInTheDocument();
    });

    it("renders children correctly", () => {
      render(
        <BottomPanel isOpen={true}>
          <span>First child</span>
          <span>Second child</span>
        </BottomPanel>,
      );

      expect(screen.getByText("First child")).toBeInTheDocument();
      expect(screen.getByText("Second child")).toBeInTheDocument();
    });
  });

  describe("drag functionality", () => {
    it("adds event listeners on mousedown", () => {
      const addEventListenerSpy = vi.spyOn(document, "addEventListener");

      render(
        <BottomPanel isOpen={true}>
          <div>Content</div>
        </BottomPanel>,
      );

      const dragHandle = screen.getByTestId("bottom-panel-drag");
      fireEvent.mouseDown(dragHandle, { clientY: 500 });

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "mousemove",
        expect.any(Function),
      );

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "mouseup",
        expect.any(Function),
      );

      addEventListenerSpy.mockRestore();
    });

    it("updates panel height on drag", () => {
      render(
        <BottomPanel isOpen={true}>
          <div>Content</div>
        </BottomPanel>,
      );

      const panel = screen.getByTestId("bottom-panel") as HTMLDivElement;
      const dragHandle = screen.getByTestId("bottom-panel-drag");

      Object.defineProperty(panel, "offsetHeight", {
        value: 200,
        configurable: true,
      });

      fireEvent.mouseDown(dragHandle, { clientY: 500 });
      fireEvent.mouseMove(document, { clientY: 450 });

      expect(panel.style.height).toBe("250px");
    });

    it("clamps height to minimum of 24px", () => {
      render(
        <BottomPanel isOpen={true}>
          <div>Content</div>
        </BottomPanel>,
      );

      const panel = screen.getByTestId("bottom-panel") as HTMLDivElement;
      const dragHandle = screen.getByTestId("bottom-panel-drag");

      Object.defineProperty(panel, "offsetHeight", {
        value: 100,
        configurable: true,
      });

      fireEvent.mouseDown(dragHandle, { clientY: 500 });

      fireEvent.mouseMove(document, { clientY: 700 });

      expect(panel.style.height).toBe("24px");
    });

    it("clamps height to maximum of 450px", () => {
      render(
        <BottomPanel isOpen={true}>
          <div>Content</div>
        </BottomPanel>,
      );

      const panel = screen.getByTestId("bottom-panel") as HTMLDivElement;
      const dragHandle = screen.getByTestId("bottom-panel-drag");

      Object.defineProperty(panel, "offsetHeight", {
        value: 400,
        configurable: true,
      });

      fireEvent.mouseDown(dragHandle, { clientY: 500 });

      fireEvent.mouseMove(document, { clientY: 100 });

      expect(panel.style.height).toBe("450px");
    });

    it("removes event listeners on mouseup", () => {
      const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");

      render(
        <BottomPanel isOpen={true}>
          <div>Content</div>
        </BottomPanel>,
      );

      const dragHandle = screen.getByTestId("bottom-panel-drag");

      fireEvent.mouseDown(dragHandle, { clientY: 500 });
      fireEvent.mouseUp(document);

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "mousemove",
        expect.any(Function),
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "mouseup",
        expect.any(Function),
      );

      removeEventListenerSpy.mockRestore();
    });

    it("handles drag when panelRef.current is null during onDrag", () => {
      render(
        <BottomPanel isOpen={true}>
          <div>Content</div>
        </BottomPanel>,
      );

      const dragHandle = screen.getByTestId("bottom-panel-drag");

      fireEvent.mouseDown(dragHandle, { clientY: 500 });

      expect(() => {
        fireEvent.mouseMove(document, { clientY: 450 });
      }).not.toThrow();
    });

    it("handles multiple drag operations", () => {
      render(
        <BottomPanel isOpen={true}>
          <div>Content</div>
        </BottomPanel>,
      );

      const panel = screen.getByTestId("bottom-panel") as HTMLDivElement;
      const dragHandle = screen.getByTestId("bottom-panel-drag");

      Object.defineProperty(panel, "offsetHeight", {
        value: 200,
        configurable: true,
      });

      fireEvent.mouseDown(dragHandle, { clientY: 500 });
      fireEvent.mouseMove(document, { clientY: 480 });
      expect(panel.style.height).toBe("220px");
      fireEvent.mouseUp(document);

      Object.defineProperty(panel, "offsetHeight", {
        value: 220,
        configurable: true,
      });

      fireEvent.mouseDown(dragHandle, { clientY: 400 });
      fireEvent.mouseMove(document, { clientY: 350 });
      expect(panel.style.height).toBe("270px");
      fireEvent.mouseUp(document);
    });

    it("handles offsetHeight being 0 when drag starts", () => {
      render(
        <BottomPanel isOpen={true}>
          <div>Content</div>
        </BottomPanel>,
      );

      const panel = screen.getByTestId("bottom-panel") as HTMLDivElement;
      const dragHandle = screen.getByTestId("bottom-panel-drag");

      Object.defineProperty(panel, "offsetHeight", {
        value: 0,
        configurable: true,
      });

      fireEvent.mouseDown(dragHandle, { clientY: 500 });
      fireEvent.mouseMove(document, { clientY: 450 });

      expect(panel.style.height).toBe("74px");
    });
  });

  describe("edge cases", () => {
    it("transitions from closed to open", () => {
      const { rerender } = render(
        <BottomPanel isOpen={false}>
          <div>Content</div>
        </BottomPanel>,
      );

      expect(screen.queryByText("Content")).not.toBeInTheDocument();

      rerender(
        <BottomPanel isOpen={true}>
          <div>Content</div>
        </BottomPanel>,
      );

      expect(screen.getByText("Content")).toBeInTheDocument();
    });

    it("transitions from open to closed", () => {
      const { rerender } = render(
        <BottomPanel isOpen={true}>
          <div>Content</div>
        </BottomPanel>,
      );

      expect(screen.getByText("Content")).toBeInTheDocument();

      rerender(
        <BottomPanel isOpen={false}>
          <div>Content</div>
        </BottomPanel>,
      );

      expect(screen.queryByText("Content")).not.toBeInTheDocument();
    });

    it("renders complex children", () => {
      render(
        <BottomPanel isOpen={true}>
          <div>
            <h1>Title</h1>
            <p>Paragraph</p>
            <button>Click me</button>
          </div>
        </BottomPanel>,
      );

      expect(screen.getByText("Title")).toBeInTheDocument();
      expect(screen.getByText("Paragraph")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Click me" }),
      ).toBeInTheDocument();
    });
  });

  describe("toggle functionality", () => {
    it("renders the toggle button with collapse label by default", () => {
      render(
        <BottomPanel isOpen={true}>
          <div>Content</div>
        </BottomPanel>,
      );

      const toggle = screen.getByTestId("bottom-panel-toggle");
      expect(toggle).toBeInTheDocument();
      expect(toggle).toHaveAttribute("aria-label", "Collapse panel");
      expect(screen.getByTestId("chevron-down-icon")).toBeInTheDocument();
    });

    it("collapses content and shows expand icon when toggle is clicked", () => {
      render(
        <BottomPanel isOpen={true}>
          <div>Content</div>
        </BottomPanel>,
      );

      const toggle = screen.getByTestId("bottom-panel-toggle");
      fireEvent.click(toggle);

      expect(toggle).toHaveAttribute("aria-label", "Expand panel");
      expect(screen.getByTestId("chevron-up-icon")).toBeInTheDocument();

      const content = screen.getByText("Content").closest("[hidden]");
      expect(content).not.toBeNull();
    });

    it("expands content when toggle is clicked again after collapsing", () => {
      render(
        <BottomPanel isOpen={true}>
          <div>Content</div>
        </BottomPanel>,
      );

      const toggle = screen.getByTestId("bottom-panel-toggle");
      fireEvent.click(toggle);
      fireEvent.click(toggle);

      expect(toggle).toHaveAttribute("aria-label", "Collapse panel");
      expect(screen.getByTestId("chevron-down-icon")).toBeInTheDocument();
      expect(screen.getByText("Content")).toBeVisible();
    });

    it("sets panel height to min when collapsing via toggle", () => {
      render(
        <BottomPanel isOpen={true}>
          <div>Content</div>
        </BottomPanel>,
      );

      const panel = screen.getByTestId("bottom-panel") as HTMLDivElement;
      const toggle = screen.getByTestId("bottom-panel-toggle");
      fireEvent.click(toggle);

      expect(panel.style.height).toBe("24px");
    });

    it("clears inline height when expanding via toggle", () => {
      render(
        <BottomPanel isOpen={true}>
          <div>Content</div>
        </BottomPanel>,
      );

      const panel = screen.getByTestId("bottom-panel") as HTMLDivElement;
      const toggle = screen.getByTestId("bottom-panel-toggle");
      fireEvent.click(toggle);
      fireEvent.click(toggle);

      expect(panel.style.height).toBe("");
    });

    it("auto-collapses when dragged to minimum height", () => {
      render(
        <BottomPanel isOpen={true}>
          <div>Content</div>
        </BottomPanel>,
      );

      const panel = screen.getByTestId("bottom-panel") as HTMLDivElement;
      const dragHandle = screen.getByTestId("bottom-panel-drag");

      Object.defineProperty(panel, "offsetHeight", {
        value: 100,
        configurable: true,
      });

      fireEvent.mouseDown(dragHandle, { clientY: 500 });
      fireEvent.mouseMove(document, { clientY: 700 });
      fireEvent.mouseUp(document);

      const toggle = screen.getByTestId("bottom-panel-toggle");
      expect(toggle).toHaveAttribute("aria-label", "Expand panel");
      expect(screen.getByTestId("chevron-up-icon")).toBeInTheDocument();
    });

    it("auto-expands when dragging from collapsed state", () => {
      render(
        <BottomPanel isOpen={true}>
          <div>Content</div>
        </BottomPanel>,
      );

      const toggle = screen.getByTestId("bottom-panel-toggle");
      fireEvent.click(toggle);

      expect(toggle).toHaveAttribute("aria-label", "Expand panel");

      const dragHandle = screen.getByTestId("bottom-panel-drag");
      fireEvent.mouseDown(dragHandle, { clientY: 500 });

      expect(toggle).toHaveAttribute("aria-label", "Collapse panel");
    });

    it("hides content from screen readers when collapsed", () => {
      render(
        <BottomPanel isOpen={true}>
          <div>Content</div>
        </BottomPanel>,
      );

      const toggle = screen.getByTestId("bottom-panel-toggle");
      fireEvent.click(toggle);

      const contentWrapper = screen.getByText("Content").parentElement;
      expect(contentWrapper).toHaveAttribute("aria-hidden", "true");
      expect(contentWrapper).toHaveAttribute("hidden");
    });
  });
});
