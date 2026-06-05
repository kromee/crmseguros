#!/usr/bin/env node
/**
 * Genera docs/PROPUESTA-CLIENTE-2.pdf desde docs/PROPUESTA-CLIENTE-2.md
 * Requiere Google Chrome en macOS (ruta estándar).
 *
 *   npm run propuesta:pdf
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const mdPath = join(root, "docs", "PROPUESTA-CLIENTE-2.md");
const cssPath = join(root, "docs", "propuesta-cliente-pdf.css");
const htmlPath = join(root, "docs", "PROPUESTA-CLIENTE-2.html");
const pdfPath = join(root, "docs", "PROPUESTA-CLIENTE-2.pdf");

const CHROME =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineFormat(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

function parseMarkdown(md) {
  const lines = md.split("\n");
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("# ")) {
      out.push(`<h1>${inlineFormat(line.slice(2))}</h1>`);
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      out.push(`<h2>${inlineFormat(line.slice(3))}</h2>`);
      i++;
      continue;
    }
    if (line.startsWith("### ")) {
      out.push(`<h3>${inlineFormat(line.slice(4))}</h3>`);
      i++;
      continue;
    }
    if (line.startsWith("#### ")) {
      out.push(`<h4>${inlineFormat(line.slice(5))}</h4>`);
      i++;
      continue;
    }
    if (line.trim() === "---") {
      out.push("<hr />");
      i++;
      continue;
    }
    if (line.startsWith("> ")) {
      const quote = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        quote.push(lines[i].slice(2));
        i++;
      }
      const quoteText = quote.join("\n");
      if (
        /propuesta:pdf/i.test(quoteText) ||
        /Regenerar:/i.test(quoteText) ||
        /PDF para el cliente/i.test(quoteText)
      ) {
        continue;
      }
      out.push(
        `<blockquote><p>${quote.map((q) => inlineFormat(q)).join("<br />")}</p></blockquote>`
      );
      continue;
    }
    if (line.startsWith("|")) {
      const tableLines = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      const rows = tableLines
        .filter((r) => !/^\|[\s\-:|]+\|$/.test(r.trim()))
        .map((r) =>
          r
            .split("|")
            .slice(1, -1)
            .map((c) => c.trim())
        );
      if (rows.length === 0) continue;
      const [head, ...body] = rows;
      out.push("<table><thead><tr>");
      head.forEach((c) => out.push(`<th>${inlineFormat(c)}</th>`));
      out.push("</tr></thead><tbody>");
      body.forEach((row) => {
        out.push("<tr>");
        row.forEach((c) => out.push(`<td>${inlineFormat(c)}</td>`));
        out.push("</tr>");
      });
      out.push("</tbody></table>");
      continue;
    }
    if (line.startsWith("- ")) {
      out.push("<ul>");
      while (i < lines.length && lines[i].startsWith("- ")) {
        out.push(`<li>${inlineFormat(lines[i].slice(2))}</li>`);
        i++;
      }
      out.push("</ul>");
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      out.push("<ol>");
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        out.push(
          `<li>${inlineFormat(lines[i].replace(/^\d+\.\s/, ""))}</li>`
        );
        i++;
      }
      out.push("</ol>");
      continue;
    }
    if (line.trim() === "") {
      i++;
      continue;
    }
    out.push(`<p>${inlineFormat(line)}</p>`);
    i++;
  }

  return out.join("\n");
}

const md = readFileSync(mdPath, "utf8");
const css = readFileSync(cssPath, "utf8");
const body = parseMarkdown(md);

const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Propuesta CRM — Agencia de Seguros</title>
  <style>${css}</style>
</head>
<body>
${body}
</body>
</html>`;

writeFileSync(htmlPath, html, "utf8");

if (!existsSync(CHROME)) {
  console.error("No se encontró Google Chrome en:", CHROME);
  console.error("HTML generado en:", htmlPath);
  console.error("Abra el HTML en el navegador y use Imprimir → Guardar como PDF.");
  process.exit(1);
}

execFileSync(
  CHROME,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-pdf-header-footer",
    `--print-to-pdf=${pdfPath}`,
    `file://${htmlPath}`,
  ],
  { stdio: "inherit" }
);

console.log("PDF generado:", pdfPath);
console.log("HTML (respaldo):", htmlPath);
