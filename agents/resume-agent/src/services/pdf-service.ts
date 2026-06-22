import PDFDocument from "pdfkit";

/**
 * Generates a clean, ATS-compliant PDF buffer from resume markdown content.
 * Conforms to strict layout rules: single-column, consistent typography, no graphics or tables.
 */
export function generatePdfFromMarkdown(markdown: string): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err instanceof Error ? err : new Error(String(err))));

      // Configure default font settings
      const fontRegular = "Helvetica";
      const fontBold = "Helvetica-Bold";

      // Split markdown content into lines
      const lines = markdown.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]?.trim();
        if (line === undefined || line === "") {
          doc.moveDown(0.3);
          continue;
        }

        // Heading 1: Name and Contact info header
        if (line.startsWith("# ")) {
          const text = line.substring(2).trim();
          doc
            .font(fontBold)
            .fontSize(20)
            .fillColor("#0f172a") // Slate 900
            .text(text, { align: "center" });
          doc.moveDown(0.5);
        }
        // Heading 2: Section titles
        else if (line.startsWith("## ")) {
          const text = line.substring(3).trim();
          doc.moveDown(0.8);
          doc
            .font(fontBold)
            .fontSize(12)
            .fillColor("#1e3a8a") // Blue 900
            .text(text, { underline: false });

          // Draw a clean horizontal divider line below section titles
          const currentY = doc.y;
          doc
            .strokeColor("#e2e8f0") // Slate 200
            .lineWidth(1)
            .moveTo(50, currentY + 3)
            .lineTo(545, currentY + 3)
            .stroke();
          doc.moveDown(0.6);
        }
        // Heading 3: Subsection / Job title / Project title
        else if (line.startsWith("### ")) {
          const text = line.substring(4).trim();
          doc.font(fontBold).fontSize(10).fillColor("#0f172a").text(text);
          doc.moveDown(0.2);
        }
        // Bullet points
        else if (line.startsWith("- ") || line.startsWith("* ")) {
          const text = line.substring(2).trim();
          doc
            .font(fontRegular)
            .fontSize(9.5)
            .fillColor("#334155") // Slate 700
            .text("  \u2022  " + text, {
              align: "left",
              lineGap: 2,
            });
        }
        // Standard text
        else {
          doc.font(fontRegular).fontSize(9.5).fillColor("#334155").text(line, {
            align: "left",
            lineGap: 2,
          });
        }
      }

      // Add simple page numbers at the bottom of all pages
      const range = doc.bufferedPageRange();
      for (let j = range.start; j < range.start + range.count; j++) {
        doc.switchToPage(j);
        doc
          .font(fontRegular)
          .fontSize(8)
          .fillColor("#94a3b8") // Slate 400
          .text(`Page ${j + 1} of ${range.count}`, 50, doc.page.height - 40, { align: "center" });
      }

      doc.end();
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}
