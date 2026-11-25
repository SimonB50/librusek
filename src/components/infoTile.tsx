import type {ReactNode} from "react";

interface InfoTileProps {
  icon: ReactNode;
  title: ReactNode;
  children: ReactNode;
  badge?: ReactNode;
  /** Full text on hover - content is clamped to two lines, so long school names don't stretch the grid */
  hint?: string;
  /** Clamp content to two lines (default) - off for tiles with their own multi-line layout */
  clamp?: boolean;
}

/** Card used on the home page (student, school, class, lucky number...). */
const InfoTile = ({icon, title, children, badge, hint, clamp = true}: InfoTileProps) => (
  <div className="relative flex flex-row items-center gap-4 p-4 h-full bg-base-200 border border-base-300 rounded-box min-h-24" title={hint}>
    <div className="hidden sm:flex items-center justify-center size-12 shrink-0 rounded-box bg-base-100 text-2xl text-primary">{icon}</div>
    <div className="flex flex-col min-w-0 grow">
      <span className="text-xs uppercase tracking-wide text-base-content/60">{title}</span>
      <span className={`text-lg font-semibold leading-snug break-words ${clamp ? "line-clamp-2" : ""}`}>{children}</span>
    </div>
    {badge && <div className="absolute top-2 right-2">{badge}</div>}
  </div>
);

export default InfoTile;
