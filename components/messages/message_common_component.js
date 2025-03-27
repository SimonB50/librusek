import { ExclamationTriangleFill } from "react-bootstrap-icons";
import { useTranslation } from "react-i18next";
import { getTextColor } from "@/lib/utils";

/**
 * AttachmentWarning Component
 * Displays a warning badge when a message has an unsupported attachment.
 * @param {Object} props - Component props
 * @param {boolean} props.hasAttachment - Indicates if there is an attachment
 * @returns {JSX.Element|null} Warning badge or null if no attachment
 */
const AttachmentWarning = ({ hasAttachment }) => {
  const { t } = useTranslation("messages"); // Hook to access translations from 'messages' namespace

  // If there’s no attachment, render nothing
  if (!hasAttachment) return null;

  return (
    <div className="flex badge badge-soft badge-warning gap-2 mt-2 p-2 border rounded-md">
      {/* Warning icon with styling for visibility */}
      <ExclamationTriangleFill className="text-lg text-base-content/60" />
      {/* Translated warning message for unsupported file */}
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
  const { t } = useTranslation(); // Hook to access default translations

  // Check if receivers is not an array or is empty; display "missing receiver" badge
  if (!Array.isArray(receivers) || !receivers.length) {
    return (
      <span className="badge badge-outline mr-2 mb-1">
        {t("missing.receiver")}
      </span>
    );
  }
  // TODO: If the recipient is me (always), I should have a decoration "badge-outline", and other recipients should have the "badge-soft" outline. I should be at the beginning.
  // Map through receivers and display their names or a fallback
  return receivers.map((receiver, index) => {
    // Determine display name: use 'name', combine 'firstName' and 'lastName', or fallback to "missing receiver"
    const name =
      receiver.name ||
      `${receiver.firstName || ""} ${receiver.lastName || ""}`.trim() ||
      t("missing.receiver");
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


  // Basic validation
  if (!Array.isArray(tags) || tags.length === 0) {
    return null; // Return null if no tags are available
  }

  if (!Array.isArray(tagsLibrary) || tagsLibrary.length === 0) {
    console.warn("tags library is invalid");
    return null; // Return null if the tags library is invalid
  }

  return (
    <div className="flex gap-2">
      {tags.map((tagObj) => {
        // Find the corresponding tag in tagsLibrary
        const tag = tagsLibrary.find((t) => t.tagId === tagObj.id);

        // Default values if tag not found
        const tagName = tag?.name || `Tag ${tagObj.id}`;
        const tagColor = tag?.colorRGB ? `#${tag.colorRGB}` : "#gray";
        const textColor = getTextColor(tagColor);

        return (
          <span
            key={tagObj.id} // Use tagObj.id for the key
            className="badge badge-neutral"
            style={{ backgroundColor: tagColor, color: textColor }} // Use textColor for the text
          >
            {tagName}
          </span>
        );
      })}
    </div>
  );
};

export { TagsList, MessageReceivers, AttachmentWarning };
export default AttachmentWarning;
