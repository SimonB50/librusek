import {useEffect} from "react";
import {useLocation, useSearch} from "wouter";

const PARAM = "open";

/**
 * Link to a page with one item's details already open, e.g. `detailsHref("/exams", 42)` → `/exams?open=42`.
 * The target page handles it with {@link useOpenFromLink}.
 */
const detailsHref = (path: string, id: string | number, extra?: Record<string, string>) =>
  `${path}?${new URLSearchParams({...extra, [PARAM]: String(id)})}`;

/**
 * Opens the details of the item named in `?open=<id>` once `items` are loaded, then drops the parameter
 * (replacing the history entry), so closing the modal and going back behave normally.
 * The parameter is dropped even when the item is not found (e.g. removed in the meantime).
 */
const useOpenFromLink = <T, >(items: readonly T[] | undefined, idOf: (item: T) => string | number, open: (item: T) => void) => {
  const search = useSearch();
  const [location, navigate] = useLocation();
  const target = new URLSearchParams(search).get(PARAM);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `idOf` / `open` are inline callbacks - only new data or a new target matter
  useEffect(() => {
    if (!target || !items) return;
    const item = items.find(entry => String(idOf(entry)) === target);
    const rest = new URLSearchParams(search);
    rest.delete(PARAM);
    navigate(rest.size ? `${location}?${rest}` : location, {replace: true});
    if (item) open(item);
  }, [target, items]);
};

/** Reads a plain query parameter (e.g. `?tab=substitutions`) - used next to {@link detailsHref}. */
const useSearchParam = (name: string) => new URLSearchParams(useSearch()).get(name);

/** Id of a timetable lesson in `?open=` links: `<date>_<lessonNo>` (lessons have no stable id of their own). */
const lessonLinkId = (date: string, lesson: { lessonNo: number }) => `${date}_${lesson.lessonNo}`;

export {detailsHref, lessonLinkId, useOpenFromLink, useSearchParam};
