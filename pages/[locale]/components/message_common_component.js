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
 * Renders a list of tags as neutral badges if tags exist.
 * @param {Object} props - Component props
 * @param {Array} props.tags - Array of tag strings to display
 * @returns {JSX.Element|null} List of tag badges or null if no tags
 */
const TagsList = ({ tags }) => {
  // If tags array is empty or undefined, render nothing
  if (!tags?.length) return null;

  return (
    <span className="flex gap-2">
      {tags.map((tag, index) => (
        // Display each tag in a neutral badge
        <span key={index} className="badge badge-neutral">
          {tag}
        </span>
      ))}
    </span>
  );
};
export { TagsList, MessageReceivers, AttachmentWarning };
export default AttachmentWarning;