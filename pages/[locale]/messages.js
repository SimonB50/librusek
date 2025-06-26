import { useState } from "react";
import InfiniteScroll from "@rorygudka/react-infinite-scroller";
import DetailedMessageView from "@/components/messages/message_detailed_view";
import MessageItem from "@/components/messages/message_item_view";
import { useMessages, useMessageDetails, useMessageTags } from "@/lib/messages";
import Layout from "@/components/layout";
import { getStaticPaths, makeStaticProps } from "@/lib/i18n/getStatic";
import { useTranslation } from "react-i18next";

const getStaticProps = makeStaticProps(["messages", "common"]);
export { getStaticPaths, getStaticProps };

const MessagesPage = () => {
  const { t } = useTranslation(["messages"]);
  const [readMoreMessage, setReadMoreMessage] = useState(null);
  const [isInbox, setIsInbox] = useState(true);
  const { messageTags } = useMessageTags();

  const {
    data: messagesData,
    loading: messagesLoading,
    error: messagesError,
    loadMore: loadMoreMessages,
    resetBox: changeInbox,
  } = useMessages(isInbox);

  const {
    data: messageDetailsData,
    loading: messageDetailsLoading,
    error: messageDetailsError,
  } = useMessageDetails(readMoreMessage, isInbox);

  const handleReadMore = (messageId) => setReadMoreMessage(messageId);
  const handleReadMoreClose = () => setReadMoreMessage(null);
  const toggleMessages = () => {
    setIsInbox((prev) => !prev);
    changeInbox();
  };

  return (
    <Layout>
      {readMoreMessage && messageDetailsData ? (
        <DetailedMessageView
          message={messageDetailsData}
          onBack={handleReadMoreClose}
          tagsLibrary={messageTags}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col items-start gap-2">
            <h1 className="text-3xl font-semibold">{t("title")}</h1>
            <span className="text-xl font-semibold">
              {isInbox ? t("inbox") : t("outbox")}
            </span>
            <button className="btn btn-primary btn-outline" onClick={toggleMessages}>
              {isInbox ? t("switch_outbox") : t("switch_inbox")}
            </button>
          </div>

          {messagesData ? (
            <InfiniteScroll
              pageStart={0}
              loadMore={loadMoreMessages}
              hasMore={!messagesLoading && !messagesError}
              loader={
                <div className="skeleton h-24 w-full" key={0}>
                  {t("loading")}
                </div>
              }
              className="flex flex-col gap-2"
            >
              {messagesData.map((message) => (
                <MessageItem
                  key={message.messageId}
                  message={message}
                  isInbox={isInbox}
                  onClick={() => handleReadMore(message.messageId)}
                  tagsLibrary={messageTags}
                />
              ))}
            </InfiniteScroll>
          ) : (
            <div className="flex flex-col gap-2">
              {!messagesLoading && !messagesData?.length && (
                <div className="text-center text-xl font-semibold text-gray-500">
                  {t("no_messages")}
                </div>
              )}
              {messagesLoading &&
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
export default MessagesPage;
