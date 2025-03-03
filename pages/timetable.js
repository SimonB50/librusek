import Layout from "@/components/layout";
import { useTimetable } from "@/lib/timetable";
import { upperFirst } from "@/lib/utils";

import { useState } from "react";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { ChevronLeft, ChevronRight } from "react-bootstrap-icons";

dayjs.extend(isoWeek);

const Timetable = () => {
  const [date, setDate] = useState(
    dayjs().startOf("isoWeek").format("YYYY-MM-DD")
  );
  const {
    data: timetableData,
    loading: timetableLoading,
    error: timetableError,
  } = useTimetable(date);
  const weekDays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  return (
    <Layout>
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-col">
          <span className="text-3xl font-semibold">Timetable</span>
          <span className="text-lg">
            {dayjs(date).format("DD/MM/YYYY")} -{" "}
            {dayjs(date).add(4, "day").format("DD/MM/YYYY")}
          </span>
        </div>
        <div className="flex flex-row gap-2">
          <button
            className="btn btn-primary"
            onClick={() =>
              setDate(dayjs(date).subtract(1, "week").format("YYYY-MM-DD"))
            }
          >
            <ChevronLeft />
          </button>
          <button
            className="btn btn-primary"
            onClick={() =>
              setDate(dayjs(date).add(1, "week").format("YYYY-MM-DD"))
            }
          >
            <ChevronRight />
          </button>
        </div>
      </div>
      <div className="flex flex-row flex-wrap">
        {!timetableLoading && !timetableError ? (
          Object.keys(timetableData).map((day) => {
            const dayData = timetableData[day];
            if (dayjs(day).isoWeekday() > 5) return;
            return (
              <div
                className="flex flex-col basis-full md:basis-1/2 lg:basis-1/3 shrink-0 p-2 gap-3"
                key={day}
              >
                <span className="text-xl font-semibold">
                  {weekDays[dayjs(day).isoWeekday() - 1]}
                </span>
                <div className="flex flex-col gap-2">
                  {dayData.every((x) => x.length == 0) && (
                    <div className="flex flex-row justify-center items-center bg-base-200 border border-base-300 rounded-box p-3">
                      <span className="text-lg">No classes</span>
                    </div>
                  )}
                  {dayData
                    .filter((x) => x.length)
                    .map((entry, index) => {
                      return (
                        <div
                          className={`relative flex flex-row bg-base-200 border border-base-300 rounded-box p-3 justify-between items-center ${
                            entry[0].IsSubstitutionClass &&
                            "border border-primary"
                          }`}
                          key={index}
                        >
                          <div className="flex flex-col">
                            <span className="text-lg font-semibold">
                              {upperFirst(entry[0].Subject.Name)}
                            </span>
                            <span className="text-sm">
                              {entry[0].Teacher.FirstName}{" "}
                              {entry[0].Teacher.LastName}
                            </span>
                          </div>
                          <span className="text-base">
                            {entry[0].HourFrom} - {entry[0].HourTo}
                          </span>
                          {entry[0].IsCanceled && (
                            <div className="absolute flex top-0 right-0 w-full h-full bg-base-100 opacity-90 rounded-box items-center justify-center">
                              <span className="text-2xl font-bold text-primary rotate-3">
                                CANCELED
                              </span>
                            </div>
                          )}
                          {entry[0].IsSubstitutionClass && (
                            <div className="absolute badge badge-primary -top-2 -right-2">
                              Substitution
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            );
          })
        ) : (
          Array.from({ length: 5 }).map((_, index) => (
            <div
              className="flex flex-col basis-full md:basis-1/2 lg:basis-1/3 shrink-0 p-2 gap-3"
              key={index}
            >
              <div className="skeleton h-16 w-full rounded-box"></div>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
};
export default Timetable;
