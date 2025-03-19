"use client";

export const TagsList = ({ tags }) => {
  if (!tags?.length) return null;

  return (
    <span className="flex gap-2">
      {tags.map((tag, index) => (
        <span key={index} className="badge badge-neutral">
          {tag}
        </span>
      ))}
    </span>
  );
};
