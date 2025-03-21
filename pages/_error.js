import Layout from "@/components/layout";
import { useState } from "react";

const Error = () => {
  // User info
  const [userData, setUserData] = useState(null);

  return (
    <Layout setAuthData={setUserData}>
      <div className="flex flex-col items-center justify-center h-full">
        <span className="text-4xl font-semibold">An error occurred!</span>
        <span className="text-2xl font-semibold">
          Unexpected error occurred while trying to load the page.
        </span>
        <button
          className="btn btn-primary mt-4"
          onClick={() => window.history.back()}
        >
          Go back
        </button>
      </div>
    </Layout>
  );
};
export default Error;