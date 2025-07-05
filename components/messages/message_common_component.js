import { ExclamationTriangleFill } from "react-bootstrap-icons";
import { useTranslation } from "react-i18next";

/**
 * AttachmentWarning Component
 * Displays a warning badge when a message has an unsupported attachment.
 * @param {Object} props - Component props
 * @param {boolean} props.hasAttachment - Indicates if there is an attachment
 * @returns {JSX.Element|null} Warning badge or null if no attachment
 */
const AttachmentWarning = ({ hasAttachment }) => {
  const { t } = useTranslation("messages");

  // If there’s no attachment, render nothing
  if (!hasAttachment) return null;

  return (
    <div className="flex flex-row text-warning gap-2 mt-2 p-1 flex-wrap">
      <ExclamationTriangleFill className="text-lg" />
      {t("file_unsupported")}
    </div>
  );
};

/**
 * MessageReceivers Component
 * Displays a list of receivers as badges, handling cases where data is missing or incomplete.
 * @param {Object} props - Component props
 * @param {Array} props.receivers - Array of receiver objects with name, firstName, or lastName properties
 * @returns {JSX.Element} List of receiver badges or a single "missing receiver" badge
 */
const MessageReceivers = ({ receivers }) => {
  const { t } = useTranslation("messages"); // Hook to access translations from "messages" namespace

  // Check if receivers is not an array or is empty; display "Me" badge
  if (!Array.isArray(receivers) || !receivers.length) {
    return (
      <span className="badge badge-outline mr-2 mb-1">
        {t("me")}
      </span>
    );
  }
  // TODO: If the recipient is me (always), I should have a decoration "badge-outline", and other recipients should have the "badge-soft" outline. I should be at the beginning.
  return receivers
    .filter((x) => receivers.indexOf(x) <= 4)
    .map((receiver, index) => {
      let name =
        receiver.name ||
        `${receiver.firstName || ""} ${receiver.lastName || ""}`.trim() ||
        t("missing.receiver");
      name = name.replace("liczba odbiorców: ", "");
      if (index == 4)
        return (
          <span key={index} className="badge badge-outline mr-2 mb-1">
            +{receivers.length - 5}
          </span>
        );
      return (
        <span key={index} className="badge badge-outline mr-2 mb-1">
          {name}
        </span>
      );
    });
};

/**
 * TagsList Component
 * Renders a list of tags as badges with colors from tag data.
 *
 * @param {Object} props - Component props
 * @param {Array} props.tags - Array of tag objects with id (e.g., [{ id: 41421 }, { id: 41422 }])
 * @param {Array} props.tagsLibrary - Array of tag details (e.g., [{ tagId: 41421, name: 'Tag Name', colorRGB: '80ff80' }, ...])
 * @returns {JSX.Element|null} List of tag badges or null if validation fails
 */
const TagsList = ({ tags, tagsLibrary }) => {
  if (!Array.isArray(tags) || tags.length === 0) {
    return null; // Return null if no tags are available
  }

  if (!Array.isArray(tagsLibrary) || tagsLibrary.length === 0) {
    console.warn("tags library is invalid");
    return null;
  }

  return (
    <div className="flex gap-2">
      {tags.map((tagObj) => {
        const tag = tagsLibrary.find((t) => t.tagId === tagObj.id);

        // Default values if tag not found
        const tagName = tag?.name || `Tag ${tagObj.id}`;

        return (
          <span key={tagObj.id} className="badge badge-neutral">
            {tagName}
          </span>
        );
      })}
    </div>
  );
};

export { TagsList, MessageReceivers, AttachmentWarning };
export default AttachmentWarning;
