const portalUrl = "https://portal.librus.pl";
const authUrl = "https://api.librus.pl";
const synergiaUrl = "https://synergia.librus.pl";
const apiUrl = `${synergiaUrl}/gateway/api/2.0`;
const messagesAppUrl = "https://wiadomosci.librus.pl";
const messagesUrl = `${messagesAppUrl}/api`;

/**
 * Every endpoint the app knows about.
 *
 * Sources: the old app and the official "alternative view" web client
 * (`synergia.librus.pl/gateway/ms/studentdatapanel/ui`, messages: `wiadomosci.librus.pl/nowy`).
 * Synergia list endpoints also accept ids: `/Subjects/0,1,2` (see `Request.buildUrl`).
 */
const remotePaths = {
  base: {
    portal: portalUrl,
    synergia: synergiaUrl,
    api: apiUrl,
    messagesApp: messagesAppUrl,
    messages: messagesUrl,
  },
  /** Printouts (PDF) served by Synergia with the regular session cookies */
  printouts: {
    personalData: `${synergiaUrl}/wydruki/wydruk_danych_osobowych/420.pdf`,
  },
  auth: {
    form: `${portalUrl}/rodzina/synergia/loguj`,
    init: () => `${synergiaUrl}/loguj/portalRodzina?v=${Date.now() / 1000}`,
    login: `${authUrl}/OAuth/Authorization?client_id=46`,
    mfa: `${authUrl}/OAuth/Authorization/2FA?client_id=46`,
    perform: `${authUrl}/OAuth/Authorization/PerformLogin?client_id=46`,
    grant: `${authUrl}/OAuth/Authorization/Grant?client_id=46`,
    token: `${apiUrl}/Auth/TokenInfo`,
    user: (identifier: string) => `${apiUrl}/Auth/UserInfo/${identifier}`,
    /** Extends the Synergia session - the official client calls it on every `401`. */
    refresh: `${synergiaUrl}/refreshToken`,
    /** Redirect chain ending at wiadomosci.librus.pl - activates the messages session. */
    messages: `${synergiaUrl}/wiadomosci3`,
    logout: `${synergiaUrl}/wyloguj`,
  },
  resources: {
    // Account
    me: `${apiUrl}/Me`,
    schoolInfo: `${apiUrl}/Auth/SchoolInfo`,
    schoolModuleAccess: `${apiUrl}/Auth/SchoolModuleAccess`,
    photo: `${apiUrl}/Auth/Photos`,
    notes: `${apiUrl}/Notes`,
    noteCategories: `${apiUrl}/Notes/Categories`,
    /** Keyed by `Me.account.id` */
    surveys: (accountId: number) => `${apiUrl}/Surveys/${accountId}`,
    surveyDetails: (surveyId: number | string) => `${apiUrl}/Surveys/Details/${surveyId}`,
    notificationDeferrals: (accountId: number) => `${apiUrl}/NotificationCenterDeferrals/${accountId}`,
    accessibilitySettings: (accountId: number) => `${apiUrl}/WcagSettings/${accountId}`,
    /** Keyed by `Me.account.userId` */
    studentDuties: (userId: number) => `${apiUrl}/StudentDuty/${userId}`,
    examResults: (userId: number) => `${apiUrl}/ExamResult/${userId}`,
    /** Returns 500 for some accounts - the official client uses `ChangeRegister` + `PushChanges` instead. */
    notificationCenter: `${apiUrl}/NotificationCenter`,
    // School
    school: `${apiUrl}/Schools`,
    units: `${apiUrl}/Units`,
    class: `${apiUrl}/Classes`,
    virtualClasses: `${apiUrl}/VirtualClasses`,
    users: `${apiUrl}/Users`,
    subjects: `${apiUrl}/Subjects`,
    lessons: `${apiUrl}/Lessons`,
    classrooms: `${apiUrl}/Classrooms`,
    colors: `${apiUrl}/Colors`,
    schoolNotices: `${apiUrl}/SchoolNotices`,
    /** `POST`, no body. */
    schoolNoticeMarkAsRead: (id: string | number) => `${apiUrl}/SchoolNotices/MarkAsRead/${id}`,
    luckyNumber: `${apiUrl}/LuckyNumbers`,
    schoolFiles: `${apiUrl}/SchoolFiles`,
    schoolTrips: `${apiUrl}/SchoolTrips`,
    help: `${apiUrl}/Help`,
    libraryLendings: `${apiUrl}/EbiblioLendings`,
    // Grades
    grades: `${apiUrl}/Grades`,
    gradeCategories: `${apiUrl}/Grades/Categories`,
    gradeComments: `${apiUrl}/Grades/Comments`,
    gradeAverages: `${apiUrl}/Grades/Averages`,
    gradeTypes: `${apiUrl}/Grades/Types`,
    gradeScales: `${apiUrl}/Grades/Scales`,
    pointGrades: `${apiUrl}/PointGrades`,
    pointGradeCategories: `${apiUrl}/PointGrades/Categories`,
    pointGradeComments: `${apiUrl}/PointGrades/Comments`,
    pointGradeDictionaries: `${apiUrl}/PointGrades/Dictionaries`,
    textGrades: `${apiUrl}/TextGrades`,
    textGradeCategories: `${apiUrl}/TextGrades/Categories`,
    textGradeComments: `${apiUrl}/TextGrades/Comments`,
    descriptiveGrades: `${apiUrl}/DescriptiveGrades`,
    descriptiveGradeSkills: `${apiUrl}/DescriptiveGrades/Skills`,
    descriptiveGradeComments: `${apiUrl}/DescriptiveGrades/Comments`,
    descriptiveTextGrades: `${apiUrl}/DescriptiveTextGrades`,
    descriptiveTextGradeSkills: `${apiUrl}/DescriptiveTextGrades/Skills`,
    behaviourGrades: `${apiUrl}/BehaviourGrades`,
    behaviourGradeTypes: `${apiUrl}/BehaviourGrades/Types`,
    behaviourPointGrades: `${apiUrl}/BehaviourGrades/Points`,
    behaviourPointGradeCategories: `${apiUrl}/BehaviourGrades/Points/Categories`,
    behaviourPointGradeComments: `${apiUrl}/BehaviourGrades/Points/Comments`,
    // Attendance
    attendances: `${apiUrl}/Attendances`,
    attendanceTypes: `${apiUrl}/Attendances/Types`,
    justifications: `${apiUrl}/Justifications`,
    // Schedule
    timetables: `${apiUrl}/Timetables`,
    timetableEntries: `${apiUrl}/TimetableEntries`,
    realizations: `${apiUrl}/Realizations`,
    plannedLessons: `${apiUrl}/PlannedLessons`,
    homeWorks: `${apiUrl}/HomeWorks`,
    homeWorkCategories: `${apiUrl}/HomeWorks/Categories`,
    homeWorkAssignments: `${apiUrl}/HomeWorkAssignments`,
    homeWorkAssignmentCategories: `${apiUrl}/HomeWorkAssignments/Categories`,
    /** `{ DownloadUrl }` - `<owner>-<attachment>` ids, exact meaning unverified */
    homeWorkAssignmentAttachment: (id: string) => `${apiUrl}/HomeWorkAssignments/Attachment/${id}`,
    realizationAttachment: (id: string) => `${apiUrl}/Realizations/Attachment/${id}`,
    plannedLessonAttachment: (id: string) => `${apiUrl}/PlannedLessons/Attachment/${id}`,
    calendars: `${apiUrl}/Calendars`,
    calendar: (calendarId: string) => `${apiUrl}/Calendars/${calendarId}`,
    teacherFreeDays: `${apiUrl}/Calendars/TeacherFreeDays`,
    schoolFreeDays: `${apiUrl}/Calendars/SchoolFreeDays`,
    classFreeDays: `${apiUrl}/Calendars/ClassFreeDays`,
    substitutions: `${apiUrl}/Calendars/Substitutions`,
    parentTeacherConferences: `${apiUrl}/ParentTeacherConferences`,
    // Messages (wiadomosci.librus.pl) - camelCase JSON, `{ data }` envelope, separate session
    messages: {
      me: `${messagesUrl}/me`,
      unreadCount: `${messagesUrl}/inbox/unreadMessagesCount`,
      tags: `${messagesUrl}/tags`,
      senders: `${messagesUrl}/inbox/messages/senders`,
      receivers: `${messagesUrl}/outbox/messages/receivers`,
      receiverTypes: `${messagesUrl}/receivers/types`,
      studentSubjects: `${messagesUrl}/receivers/student-subjects`,
      outOfWork: `${messagesUrl}/system/out-of-work-message`,
      drafts: `${messagesUrl}/drafts`,
      inbox: `${messagesUrl}/inbox/messages`,
      outbox: `${messagesUrl}/outbox/messages`,
      trash: `${messagesUrl}/trash-bin/messages`,
      archiveInbox: `${messagesUrl}/archive/inbox/messages`,
      archiveOutbox: `${messagesUrl}/archive/outbox/messages`,
      archiveTrash: `${messagesUrl}/archive/trash-bin/messages`,
      attachment: (attachmentId: string, messageId: string, archive = false) =>
        `${messagesUrl}/${archive ? "archive/" : ""}attachments/${attachmentId}/messages/${messageId}`,
    },
  },
} as const;

export default remotePaths;
