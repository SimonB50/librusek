import {useState} from "react";
import {RiMegaphoneLine} from "@remixicon/react";
import {useTranslation} from "react-i18next";
import {markNoticeRead, SchoolNotices} from "../../../client/resources/index.js";
import type {SchoolNoticeData} from "../../../client/types/index.js";
import {Modal} from "../../../components/modal.js";
import {TeacherName} from "../../../components/names.js";
import {EmptyState, SectionTitle, SkeletonList, Tile} from "../../../components/page.js";
import {QueryState} from "../../../components/queryState.js";
import RichText from "../../../components/richText.js";
import {T, TranslateToggle, TranslationScope} from "../../../components/translate.js";
import DateUtils from "../../../lib/date.js";
import Html from "../../../lib/html.js";

const byNewest = (a: SchoolNoticeData, b: SchoolNoticeData) =>
  DateUtils.parse(b.creationDate).getTime() - DateUtils.parse(a.creationDate).getTime();

/** School notices. Opening an unread one marks it as read on Synergia (`SchoolNotices/MarkAsRead`). */
const Announcements = () => {
  const {t} = useTranslation("landing");
  const [focused, setFocused] = useState<SchoolNoticeData | null>(null);

  const open = (notice: SchoolNoticeData) => {
    setFocused(notice);
    if (!notice.wasRead) markNoticeRead(notice.id).catch((error: unknown) => console.error("Could not mark the notice as read", error));
  };

  return (
    <div className="flex flex-col gap-3">
      <SectionTitle>{t("announcements.title")}</SectionTitle>
      <QueryState query={SchoolNotices.useQuery()} loading={<SkeletonList count={2}/>}>
        {notices => notices.length === 0
          ? <EmptyState icon={<RiMegaphoneLine/>}>{t("announcements.empty")}</EmptyState>
          : (
            <div className="flex flex-col gap-2">
              {[...notices].sort(byNewest).map(notice => (
                <Tile key={notice.id} highlight={!notice.wasRead} onClick={() => open(notice)}>
                  <div className="flex flex-row justify-between items-start gap-2">
                    <span className="text-lg font-bold"><T text={notice.subject}/></span>
                    {!notice.wasRead && <span className="badge badge-primary badge-sm shrink-0">{t("announcements.new")}</span>}
                  </div>
                  <span className="text-sm text-base-content/70 line-clamp-2"><T text={Html.toText(notice.content)}/></span>
                  <span className="text-xs text-base-content/60">
                    <TeacherName id={notice.addedBy.id}/> · {DateUtils.formatDate(notice.creationDate)}
                  </span>
                </Tile>
              ))}
            </div>
          )}
      </QueryState>
      <TranslationScope id={focused?.id}>
      <Modal
        open={focused !== null}
        onClose={() => setFocused(null)}
        title={focused && <T text={focused.subject}/>}
        subtitle={focused && <><TeacherName id={focused.addedBy.id}/> · {DateUtils.formatDateTime(focused.creationDate)}</>}
        className="sm:max-w-2xl"
      >
        {focused && (
          <>
            <span className="badge badge-soft badge-sm">
              {t("announcements.valid", {from: DateUtils.formatDate(focused.startDate), to: DateUtils.formatDate(focused.endDate)})}
            </span>
            <TranslateToggle/>
            <RichText html={focused.content} className="text-base-content/90"/>
          </>
        )}
      </Modal>
      </TranslationScope>
    </div>
  );
};

export default Announcements;
