/**
 * Minimal, dependency-free renderer for the small subset of markdown the
 * Pages (About/Legal) editor's toolbar produces: H2/H3 headings, bold,
 * and bullet lists. Good enough for a live preview — not a full parser.
 */
export function renderSimpleMarkdown(source: string): string {
  const escapeHtml = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const lines = source.split("\n");
  const html: string[] = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  };

  for (const rawLine of lines) {
    const line = escapeHtml(rawLine);
    const inlineBold = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

    if (/^###\s+/.test(line)) {
      closeList();
      html.push(`<h3>${inlineBold.replace(/^###\s+/, "")}</h3>`);
    } else if (/^##\s+/.test(line)) {
      closeList();
      html.push(`<h2>${inlineBold.replace(/^##\s+/, "")}</h2>`);
    } else if (/^[-*]\s+/.test(line)) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${inlineBold.replace(/^[-*]\s+/, "")}</li>`);
    } else if (line.trim() === "") {
      closeList();
      html.push("<br/>");
    } else {
      closeList();
      html.push(`<p>${inlineBold}</p>`);
    }
  }
  closeList();
  return html.join("\n");
}
