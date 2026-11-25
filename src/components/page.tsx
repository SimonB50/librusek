import type {ReactNode} from "react";
import {RiInboxLine} from "@remixicon/react";

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Buttons / filters on the right (stacked under the title on phones) */
  actions?: ReactNode;
}

const PageHeader = ({title, subtitle, actions}: PageHeaderProps) => (
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
    <div className="flex flex-col">
      <h1 className="text-3xl font-semibold">{title}</h1>
      {subtitle && <span className="text-base-content/70">{subtitle}</span>}
    </div>
    {actions && <div className="flex flex-row flex-wrap gap-2 w-full sm:w-fit">{actions}</div>}
  </div>
);

const SectionTitle = ({children, aside}: { children: ReactNode; aside?: ReactNode }) => (
  <div className="flex flex-row justify-between items-center gap-2 mt-2">
    <h2 className="text-2xl font-semibold">{children}</h2>
    {aside}
  </div>
);

const EmptyState = ({children, icon}: { children: ReactNode; icon?: ReactNode }) => (
  <div className="flex flex-col items-center justify-center gap-2 p-8 bg-base-200 border border-dashed border-base-300 rounded-box text-base-content/60 text-center">
    <span className="text-4xl">{icon ?? <RiInboxLine/>}</span>
    <span>{children}</span>
  </div>
);

interface TileProps {
  children: ReactNode;
  onClick?: () => void;
  /** Primary border - today / active / unread */
  highlight?: boolean;
  className?: string;
}

/** Card used for list entries across the app (same look as the old app, clickable when `onClick` is set). */
const Tile = ({children, onClick, highlight, className = ""}: TileProps) => {
  const base = `flex flex-col gap-2 p-4 bg-base-200 border rounded-box text-left ${highlight ? "border-primary" : "border-base-300"} ${className}`;
  if (!onClick) return <div className={base}>{children}</div>;
  return (
    <button type="button" onClick={onClick}
            className={`${base} w-full cursor-pointer transition-colors hover:bg-base-300 focus-visible:outline-2 focus-visible:outline-primary`}>
      {children}
    </button>
  );
};

const SkeletonList = ({count = 3, className = "h-24"}: { count?: number; className?: string }) => (
  <>
    {/* biome-ignore lint/suspicious/noArrayIndexKey: static placeholders */}
    {Array.from({length: count}, (_, index) => <div key={index} className={`skeleton ${className}`}></div>)}
  </>
);

export {PageHeader, SectionTitle, EmptyState, Tile, SkeletonList};
