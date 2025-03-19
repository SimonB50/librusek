"use client";

import { ExclamationTriangleFill } from "react-bootstrap-icons";

export const AttachmentWarning = ({ hasAttachment }) => {
  if (!hasAttachment) return null;

  return (
    <div className="flex badge badge-soft badge-warning gap-2 mt-2 p-2 border rounded-md">
      <ExclamationTriangleFill className="text-lg text-base-content/60" />
      This message has an attachment. Unsupported!
    </div>
  );
};
