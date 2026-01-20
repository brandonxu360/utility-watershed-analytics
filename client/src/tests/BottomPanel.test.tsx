import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import BottomPanel from "../components/bottom-panels/BottomPanel";

vi.mock("react-icons/fa6", () => ({
    FaGripLines: () => <span data-testid="grip-lines-icon">GripLines</span>,
}));

describe("BottomPanel", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        document.removeEventListener("mousemove", vi.fn());
        document.removeEventListener("mouseup", vi.fn());
    });

    describe("rendering", () => {
        it("returns null when isOpen is false", () => {
            const { container } = render(
                <BottomPanel isOpen={false}>
                    <div>Child content</div>
                </BottomPanel>
            );

            expect(container.firstChild).toBeNull();
            expect(screen.queryByText("Child content")).not.toBeInTheDocument();
        });

        it("renders panel when isOpen is true", () => {
            render(
                <BottomPanel isOpen={true}>
                    <div>Child content</div>
                </BottomPanel>
            );

            expect(screen.getByText("Child content")).toBeInTheDocument();
        });

        it("renders the grip lines icon", () => {
            render(
                <BottomPanel isOpen={true}>
                    <div>Content</div>
                </BottomPanel>
            );

            expect(screen.getByTestId("grip-lines-icon")).toBeInTheDocument();
        });

        it("renders children correctly", () => {
            render(
                <BottomPanel isOpen={true}>
                    <span>First child</span>
                    <span>Second child</span>
                </BottomPanel>
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
                </BottomPanel>
            );

            const dragHandle = document.querySelector(".bottom-panel-drag")!;
            fireEvent.mouseDown(dragHandle, { clientY: 500 });

            expect(addEventListenerSpy).toHaveBeenCalledWith(
                "mousemove",
                expect.any(Function)
            );

            expect(addEventListenerSpy).toHaveBeenCalledWith(
                "mouseup",
                expect.any(Function)
            );

            addEventListenerSpy.mockRestore();
        });

        it("updates panel height on drag", () => {
            render(
                <BottomPanel isOpen={true}>
                    <div>Content</div>
                </BottomPanel>
            );

            const panel = document.querySelector(".bottom-panel") as HTMLDivElement;
            const dragHandle = document.querySelector(".bottom-panel-drag")!;

            Object.defineProperty(panel, "offsetHeight", {
                value: 200,
                configurable: true,
            });

            fireEvent.mouseDown(dragHandle, { clientY: 500 });
            fireEvent.mouseMove(document, { clientY: 450 });

            expect(panel.style.height).toBe("250px");
        });

        it("clamps height to minimum of 16px", () => {
            render(
                <BottomPanel isOpen={true}>
                    <div>Content</div>
                </BottomPanel>
            );

            const panel = document.querySelector(".bottom-panel") as HTMLDivElement;
            const dragHandle = document.querySelector(".bottom-panel-drag")!;

            Object.defineProperty(panel, "offsetHeight", {
                value: 100,
                configurable: true,
            });

            fireEvent.mouseDown(dragHandle, { clientY: 500 });

            fireEvent.mouseMove(document, { clientY: 700 });

            expect(panel.style.height).toBe("16px");
        });

        it("clamps height to maximum of 450px", () => {
            render(
                <BottomPanel isOpen={true}>
                    <div>Content</div>
                </BottomPanel>
            );

            const panel = document.querySelector(".bottom-panel") as HTMLDivElement;
            const dragHandle = document.querySelector(".bottom-panel-drag")!;

            Object.defineProperty(panel, "offsetHeight", {
                value: 400,
                configurable: true,
            });

            fireEvent.mouseDown(dragHandle, { clientY: 500 });

            fireEvent.mouseMove(document, { clientY: 100 });

            expect(panel.style.height).toBe("450px");
        });

        it("removes event listeners on mouseup", () => {
            const removeEventListenerSpy = vi.spyOn(
                document,
                "removeEventListener"
            );

            render(
                <BottomPanel isOpen={true}>
                    <div>Content</div>
                </BottomPanel>
            );

            const dragHandle = document.querySelector(".bottom-panel-drag")!;

            fireEvent.mouseDown(dragHandle, { clientY: 500 });
            fireEvent.mouseUp(document);

            expect(removeEventListenerSpy).toHaveBeenCalledWith(
                "mousemove",
                expect.any(Function)
            );
            expect(removeEventListenerSpy).toHaveBeenCalledWith(
                "mouseup",
                expect.any(Function)
            );

            removeEventListenerSpy.mockRestore();
        });

        it("handles drag when panelRef.current is null during onDrag", () => {
            render(
                <BottomPanel isOpen={true}>
                    <div>Content</div>
                </BottomPanel>
            );

            const dragHandle = document.querySelector(".bottom-panel-drag")!;

            fireEvent.mouseDown(dragHandle, { clientY: 500 });

            expect(() => {
                fireEvent.mouseMove(document, { clientY: 450 });
            }).not.toThrow();
        });

        it("handles multiple drag operations", () => {
            render(
                <BottomPanel isOpen={true}>
                    <div>Content</div>
                </BottomPanel>
            );

            const panel = document.querySelector(".bottom-panel") as HTMLDivElement;
            const dragHandle = document.querySelector(".bottom-panel-drag")!;

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
                </BottomPanel>
            );

            const panel = document.querySelector(".bottom-panel") as HTMLDivElement;
            const dragHandle = document.querySelector(".bottom-panel-drag")!;

            Object.defineProperty(panel, "offsetHeight", {
                value: 0,
                configurable: true,
            });

            fireEvent.mouseDown(dragHandle, { clientY: 500 });
            fireEvent.mouseMove(document, { clientY: 450 });

            expect(panel.style.height).toBe("50px");
        });
    });

    describe("edge cases", () => {
        it("transitions from closed to open", () => {
            const { rerender } = render(
                <BottomPanel isOpen={false}>
                    <div>Content</div>
                </BottomPanel>
            );

            expect(screen.queryByText("Content")).not.toBeInTheDocument();

            rerender(
                <BottomPanel isOpen={true}>
                    <div>Content</div>
                </BottomPanel>
            );

            expect(screen.getByText("Content")).toBeInTheDocument();
        });

        it("transitions from open to closed", () => {
            const { rerender } = render(
                <BottomPanel isOpen={true}>
                    <div>Content</div>
                </BottomPanel>
            );

            expect(screen.getByText("Content")).toBeInTheDocument();

            rerender(
                <BottomPanel isOpen={false}>
                    <div>Content</div>
                </BottomPanel>
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
                </BottomPanel>
            );

            expect(screen.getByText("Title")).toBeInTheDocument();
            expect(screen.getByText("Paragraph")).toBeInTheDocument();
            expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
        });
    });
});
