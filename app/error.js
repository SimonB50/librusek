"use client";

const Error = ({ error, reset }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <span className="text-4xl font-semibold">An error occurred!</span>
      <span className="text-2xl font-semibold">
        Unexpected error occurred while trying to load the page.
      </span>
      {error && (
        <span className="text-xl text-red-500 mt-2">{error.message}</span>
      )}
      <button
        className="btn btn-primary mt-4"
        onClick={() => window.history.back()}
      >
        Go back
      </button>
    </div>
  );
};
export default Error;
