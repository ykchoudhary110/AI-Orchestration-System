import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import StudentList from './pages/StudentList';
import StudentProfile from './pages/StudentProfile';
import AssessmentSession from './pages/AssessmentSession';
import Reports from './pages/Reports';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-transparent flex flex-col">
        {/* Navigation Topbar */}
        <Navbar />
        
        {/* Main Routed Content View */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<StudentList />} />
            <Route path="/student/:id" element={<StudentProfile />} />
            <Route path="/assessment/:subject/:studentId" element={<AssessmentSession />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
