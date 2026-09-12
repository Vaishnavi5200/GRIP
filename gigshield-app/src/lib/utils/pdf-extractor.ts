/**
 * GigShield PDF Text Extractor
 *
 * Browser-side PDF-to-text utility using pdfjs-dist.
 * No server required — runs entirely in the browser.
 *
 * Usage:
 *   const text = await extractTextFromPdf(file);
 *   // pass text to /api/extract route for AI interpretation
 */

// pdfjs-dist worker must be configured before any PDF operations
let workerSrcConfigured = false;

async function ensureWorker() {
  if (workerSrcConfigured) return;
  const pdfjsLib = await import("pdfjs-dist");
  // Use the bundled legacy worker for broad browser compatibility
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
  workerSrcConfigured = true;
}

export interface PdfExtractionResult {
  text: string;
  pageCount: number;
  fileName: string;
  fileSizeBytes: number;
  extractedAt: string;
}

/**
 * Extract all text from a PDF File object.
 * Returns the full concatenated text from all pages.
 */
export async function extractTextFromPdf(
  file: File
): Promise<PdfExtractionResult> {
  await ensureWorker();
  const pdfjsLib = await import("pdfjs-dist");

  const arrayBuffer = await file.arrayBuffer();
  const typedArray = new Uint8Array(arrayBuffer);

  const loadingTask = pdfjsLib.getDocument({ data: typedArray });
  const pdf = await loadingTask.promise;

  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => {
        if ("str" in item) return item.str;
        return "";
      })
      .join(" ");
    pageTexts.push(pageText);
  }

  const fullText = pageTexts
    .join("\n\n")
    .replace(/\s{3,}/g, "  ") // collapse excessive whitespace
    .trim();

  return {
    text: fullText,
    pageCount: pdf.numPages,
    fileName: file.name,
    fileSizeBytes: file.size,
    extractedAt: new Date().toISOString(),
  };
}
