import { useState } from "react";
import InfiniteScroll from "@rorygudka/react-infinite-scroller";
import DetailedMessageView from "@/components/messages/message_detailed_view";
import MessageItem from "@/components/messages/message_item_view";
import { useNotes, useNoteDetails } from "@/lib/notes";
import Layout from "@/components/layout";
import { getStaticPaths, makeStaticProps } from "@/lib/i18n/getStatic";
import { useTranslation } from "react-i18next";

const getStaticProps = makeStaticProps(["messages", "common"]);
export { getStaticPaths, getStaticProps };

const NotesPage = () => {
  const { t } = useTranslation(["messages"]);
  const [readMoreNote, setReadMoreNote] = useState(null);

  const {
    data: notesData,
    loading: notesLoading,
    error: notesError,
    loadMore: loadMoreNotes,
  } = useNotes();

  const {
    data: noteDetailsData,
    loading: noteDetailsLoading,
    error: noteDetailsError,
  } = useNoteDetails(readMoreNote);

  const handleReadMore = (noteId) => setReadMoreNote(noteId);
  const handleReadMoreClose = () => setReadMoreNote(null);

  return (
    <Layout>
      {readMoreNote && noteDetailsData ? (
        <DetailedMessageView
          message={noteDetailsData}
          onBack={handleReadMoreClose}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col items-start gap-2">
            <h1 className="text-3xl font-semibold">{t("notes_title")}</h1>
          </div>

          {notesData ? (
            <InfiniteScroll
              pageStart={0}
              loadMore={loadMoreNotes}
              hasMore={!notesLoading && !notesError}
              loader={
                <div className="skeleton h-24 w-full" key={0}>
                  {t("loading")}
                </div>
              }
              className="flex flex-col gap-2"
            >
              {notesData.map((note) => (
                <MessageItem
                  key={note.messageId}
                  message={note}
                  isInbox={true} // Notes are always considered 'inbox'
                  onClick={() => handleReadMore(note.messageId)}
                />
              ))}
            </InfiniteScroll>
          ) : (
            <div className="flex flex-col gap-2">
              {!notesLoading && !notesData?.length && (
                <div className="text-center text-xl font-semibold text-gray-500">
                  {t("no_notes")}
                </div>
              )}
              {notesLoading &&
                Array.from({ length: 3 }, (_, index) => (
                  <div key={index} className="skeleton h-24 w-full" />
                ))}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};
export default NotesPage;
