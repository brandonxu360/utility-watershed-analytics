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
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  requestAnimationFrame(() => URL.revokeObjectURL(url));
}

function fallbackCopyToClipboard(text: string): void {
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.width = "1px";
    textarea.style.height = "1px";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand("copy");
    } finally {
      document.body.removeChild(textarea);
    }
  } catch (error) {
    console.error("Failed to copy CSV to clipboard.", error);
  }
}

export function copyCsv(
  headers: string[],
  rows: (string | number | null | undefined)[][],
): void {
  const csv = buildCsv(headers, rows);
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(csv).catch(() => {
      fallbackCopyToClipboard(csv);
    });
  } else {
    fallbackCopyToClipboard(csv);
  }
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
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => {
      if (b) {
        resolve(b);
      } else {
        reject(new Error("Failed to generate PNG blob from canvas"));
      }
    }, "image/png"),
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  requestAnimationFrame(() => URL.revokeObjectURL(url));
}
