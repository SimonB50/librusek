import DOMPurify from "dompurify";

const FORWARD_SEPARATOR = "---------- Przekazywana wiadomość ---------";

DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A") {
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer");
  }
});

const ALLOWED_TAGS = ["p", "a", "b", "i", "u", "s", "strong", "em", "br", "div", "span", "ul", "ol", "li", "blockquote", "hr"];

abstract class Html {
  /** Librus HTML (notices, homeworks, messages) -> safe markup, plain-text newlines become `<br>`. */
  static sanitize = (html: string, {breaks = true} = {}) => {
    const source = breaks && !/<(br|p|div)\b/i.test(html) ? html.replace(/\r?\n/g, "<br>") : html;
    return DOMPurify.sanitize(source, {ALLOWED_TAGS, ALLOWED_ATTR: ["href", "target", "rel"]});
  };

  /** Splits forwarded messages into `[own text, forwarded #1, forwarded #2...]`. */
  static splitForwarded = (html: string) => html.split(FORWARD_SEPARATOR).map(part => part.trim()).filter(Boolean);

  /** Strips tags - for one-line previews. */
  static toText = (html: string) => {
    const doc = new DOMParser().parseFromString(html.replace(/<br\s*\/?>/gi, " "), "text/html");
    return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
  };
}

export default Html;
