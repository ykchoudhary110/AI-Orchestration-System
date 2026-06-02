import React, { useState, useEffect } from 'react';
import { Shield, GraduationCap, User, BookOpen, Key, Mail, ArrowRight, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const fetchStudents = async () => {
      setLoadingStudents(true);
      try {
        const data = await api.getStudents();
        setStudents(data);
      } catch (err) {
        console.error('Failed to load students list for quick access:', err);
      } finally {
        setLoadingStudents(false);
      }
    };
    fetchStudents();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    const inputEmail = email.trim().toLowerCase();

    // 1. Admin login validation
    if (inputEmail === 'admin@fln.gov.in') {
      if (password === 'admin123') {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userRole', 'Admin');
        localStorage.setItem('userEmail', 'admin@fln.gov.in');
        window.location.href = '/';
        return;
      } else {
        setError('Incorrect password for Admin.');
        return;
      }
    }

    // 2. Teacher login validation
    if (inputEmail === 'teacher@fln.gov.in') {
      if (password === 'teacher123') {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userRole', 'Teacher');
        localStorage.setItem('userEmail', 'teacher@fln.gov.in');
        window.location.href = '/';
        return;
      } else {
        setError('Incorrect password for Teacher.');
        return;
      }
    }

    // 3. Student code login validation (format: stu-X or STU-X or email stu-X@student.fln.gov.in)
    const match = inputEmail.match(/^stu-(\d+)$/) || inputEmail.replace('@student.fln.gov.in', '').match(/^stu-(\d+)$/);
    if (match) {
      if (password !== 'student123') {
        setError('Invalid password. Please use password "student123" for student logins.');
        return;
      }

      const studentId = parseInt(match[1]);
      try {
        const student = await api.getStudent(studentId);
        if (student) {
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('userRole', 'Student');
          localStorage.setItem('studentId', studentId.toString());
          localStorage.setItem('userEmail', `${student.name.toLowerCase().replace(/\s+/g, '')}.${studentId}@student.fln.gov.in`);
          window.location.href = '/';
          return;
        }
      } catch (err) {
        setError(`Student login ID "STU-${studentId}" does not exist in the database database.`);
        return;
      }
    }

    setError('Invalid credentials. Please use admin@fln.gov.in, teacher@fln.gov.in, or a registered Student login code like STU-1.');
  };



  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      {/* Top Accent Strip */}
      <div className="fixed top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-500 via-white to-emerald-500 z-50"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center p-3 bg-[#003366] rounded-2xl shadow-lg mb-4">
          <BookOpen className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-3xl font-black text-[#003366] tracking-tight">
          FLN Compass Gateway
        </h2>
        <p className="mt-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
          Ministry of Education | Foundational Literacy & Numeracy
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-slate-200 sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 rounded-xl p-4 text-xs font-bold text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                User Email or Student Login ID
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4.5 w-4.5 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 block w-full text-sm font-semibold rounded-xl"
                  placeholder="e.g. admin@fln.gov.in or STU-1"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-4.5 w-4.5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 block w-full text-sm font-semibold rounded-xl"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-black text-white bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all cursor-pointer"
              >
                Sign In to Portal
                <ArrowRight className="h-4.5 w-4.5" />
              </button>
            </div>
          </form>

          {/* Credentials Helper Card */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <h3 className="text-xs font-black text-[#003366] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Shield className="h-4.5 w-4.5 text-blue-600" />
              Demo Credentials Info
            </h3>
            
            <div className="bg-slate-100/75 border border-slate-350 rounded-2xl p-4.5 space-y-3.5 text-xs text-slate-800 font-semibold">
              <div className="flex justify-between items-center border-b border-slate-300/60 pb-2.5">
                <div>
                  <span className="block font-black text-slate-900 uppercase tracking-wide text-[10px]">Admin Account</span>
                  <span className="font-mono text-slate-700 text-xs font-bold">admin@fln.gov.in</span>
                </div>
                <span className="bg-white border border-slate-300 px-2.5 py-1 rounded-lg font-mono text-xs text-slate-950 font-black shadow-sm">admin123</span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-300/60 pb-2.5">
                <div>
                  <span className="block font-black text-slate-900 uppercase tracking-wide text-[10px]">Teacher Account</span>
                  <span className="font-mono text-slate-700 text-xs font-bold">teacher@fln.gov.in</span>
                </div>
                <span className="bg-white border border-slate-300 px-2.5 py-1 rounded-lg font-mono text-xs text-slate-950 font-black shadow-sm">teacher123</span>
              </div>

              <div>
                <span className="block font-black text-slate-900 uppercase tracking-wide text-[10px] mb-1">Student Accounts (Reference Only)</span>
                <p className="text-[10px] text-slate-600 font-bold mb-2">
                  Enter student login code below (e.g. STU-1) with password <code className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-850 font-extrabold">student123</code>:
                </p>
                
                <div className="max-h-[140px] overflow-y-auto pr-1 space-y-2 mt-2">
                  {loadingStudents ? (
                    <p className="text-[10px] text-slate-500 font-bold text-center animate-pulse flex items-center justify-center gap-1">
                      <RefreshCw className="h-3 w-3 animate-spin" /> Querying registered database student IDs...
                    </p>
                  ) : students.length === 0 ? (
                    <p className="text-[10px] text-slate-500 font-bold text-center">
                      No students in database. Create one via Admin/Teacher first.
                    </p>
                  ) : (
                    students.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-2.5 bg-white border border-slate-250 rounded-xl shadow-sm"
                      >
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-emerald-50 border border-emerald-250 text-emerald-700 rounded-lg">
                            <User className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <span className="text-[11px] font-black text-slate-900 block">{student.name}</span>
                            <span className="text-[9px] text-slate-500 font-bold">Grade {student.grade} | {student.school}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          STU-{student.id}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
