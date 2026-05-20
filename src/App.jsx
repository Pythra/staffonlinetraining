import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RequireAuth from './components/RequireAuth';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import SignUpVerify from './pages/SignUpVerify';
import Courses from './pages/Courses';
import Topics from './pages/Topics';
import Modules from './pages/Modules';
import ModuleContent from './pages/ModuleContent';
import Quiz from './pages/Quiz';
import QuizResult from './pages/QuizResult';
import Profile from './pages/Profile';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signup/verify" element={<SignUpVerify />} />
          <Route element={<RequireAuth />}>
            <Route path="/app/courses" element={<Courses />} />
            <Route path="/app/c/:courseCode/topics" element={<Topics />} />
            <Route path="/app/c/:courseCode/subjects/:subjectKey/modules" element={<Modules />} />
            <Route
              path="/app/c/:courseCode/subjects/:subjectKey/modules/:moduleKey"
              element={<ModuleContent />}
            />
            <Route
              path="/app/c/:courseCode/subjects/:subjectKey/modules/:moduleKey/quiz"
              element={<Quiz />}
            />
            <Route path="/app/quiz-result" element={<QuizResult />} />
            <Route path="/app/profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
