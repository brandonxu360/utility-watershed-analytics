import { describe, it, vi } from "vitest";
import { render } from "@testing-library/react";
import Navbar from "../components/navbar/Navbar";

vi.mock("@tanstack/react-router", async (importOriginal) => {
    const actual = await importOriginal();
    return Object.assign({}, actual, {
        Link: ({ children, to, activeProps, ...props }: { children: React.ReactNode; to: string; activeProps?:
        unknown; [key: string]: unknown }) => {
            void activeProps;
            return <a href={to} {...props}>{children}</a>;
        },
    });
});

describe("Navbar Component Tests", () => {
    describe("rendering", () => {
        it("renders without crashing", () => {
            render(<Navbar />);
        });
    });
});