"use client";

import { MESSAGE_PLACEHOLDERS } from "@/lib/placeholders";

export const MessageReceivers = ({ receivers }) => {
  if (!Array.isArray(receivers) || !receivers.length) {
    return (
      <span className="badge badge-outline mr-2 mb-1">
        {MESSAGE_PLACEHOLDERS.UNKNOWN_RECEIVER}
      </span>
    );
  }

  return receivers.map((receiver, index) => {
    const name =
      receiver.name ||
      `${receiver.firstName || ""} ${receiver.lastName || ""}`.trim() ||
      MESSAGE_PLACEHOLDERS.UNKNOWN_RECEIVER;
    return (
      <span key={index} className="badge badge-outline mr-2 mb-1">
        {name}
      </span>
    );
  });
};
