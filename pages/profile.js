import Layout from "@/components/layout";
import { Person } from "react-bootstrap-icons";
import { useState } from "react";
import { useNotes } from "@/lib/user";
import { deduplicate, upperFirst } from "@/lib/utils";
import { useTeachers } from "@/lib/school";
import { useBehaviourGrades, useBehaviourGradesTypes } from "@/lib/grades";

const Profile = () => {
  // User info
  const [userData, setUserData] = useState(null);

  // Behaviour
  const {
    data: behaviourGradesData,
    loading: behaviourGradesLoading,
    error: behaviourGradesError,
  } = useBehaviourGrades();
  const {
    data: behaviourGradesTypesData,
    loading: behaviourGradesTypesLoading,
    error: behaviourGradesTypesError,
  } = useBehaviourGradesTypes(
    deduplicate([
      ...(behaviourGradesData
        ? behaviourGradesData.Grades.map((x) => x.GradeType.Id)
        : []),
    ]).join(",")
  );

  // Notes data
  const {
    data: notesData,
    loading: notesLoading,
    error: notesError,
  } = useNotes();
  const {
    data: teachersData,
    loading: teachersLoading,
    error: teachersError,
  } = useTeachers(
    deduplicate([
      ...(notesData ? notesData.Notes.map((x) => x.Teacher.Id) : []),
    ]).join(",")
  );

  return (
    <Layout setAuthData={setUserData}>
      <div className="flex flex-col">
        <span className="text-3xl font-semibold">Profile</span>
        <span className="text-lg">Your profile information.</span>
      </div>
      {userData ? (
        <div className="flex flex-row gap-2 items-center bg-base-200 rounded-box p-4 mt-4">
          <div className="flex items-center justify-center bg-base-100 rounded-box h-24 w-24">
            <Person className="text-5xl text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-3xl font-semibold">
              {userData.Me.Account.FirstName} {userData.Me.Account.LastName}
            </span>
            <span className="text-lg">{userData.Me.Account.Email}</span>
          </div>
        </div>
      ) : (
        <div className="skeleton h-24 w-full"></div>
      )}
      {!behaviourGradesLoading &&
      !behaviourGradesError &&
      !behaviourGradesTypesLoading &&
      !behaviourGradesTypesError ? (
        <div className="flex flex-col mt-4">
          <span className="text-3xl font-semibold">Behaviour</span>
          {behaviourGradesData.Grades.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
              {behaviourGradesData.Grades.sort(
                (a, b) => new Date(b.AddDate) - new Date(a.AddDate)
              ).map((grade) => (
                <div
                  key={grade.Id}
                  className="flex flex-col gap-1 rounded-box p-4 bg-base-200 justify-between"
                >
                  <div className="flex flex-col">
                    <span className="text-2xl font-semibold">
                      {upperFirst(
                        behaviourGradesTypesData.Types.find(
                          (x) => x.Id == grade.GradeType.Id
                        ).Name
                      )}
                    </span>
                    <span className="text-md">
                      Semester {"I".repeat(parseInt(grade.Semester))} -{" "}
                      {grade.IsProposal == "1" ? "Proposal" : "Final"}
                    </span>
                  </div>
                </div>
              ))}
              {behaviourGradesData.Grades.length % 2 == 1 && (
                <div className="flex rounded-box p-4 bg-base-200 justify-center items-center">
                  <span className="text-lg text-primary text-center">
                    Awaiting final grade
                  </span>
                </div>
              )}
            </div>
          ) : (
            <span className="text-lg">No behaviour grades available.</span>
          )}
        </div>
      ) : (
        <></>
      )}
      {!notesLoading && !notesError ? (
        <div className="flex flex-col mt-4">
          <span className="text-3xl font-semibold">Notes</span>
          {notesData.Notes.length > 0 ? (
            <div className="flex flex-col gap-4 mt-4">
              {notesData.Notes.map((note) => (
                <div
                  key={note.Id}
                  className="flex flex-col gap-1 rounded-box p-4 bg-base-200 justify-between"
                >
                  <div className="flex flex-col">
                    <span className="text-xl font-semibold">
                      {note.Positive > 0 ? "Positive" : "Negative"}
                    </span>
                    <span className="text-md">{note.Text}</span>
                  </div>
                  {!teachersLoading && !teachersError && (
                    <span className="text-sm text-primary">
                      Added by{" "}
                      {
                        teachersData.Users.find((x) => x.Id == note.Teacher.Id)
                          .FirstName
                      }{" "}
                      {
                        teachersData.Users.find((x) => x.Id == note.Teacher.Id)
                          .LastName
                      }{" "}
                      at {note.Date}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <span className="text-lg">No notes available.</span>
          )}
        </div>
      ) : (
        <div className="skeleton h-24 w-full mt-4"></div>
      )}
    </Layout>
  );
};
export default Profile;
