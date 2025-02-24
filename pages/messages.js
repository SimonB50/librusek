import { useState } from 'react';
import { Paperclip } from 'react-bootstrap-icons';
import { useMessages, getMessageDetail } from '@/lib/messages';
import { decodeAndCleanHtml, decodeBase64, formatDate, removeCDATA } from '@/lib/utils';
import Layout from '@/components/layout';

// Main page component for displaying messages
const MessagesPage = () => {
  const [pageNumber, setPageNumber] = useState(1);
  const [focusedMessage, setFocusedMessage] = useState(null);

  const messagesPerPage = parseInt(localStorage.getItem('messagesPageLimit'), 10) || 5;
  const { data: messagesData, loading, error } = useMessages(messagesPerPage, pageNumber);

  // Derived state for pagination
  const totalMessages = messagesData?.total || 0;
  const totalPages = Math.ceil(totalMessages / messagesPerPage);

  // Fetch detailed message data for modal
  const handleReadMore = async (message) => {
    try {
      const { messageDetail, error } = await getMessageDetail(message.messageId);
      if (error) throw new Error(error);
      setFocusedMessage(messageDetail);
      const modal = document.getElementById('message_modal');
      modal?.classList.remove('hidden');
    } catch (error) {
      console.error('Failed to fetch message details:', error);
    }
  };

  // Navigation handlers
  const handleNextPage = () => {
    if (pageNumber < totalPages) {
      setPageNumber((prev) => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (pageNumber > 1) {
      setPageNumber((prev) => prev - 1);
    }
  };

  // Modal component for displaying message details
  const MessageModal = () => {
    if (!focusedMessage) return null;

    const closeModal = () => {
      setFocusedMessage(null);
      document.getElementById('message_modal')?.classList.add('hidden');
    };

    return (
      <div
        id="message_modal"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        onClick={closeModal}
      >
        <div
          className="relative w-11/12 max-w-4xl bg-base-100 rounded-lg shadow-lg p-6 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="font-bold text-2xl text-base-content mb-2">
            {focusedMessage.topic}
          </h3>
          <div className="flex flex-row items-center gap-x-2 text-sm text-base-content/70">
            <span>{focusedMessage.senderName}</span>
            <span>-</span>
            <span>{formatDate(focusedMessage.sendDate)}</span>
          </div>
          <p className="py-4 text-base-content/80 min-h-[100px]">
            <MessageComponent message={focusedMessage.Message} />
          </p>
          {focusedMessage.isAnyFileAttached && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-lg text-base-content/60">
                <Paperclip />
              </span>
              <span className="text-sm font-medium text-warning">
                This message has an attachment. This app does not support attachments.
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render loading skeletons
  const renderLoadingSkeletons = () =>
    Array.from({ length: 3 }, (_, index) => (
      <div key={index} className="skeleton h-24 w-full" />
    ));

  // Render individual message item
  // Render individual message item
  const renderMessageItem = (message) => (
    <div
      key={message.messageId || 'unknown-id'} // Placeholder for messageId
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-base-200 rounded-box gap-2 p-4 cursor-pointer hover:bg-base-300 transition-colors duration-200"
      onClick={() => handleReadMore(message)}
    >
      <div className="flex flex-col gap-1 w-full">
        <span className="text-lg font-bold text-base-content">
          {message.topic || 'No topic available'}
        </span>
        <div className="flex flex-row items-center gap-x-2 text-sm text-base-content/70">
          <span>{message.senderName || 'Unknown sender'}</span>
          <span>-</span>
          <span>
            {message.sendDate ? formatDate(message.sendDate) : 'Date unavailable'}
          </span>
        </div>
        <span className="text-base-content/80">
          {removeCDATA(decodeBase64(message.content)) || 'No content available'}
          {/* If using MessageComponent: */}
          {/* <MessageComponent message={message.content || 'No content available'} /> */}
        </span>
        {message.isAnyFileAttached && (
          <div className="mt-1 flex items-center gap-2">
            <span className="text-lg text-base-content/60">
              <Paperclip />
            </span>
            <span className="text-sm font-medium text-warning">
              This message has an attachment. This app does not support attachments.
            </span>
          </div>
        )}
      </div>
    </div>
  );


  return (
    <Layout>
      <MessageModal />
      <div className="space-y-4">
        <span className="text-3xl font-semibold">Messages</span>
        <div className="flex flex-col gap-2">
          {loading
            ? renderLoadingSkeletons()
            : error
              ? <div className="text-red-500 text-center">{error}</div>
              : messagesData?.data?.length
                ? messagesData.data.map(renderMessageItem)//<div>{JSON.stringify(messagesData.data, null, 2)}</div>
                : <div className="text-center text-gray-500">No messages found</div>}
        </div>
        <div className="join flex justify-center gap-2">
          <button
            onClick={handlePreviousPage}
            className="join-item btn btn-outline"
            disabled={pageNumber === 1}
          >
            Previous
          </button>
          <button
            onClick={handleNextPage}
            className="join-item btn btn-outline"
            disabled={pageNumber >= totalPages}
          >
            Next
          </button>
        </div>
        {localStorage.getItem('developer') === 'true' && (
          <div className="text-center text-sm font-semibold">
            Total Messages: {totalMessages} | Page {pageNumber} of {totalPages}
          </div>
        )}
      </div>
    </Layout>
  );
};

// Component for rendering message content
const MessageComponent = ({ message, withBreaks = true }) => (
  <p
    dangerouslySetInnerHTML={{ __html: decodeAndCleanHtml(message, withBreaks) }}
  />
);

export default MessagesPage;