/** Decodes base64 holding UTF-8 text - plain `atob` breaks Polish characters. */
const decodeBase64Utf8 = (value: string | null | undefined) => {
  if (!value) return "";
  try {
    const binary = atob(value.replace(/\s+/g, ""));
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    // Not base64 (older messages may be plain text)
    return value;
  }
};

/** `<![CDATA[ ... ]]>` -> `...` (message bodies are sometimes wrapped). */
const stripCdata = (value: string) => value.replace(/^\s*<!\[CDATA\[/, "").replace(/]]>\s*$/, "");

/**
 * Message body as stored by the messages API: plain HTML, `<![CDATA[...]]>`, or (sent messages in the archive)
 * `<Message><Content><![CDATA[...]]></Content><Actions>...</Actions></Message>` - returns the content only.
 */
const messageBody = (value: string) => {
  const content = /^\s*<Message>\s*<Content>([\s\S]*)<\/Content>/.exec(value)?.[1];
  return stripCdata(content ?? value);
};

/** Numeric string -> number (`"1"` -> `1`), anything else -> `fallback`. */
const toInt = (value: unknown, fallback = 0) => {
  const number = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  return Number.isNaN(number) ? fallback : number;
};

export {decodeBase64Utf8, stripCdata, messageBody, toInt};
