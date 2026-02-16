import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CoverageLineChart } from "../components/CoverageLineChart";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({
    children,
    data,
  }: {
    children: React.ReactNode;
    data: unknown[];
  }) => (
    <div data-testid="line-chart" data-length={data.length}>
      {children}
    </div>
  ),
  Line: ({
    dataKey,
    stroke,
    strokeWidth,
  }: {
    dataKey: string;
    stroke: string;
    strokeWidth: number;
  }) => (
    <div
      data-testid={`line-${dataKey}`}
      data-stroke={stroke}
      data-stroke-width={strokeWidth}
    />
  ),
  XAxis: ({ dataKey }: { dataKey: string }) => (
    <div data-testid="x-axis" data-key={dataKey} />
  ),
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: ({ stroke }: { stroke: string }) => (
    <div data-testid="cartesian-grid" data-stroke={stroke} />
  ),
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

describe("CoverageLineChart", () => {
  const mockLineKeys = [
    {
      key: "shrub",
      color: "#8B4513",
      activeFill: "#d7a17a",
      activeStroke: "#5c3317",
    },
    {
      key: "tree",
      color: "#4caf50",
      activeFill: "#a5d6a7",
      activeStroke: "#2e7d32",
    },
  ];

  const mockData = [
    { name: "1986", coverage: 30 },
    { name: "1987", coverage: 40 },
    { name: "2020", coverage: 70 },
  ];

  describe("empty state", () => {
    it("shows no data message when data is empty array", () => {
      render(
        <CoverageLineChart
          data={[]}
          title="Test Coverage"
          lineKeys={mockLineKeys}
        />,
      );

      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(
        screen.getByText("No data found for Test Coverage"),
      ).toBeInTheDocument();
    });

    it("shows no data message when data is undefined", () => {
      render(
        <CoverageLineChart
          data={undefined as unknown as { name: string; coverage: number }[]}
          title="Vegetation Data"
          lineKeys={mockLineKeys}
        />,
      );

      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(
        screen.getByText("No data found for Vegetation Data"),
      ).toBeInTheDocument();
    });

    it("does not render chart components when empty", () => {
      render(
        <CoverageLineChart
          data={[]}
          title="Empty Chart"
          lineKeys={mockLineKeys}
        />,
      );

      expect(screen.queryByTestId("line-chart")).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("responsive-container"),
      ).not.toBeInTheDocument();
    });

    it("has correct accessibility attributes on empty state", () => {
      render(
        <CoverageLineChart
          data={[]}
          title="Accessible Chart"
          lineKeys={mockLineKeys}
        />,
      );

      const statusElement = screen.getByRole("status");
      expect(statusElement).toHaveAttribute("aria-live", "polite");
    });
  });

  describe("rendering with data", () => {
    it("renders the chart title", () => {
      render(
        <CoverageLineChart
          data={mockData}
          title="All Coverage (2020)"
          lineKeys={mockLineKeys}
        />,
      );

      expect(screen.getByTestId("coverage-chart")).toBeInTheDocument();
      expect(screen.getByTestId("coverage-chart")).toHaveTextContent(
        "All Coverage (2020)",
      );
    });

    it("renders ResponsiveContainer", () => {
      render(
        <CoverageLineChart
          data={mockData}
          title="Test Title"
          lineKeys={mockLineKeys}
        />,
      );

      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("renders LineChart with data", () => {
      render(
        <CoverageLineChart
          data={mockData}
          title="Test Title"
          lineKeys={mockLineKeys}
        />,
      );

      const lineChart = screen.getByTestId("line-chart");
      expect(lineChart).toBeInTheDocument();
      expect(lineChart).toHaveAttribute("data-length", "3");
    });

    it("renders CartesianGrid with correct stroke", () => {
      render(
        <CoverageLineChart
          data={mockData}
          title="Test Title"
          lineKeys={mockLineKeys}
        />,
      );

      const grid = screen.getByTestId("cartesian-grid");
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveAttribute("data-stroke", "#F5F5F5");
    });

    it("renders XAxis with name dataKey", () => {
      render(
        <CoverageLineChart
          data={mockData}
          title="Test Title"
          lineKeys={mockLineKeys}
        />,
      );

      const xAxis = screen.getByTestId("x-axis");
      expect(xAxis).toBeInTheDocument();
      expect(xAxis).toHaveAttribute("data-key", "name");
    });

    it("renders YAxis", () => {
      render(
        <CoverageLineChart
          data={mockData}
          title="Test Title"
          lineKeys={mockLineKeys}
        />,
      );

      expect(screen.getByTestId("y-axis")).toBeInTheDocument();
    });

    it("renders Tooltip", () => {
      render(
        <CoverageLineChart
          data={mockData}
          title="Test Title"
          lineKeys={mockLineKeys}
        />,
      );

      expect(screen.getByTestId("tooltip")).toBeInTheDocument();
    });

    it("renders Legend", () => {
      render(
        <CoverageLineChart
          data={mockData}
          title="Test Title"
          lineKeys={mockLineKeys}
        />,
      );

      expect(screen.getByTestId("legend")).toBeInTheDocument();
    });

    it("does not show empty state message when data exists", () => {
      render(
        <CoverageLineChart
          data={mockData}
          title="Test Title"
          lineKeys={mockLineKeys}
        />,
      );

      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      expect(screen.queryByText(/No data found/)).not.toBeInTheDocument();
    });
  });

  describe("line rendering", () => {
    it("renders a Line for each lineKey", () => {
      render(
        <CoverageLineChart
          data={mockData}
          title="Test Title"
          lineKeys={mockLineKeys}
        />,
      );

      expect(screen.getByTestId("line-shrub")).toBeInTheDocument();
      expect(screen.getByTestId("line-tree")).toBeInTheDocument();
    });

    it("applies correct stroke color to each line", () => {
      render(
        <CoverageLineChart
          data={mockData}
          title="Test Title"
          lineKeys={mockLineKeys}
        />,
      );

      expect(screen.getByTestId("line-shrub")).toHaveAttribute(
        "data-stroke",
        "#8B4513",
      );
      expect(screen.getByTestId("line-tree")).toHaveAttribute(
        "data-stroke",
        "#4caf50",
      );
    });

    it("applies stroke width of 3 to each line", () => {
      render(
        <CoverageLineChart
          data={mockData}
          title="Test Title"
          lineKeys={mockLineKeys}
        />,
      );

      expect(screen.getByTestId("line-shrub")).toHaveAttribute(
        "data-stroke-width",
        "3",
      );
      expect(screen.getByTestId("line-tree")).toHaveAttribute(
        "data-stroke-width",
        "3",
      );
    });

    it("renders single line when only one lineKey provided", () => {
      const singleLineKey = [
        {
          key: "coverage",
          color: "#000",
          activeFill: "#fff",
          activeStroke: "#333",
        },
      ];

      render(
        <CoverageLineChart
          data={mockData}
          title="Single Line Chart"
          lineKeys={singleLineKey}
        />,
      );

      expect(screen.getByTestId("line-coverage")).toBeInTheDocument();
      expect(screen.queryByTestId("line-shrub")).not.toBeInTheDocument();
      expect(screen.queryByTestId("line-tree")).not.toBeInTheDocument();
    });

    it("renders no lines when lineKeys is empty", () => {
      render(
        <CoverageLineChart
          data={mockData}
          title="No Lines Chart"
          lineKeys={[]}
        />,
      );

      // Chart should still render but with no lines
      expect(screen.getByTestId("line-chart")).toBeInTheDocument();
      expect(screen.queryByTestId("line-shrub")).not.toBeInTheDocument();
      expect(screen.queryByTestId("line-tree")).not.toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("handles single data point", () => {
      const singleData = [{ name: "2020", coverage: 50 }];

      render(
        <CoverageLineChart
          data={singleData}
          title="Single Point"
          lineKeys={mockLineKeys}
        />,
      );

      const lineChart = screen.getByTestId("line-chart");
      expect(lineChart).toHaveAttribute("data-length", "1");
    });

    it("handles data with zero coverage values", () => {
      const zeroData = [
        { name: "1986", coverage: 0 },
        { name: "1987", coverage: 0 },
      ];

      render(
        <CoverageLineChart
          data={zeroData}
          title="Zero Coverage"
          lineKeys={mockLineKeys}
        />,
      );

      expect(screen.getByTestId("coverage-chart")).toHaveTextContent(
        "Zero Coverage",
      );
      expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    });

    it("renders with special characters in title", () => {
      render(
        <CoverageLineChart
          data={mockData}
          title="All Coverage - Hillslope 42 (2020)"
          lineKeys={mockLineKeys}
        />,
      );

      expect(screen.getByTestId("coverage-chart")).toHaveTextContent(
        "All Coverage - Hillslope 42 (2020)",
      );
    });

    it("renders with many data points", () => {
      const manyDataPoints = Array.from({ length: 38 }, (_, i) => ({
        name: String(1986 + i),
        coverage: Math.random() * 100,
      }));

      render(
        <CoverageLineChart
          data={manyDataPoints}
          title="Many Years"
          lineKeys={mockLineKeys}
        />,
      );

      const lineChart = screen.getByTestId("line-chart");
      expect(lineChart).toHaveAttribute("data-length", "38");
    });

    it("renders with custom line keys", () => {
      const customLineKeys = [
        {
          key: "custom1",
          color: "#ff0000",
          activeFill: "#ff6666",
          activeStroke: "#cc0000",
        },
        {
          key: "custom2",
          color: "#00ff00",
          activeFill: "#66ff66",
          activeStroke: "#00cc00",
        },
        {
          key: "custom3",
          color: "#0000ff",
          activeFill: "#6666ff",
          activeStroke: "#0000cc",
        },
      ];

      render(
        <CoverageLineChart
          data={mockData}
          title="Custom Lines"
          lineKeys={customLineKeys}
        />,
      );

      expect(screen.getByTestId("line-custom1")).toBeInTheDocument();
      expect(screen.getByTestId("line-custom2")).toBeInTheDocument();
      expect(screen.getByTestId("line-custom3")).toBeInTheDocument();
    });
  });
});
