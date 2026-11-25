import {Suspense} from "react";
import MasterProvider from "./providers/master.js";
import {Redirect, Route, Router, Switch} from "wouter";
import {
  Attendance, Auth, Calendar, Developer, Exams, Grades, Home, Homeworks, Messages, Profile, School, Settings,
  TeacherAbsences, Timetable,
} from "./pages/index.js";
import Layout from "./components/layout.js";
import {ScreenTracker} from "./lib/analytics.js";

const App = () => {
  return (
    <MasterProvider>
      <Router>
        <ScreenTracker/>
        <Switch>
          <Route path="/"><Redirect to={"/app/home"}/></Route>
          <Route path={"/auth"}><Suspense><Auth/></Suspense></Route>
          <Route path={"/app"} nest>
            <Layout>
              <Switch>
                <Route path={"/home"} component={Home}/>
                <Route path={"/grades"} component={Grades}/>
                <Route path={"/homeworks"} component={Homeworks}/>
                <Route path={"/exams"} component={Exams}/>
                <Route path={"/timetable"} component={Timetable}/>
                <Route path={"/calendar"} component={Calendar}/>
                <Route path={"/teacherAbsences"} component={TeacherAbsences}/>
                <Route path={"/attendance"} component={Attendance}/>
                <Route path={"/messages"} component={Messages}/>
                <Route path={"/school"} component={School}/>
                <Route path={"/profile"} component={Profile}/>
                <Route path={"/settings"} component={Settings}/>
                {/* Reachable by URL even with devmode off - nav link is gated in <Layout> */}
                <Route path={"/developer"} component={Developer}/>
                <Route><Redirect to={"/home"}/></Route>
              </Switch>
            </Layout>
          </Route>
        </Switch>
      </Router>
    </MasterProvider>
  )
}

export default App
