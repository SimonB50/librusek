import Layout from "@/components/layout";
import { Person } from "react-bootstrap-icons";
import { useState } from "react";
import { useNotes } from "@/lib/user";
import { upperFirst } from "@/lib/utils";
import { useTeachers } from "@/lib/school";
import { useBehaviourGrades, useBehaviourGradesTypes } from "@/lib/grades";
import { getStaticPaths, makeStaticProps } from "@/lib/i18n/getStatic";
import { useTranslation } from "react-i18next";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { FileOpener } from "@capawesome-team/capacitor-file-opener";

const getStaticProps = makeStaticProps(["profile", "common"]);
export { getStaticPaths, getStaticProps };

const Profile = () => {
  const { t } = useTranslation(["profile", "common"]);

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
    behaviourGradesData && behaviourGradesData.length
      ? behaviourGradesData.map((x) => x.GradeType.Id).join(",")
      : false
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
    notesData && notesData.length
      ? notesData.map((x) => x.Teacher.Id).join(",")
      : false
  );

  return (
    <Layout setAuthData={setUserData}>
      {userData ? (
        <div className="flex flex-row gap-2 items-center bg-base-200 border border-base-300 rounded-box p-4 mt-4">
          <div className="flex items-center justify-center bg-base-100 rounded-box h-24 w-24">
            <Person className="text-5xl text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-3xl font-semibold">
              {userData.Account.FirstName} {userData.Account.LastName}
            </span>
            <span className="text-lg">{userData.Account.Email}</span>
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
          <span className="text-3xl font-semibold">{t("behaviour.title")}</span>
          {behaviourGradesData && behaviourGradesData.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
              {behaviourGradesData
                .sort((a, b) => new Date(b.AddDate) - new Date(a.AddDate))
                .map((grade) => (
                  <div
                    key={grade.Id}
                    className="flex flex-col gap-1 rounded-box p-4 bg-base-200 border border-base-300 justify-between"
                  >
                    <div className="flex flex-col">
                      <span className="text-2xl font-semibold">
                        {upperFirst(
                          behaviourGradesTypesData.find(
                            (x) => x.Id == grade.GradeType.Id
                          ).Name
                        )}
                      </span>
                      <span className="text-md">
                        {t("common.school.semester", {
                          ns: "common",
                          semester: "I".repeat(parseInt(grade.Semester)),
                        })}{" "}
                        -{" "}
                        {grade.IsProposal == "1"
                          ? t("behaviour.proposal")
                          : t("behaviour.final")}
                      </span>
                    </div>
                  </div>
                ))}
              {behaviourGradesData.length % 2 == 1 && (
                <div className="flex rounded-box p-4 bg-base-200 border border-base-300 justify-center items-center">
                  <span className="text-lg text-primary text-center">
                    {t("behaviour.awaiting_final")}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <span className="text-lg">{t("behaviour.empty")}</span>
          )}
        </div>
      ) : (
        <></>
      )}
      <div className="flex flex-col gap-2 mt-4">
        <span className="text-3xl font-semibold">{t("notes.title")}</span>
        {!notesLoading && !notesError ? (
          notesData && notesData.length ? (
            notesData.map((note) => (
              <div
                key={note.Id}
                className={`flex flex-col gap-1 rounded-box p-4 bg-base-200 justify-between border ${
                  note.Positive ? "border-success" : "border-error"
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-xl font-semibold">
                    {note.Positive ? "Positive" : "Negative"}
                  </span>
                  <span className="text-md">{note.Text}</span>
                </div>
                {!teachersLoading && !teachersError && (
                  <span className="text-sm text-primary">
                    {t("notes.added_by", {
                      teacher: `${upperFirst(
                        teachersData.find((x) => x.Id == note.Teacher.Id)
                          .FirstName
                      )} ${upperFirst(teachersData.find((x) => x.Id == note.Teacher.Id).LastName)}`,
                      date: note.Date,
                    })}
                  </span>
                )}
              </div>
            ))
          ) : (
            <span className="text-lg">{t("notes.empty")}</span>
          )
        ) : (
          <div className="skeleton h-24 w-full"></div>
        )}
      </div>
      <div className="flex flex-col gap-2 mt-4">
        <span className="text-3xl font-semibold">Personal data access</span>
        <button
          className="btn btn-primary btn-outline"
          onClick={async () => {
            const filepath = await Filesystem.downloadFile({
              path: "SynergiaPersonalData.pdf",
              url: "https://synergia.librus.pl/wydruki/wydruk_danych_osobowych/420.pdf",
              directory: Directory.Cache,
              recursive: true,
            });
            console.log(filepath.path);
            await FileOpener.openFile({
              path: `file://${filepath.path}`,
            });
          }}
        >
          Download data stored by Synergia
        </button>
      </div>
    </Layout>
  );
};
export default Profile;
