/**
 * Shared helpers for exporting data as CSV and charts as PNG.
 */

import html2canvas from "html2canvas";

export function buildCsv(
  headers: string[],
  rows: (string | number | null | undefined)[][],
): string {
  return [headers, ...rows]
    .map((r) =>
      r
        .map((cell) => {
          const s = cell == null ? "" : String(cell);
          return `"${s.replace(/"/g, '""')}"`;
        })
        .join(","),
    )
    .join("\n");
}

export function downloadCsv(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][],
): void {
  const csv = buildCsv(headers, rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function copyCsv(
  headers: string[],
  rows: (string | number | null | undefined)[][],
): void {
  navigator.clipboard.writeText(buildCsv(headers, rows));
}

export async function downloadChartAsPng(
  containerEl: HTMLElement,
  filename: string,
): Promise<void> {
  const canvas = await html2canvas(containerEl, {
    backgroundColor: "#ffffff",
    scale: window.devicePixelRatio || 1,
    useCORS: true,
    logging: false,
  });
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
