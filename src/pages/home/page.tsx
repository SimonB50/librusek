import {useTranslation} from "react-i18next";
import {AccountInfo, Announcements, ClassInfo, CurrentLesson, LuckyNumber, SchoolInfo, Upcoming, VersionInfo} from "./components/index.js";

const Page = () => {
  const {t} = useTranslation("landing");
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold">
        {t("welcome.part1")} <span className="text-primary font-bold">{t("welcome.part2")}</span>!
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
        <CurrentLesson/>
        <AccountInfo/>
        <ClassInfo/>
        <SchoolInfo/>
        <LuckyNumber/>
        <VersionInfo/>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Phones: the next days first, announcements below */}
        <div className="xl:col-span-3 order-2 xl:order-1"><Announcements/></div>
        <div className="xl:col-span-2 order-1 xl:order-2"><Upcoming/></div>
      </div>
    </div>
  )
}

export default Page;
