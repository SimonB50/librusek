import Layout from "@/components/layout";

import { useSchool } from "@/lib/school";
import { useClass } from "@/lib/class";
import { useLuckyNumber } from "@/lib/lessons";

import { useState, useEffect } from "react";
import { Buildings, People, Star, Person, Git } from "react-bootstrap-icons";
import { getVersion } from '@tauri-apps/api/app';
import { useVersion } from "@/lib/core";

const Home = () => {
  // User info
  const [userData, setUserData] = useState(null);

  // Landing page data
  const {
    data: schoolData,
    loading: schoolLoading,
    error: schoolError,
  } = useSchool();
  const {
    data: classData,
    loading: classLoading,
    error: classError,
  } = useClass();
  const {
    data: luckyNumberData,
    loading: luckyNumberLoading,
    error: luckyNumberError,
  } = useLuckyNumber();
  const {
    data: versionData,
    loading: versionLoading,
    error: versionError,
  } = useVersion();

  return (
    <Layout setAuthData={setUserData}>
      <span className="text-3xl font-bold">
        Welcome to <span className="text-primary">Synergia</span>!
      </span>
      <div className="grid grid-cols-6 gap-2 mt-4">
        {userData ? (
          <div className="col-span-6 md:col-span-3 flex flex-row items-center p-4 bg-base-200 rounded-box">
            <Person className="hidden sm:block text-5xl text-primary" />
            <div className="flex flex-col ml-4">
              <span className="text-2xl font-bold">Student</span>
              <span>
                {userData.Me.Account.FirstName} {userData.Me.Account.LastName}
              </span>
            </div>
          </div>
        ) : (
          <div className="col-span-6 md:col-span-3 skeleton h-24"></div>
        )}
        {!schoolLoading && !schoolError ? (
          <div className="col-span-6 md:col-span-3 flex flex-row items-center p-4 bg-base-200 rounded-box">
            <Buildings className="hidden sm:block text-5xl text-primary" />
            <div className="flex flex-col ml-4">
              <span className="text-2xl font-bold">School</span>
              <span>{schoolData.School.Name}</span>
            </div>
          </div>
        ) : (
          <div className="col-span-6 md:col-span-3 skeleton h-24"></div>
        )}
        {!classLoading && !classError ? (
          <div className="col-span-6 md:col-span-2 flex flex-row items-center p-4 bg-base-200 rounded-box">
            <People className="hidden sm:block text-5xl text-primary" />
            <div className="flex flex-col ml-4">
              <span className="text-2xl font-bold">Class</span>
              <span>
                {classData.Class.Number}
                {classData.Class.Symbol} (
                {parseInt(classData.Class.EndSchoolYear.split("-")[0]) -
                  parseInt(classData.Class.Number)}
                -{classData.Class.EndSchoolYear.split("-")[0]})
              </span>
            </div>
          </div>
        ) : (
          <div className="col-span-6 md:col-span-2 skeleton h-24"></div>
        )}
        {!luckyNumberLoading && !luckyNumberError ? (
          <div className="col-span-6 md:col-span-2 flex flex-row items-center p-4 bg-base-200 rounded-box">
            <Star className="hidden sm:block text-5xl text-primary" />
            <div className="flex flex-col ml-4">
              <span className="text-2xl font-bold">Lucky number</span>
              <span>
                {luckyNumberData.LuckyNumber.LuckyNumber} (As of{" "}
                {luckyNumberData.LuckyNumber.LuckyNumberDay})
              </span>
            </div>
          </div>
        ) : (
          <div className="col-span-6 md:col-span-2 skeleton h-24"></div>
        )}
        {
          !versionLoading && !versionError ? (
            <div className="relative col-span-6 md:col-span-2 flex flex-row items-center p-4 bg-base-200 rounded-box">
              <Git className="hidden sm:block text-5xl text-primary" />
              <div className="flex flex-col ml-4">
                <span className="text-2xl font-bold">Version</span>
                <span>v{versionData?.currentVersion}</span>
              </div>
              <div className="absolute top-0 right-0 p-2">
                {versionData?.updateAvailable && (
                  <span className="badge badge-primary">Update available</span>
                )}
              </div>
            </div>
          ) : (
            <div className="col-span-6 md:col-span-2 skeleton h-24"></div>
          )
        }
      </div>
    </Layout>
  );
};
export default Home;
