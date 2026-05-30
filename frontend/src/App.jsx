import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import StudentList from './pages/StudentList';
import StudentProfile from './pages/StudentProfile';
import AssessmentSession from './pages/AssessmentSession';
import Reports from './pages/Reports';
import Login from './pages/Login';

export default function App() {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true' && 
    ['Admin', 'Teacher', 'Student'].includes(localStorage.getItem('userRole'));

  return (
    <Router>
      <div className="min-h-screen bg-transparent flex flex-col">
        {/* Navigation Topbar - Only visible if logged in */}
        {isLoggedIn && <Navbar />}
        
        {/* Main Routed Content View */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Routes>
            <Route 
              path="/login" 
              element={isLoggedIn ? <Navigate to="/" replace /> : <Login />} 
            />
            
            <Route 
              path="/" 
              element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/students" 
              element={isLoggedIn ? <StudentList /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/student/:id" 
              element={isLoggedIn ? <StudentProfile /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/assessment/:subject/:studentId" 
              element={isLoggedIn ? <AssessmentSession /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/reports" 
              element={isLoggedIn ? <Reports /> : <Navigate to="/login" replace />} 
            />
            
            <Route 
              path="*" 
              element={<Navigate to={isLoggedIn ? "/" : "/login"} replace />} 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
