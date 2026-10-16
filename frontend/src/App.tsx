import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import SubmissionPage from './pages/SubmissionPage'
import DashboardPage from './pages/DashboardPage'
import ReportPage from './pages/ReportPage'
import ConfirmationPage from './pages/ConfirmationPage'

export default function App() {
  return (
    <Routes>
      {/* Landing / job description page */}
      <Route path="/" element={<LandingPage />} />
      {/* Dedicated application form */}
      <Route path="/submit" element={<SubmissionPage />} />
      <Route path="/confirmation/:submissionId" element={<ConfirmationPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/report/:submissionId" element={<ReportPage />} />
    </Routes>
  )
}
