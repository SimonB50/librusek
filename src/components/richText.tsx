import Html from "../lib/html.js";
import {useTranslatedHtml} from "../lib/translation/scope.js";

/** One part of a message - translated when the surrounding scope (or auto-translate) asks for it. */
const Part = ({html}: { html: string }) => {
  const translated = useTranslatedHtml(html);
  return (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized with DOMPurify (translations are sanitized again)
    <div className={translated.pending ? "opacity-60 animate-pulse" : ""} dangerouslySetInnerHTML={{__html: Html.sanitize(translated.html)}}/>
  );
};

/** Sanitized Librus HTML. Forwarded messages are rendered as nested quotes (split before translating - the separator is Polish). */
const RichText = ({html, className = ""}: { html: string; className?: string }) => {
  const [own, ...forwarded] = Html.splitForwarded(html);
  return (
    <div className={`rich-text flex flex-col gap-3 break-words ${className}`}>
      <Part html={own ?? ""}/>
      {forwarded.map((part, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static split of one message
        <blockquote key={index} className="border-l-4 border-base-300 bg-base-200 rounded-r-box p-3 text-base-content/80">
          <Part html={part}/>
        </blockquote>
      ))}
    </div>
  );
};

export default RichText;
