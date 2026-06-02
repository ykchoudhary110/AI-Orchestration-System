import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../services/api';
import { FileText, Users, Printer, BookOpen, Brain, Download, HelpCircle, ShieldAlert, Award, FileSpreadsheet } from 'lucide-react';

export default function Reports() {
  const userRole = localStorage.getItem('userRole');
  if (userRole === 'Student') {
    return <Navigate to="/" replace />;
  }
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Selection States
  const [selectedGrade, setSelectedGrade] = useState('3');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  
  // Report Result States
  const [classSummary, setClassSummary] = useState(null);
  const [studentRecs, setStudentRecs] = useState(null);
  
  // Loading indicator states
  const [loadingClassReport, setLoadingClassReport] = useState(false);
  const [loadingStudentReport, setLoadingStudentReport] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const data = await api.getStudents();
        setStudents(data);
        if (data.length > 0) {
          setSelectedStudentId(data[0].id.toString());
        }
      } catch (err) {
        console.error('Error fetching students:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const handleGenerateClassReport = async () => {
    setLoadingClassReport(true);
    setClassSummary(null);
    try {
      const data = await api.getClassSummary(parseInt(selectedGrade));
      setClassSummary(data);
    } catch (err) {
      console.error('Failed to compile class report:', err);
    } finally {
      setLoadingClassReport(false);
    }
  };

  const handleGenerateStudentReport = async () => {
    if (!selectedStudentId) return;
    setLoadingStudentReport(true);
    setStudentRecs(null);
    try {
      const recsRes = await api.getRecommendations(parseInt(selectedStudentId));
      setStudentRecs(recsRes);
    } catch (err) {
      console.error('Failed to compile student report:', err);
    } finally {
      setLoadingStudentReport(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getSelectedStudentDetails = () => {
    return students.find(s => s.id.toString() === selectedStudentId);
  };

  const selectedStudent = getSelectedStudentDetails();

  return (
    <div className="container mx-auto px-6 pb-12 print:p-0 print:bg-white print:text-black">
      {/* Title (Hidden on print) */}
      <div className="mb-8 print:hidden">
        <h1 className="text-3xl font-black text-white tracking-tight">Report Compiler</h1>
        <p className="text-slate-400 text-sm mt-1">
          Compile and print overall classroom digests or individual student remedial schedules offline.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:block">
        {/* Left Control Panel (Hidden on print) */}
        <div className="flex flex-col gap-6 lg:col-span-1 print:hidden">
          {/* Class Report Config */}
          <div className="glass-panel border border-white/5 rounded-3xl p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-blue-400" />
              Class Report Setup
            </h3>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Select Grade</label>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="w-full bg-slate-950 border border-white/5 text-slate-300 text-sm px-4 py-2.5 rounded-xl mt-1 focus:outline-none focus:border-blue-500/20 cursor-pointer"
                >
                  <option value="1">Grade 1</option>
                  <option value="2">Grade 2</option>
                  <option value="3">Grade 3</option>
                </select>
              </div>
              <button
                onClick={handleGenerateClassReport}
                disabled={loadingClassReport}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/10"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                {loadingClassReport ? 'Compiling Summary...' : 'Compile Class Digest'}
              </button>
            </div>
          </div>

          {/* Student Report Config */}
          <div className="glass-panel border border-white/5 rounded-3xl p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-violet-400" />
              Student Report Setup
            </h3>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Select Student</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  disabled={loading}
                  className="w-full bg-slate-950 border border-white/5 text-slate-300 text-sm px-4 py-2.5 rounded-xl mt-1 focus:outline-none focus:border-blue-500/20 cursor-pointer"
                >
                  {loading ? (
                    <option>Loading student list...</option>
                  ) : (
                    students.map(s => (
                      <option key={s.id} value={s.id}>{s.name} (Grade {s.grade})</option>
                    ))
                  )}
                </select>
              </div>
              <button
                onClick={handleGenerateStudentReport}
                disabled={loadingStudentReport || !selectedStudentId}
                className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-violet-600/10"
              >
                <FileText className="h-3.5 w-3.5" />
                {loadingStudentReport ? 'Compiling Report...' : 'Compile Student Card'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Output Panel */}
        <div className="lg:col-span-2 print:w-full">
          {/* Default State */}
          {!classSummary && !studentRecs && !loadingClassReport && !loadingStudentReport && (
            <div className="glass-panel border border-white/5 rounded-3xl p-12 text-center text-slate-500 text-sm print:hidden">
              <BookOpen className="h-10 w-10 text-slate-600 mx-auto mb-4" />
              Select parameters on the left and click compile to view print-ready reports.
            </div>
          )}

          {/* Loadings */}
          {(loadingClassReport || loadingStudentReport) && (
            <div className="glass-panel border border-white/5 rounded-3xl p-12 text-center text-slate-400 text-sm animate-pulse print:hidden">
              <Brain className="h-10 w-10 text-blue-500 mx-auto mb-4 animate-spin" />
              Synthesizing metrics and formatting report digests. Please wait...
            </div>
          )}

          {/* 1. Class Report Output */}
          {classSummary && (
            <div className="glass-panel border border-white/5 rounded-3xl p-8 bg-gradient-to-b from-slate-900/40 to-transparent print:border-0 print:shadow-none print:p-0 print:text-black">
              {/* Print controls */}
              <div className="flex justify-end gap-3 mb-6 print:hidden">
                <button
                  onClick={handlePrint}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" /> Print Report
                </button>
              </div>

              {/* Document Header */}
              <div className="border-b border-white/10 pb-5 mb-6 print:border-black/20">
                <h2 className="text-2xl font-black text-white print:text-black tracking-tight">Grade {classSummary.grade} - Remedial Classroom Digest</h2>
                <p className="text-xs text-slate-400 print:text-slate-500 mt-1 uppercase tracking-wider font-semibold">
                  FLN Compass Diagnostic Output • School Year 2026
                </p>
              </div>

              {/* Metrics Columns */}
              <div className="grid grid-cols-3 gap-4 mb-8 print:grid-cols-3 print:gap-4 print:text-black">
                <div className="bg-slate-950/60 border border-white/5 p-4 rounded-xl print:bg-slate-100 print:border-black/10">
                  <span className="text-[10px] text-slate-400 print:text-slate-600 font-bold uppercase">Total Enrolled</span>
                  <p className="text-2xl font-black text-white print:text-black mt-1">{classSummary.stats.total_students}</p>
                </div>
                <div className="bg-slate-950/60 border border-white/5 p-4 rounded-xl print:bg-slate-100 print:border-black/10">
                  <span className="text-[10px] text-slate-400 print:text-slate-600 font-bold uppercase">Average Gap size</span>
                  <p className="text-2xl font-black text-rose-400 mt-1">{classSummary.stats.avg_learning_gap} Years</p>
                </div>
                <div className="bg-slate-950/60 border border-white/5 p-4 rounded-xl print:bg-slate-100 print:border-black/10">
                  <span className="text-[10px] text-slate-400 print:text-slate-600 font-bold uppercase">High Risk Alerts</span>
                  <p className="text-2xl font-black text-yellow-400 mt-1">{classSummary.stats.high_risk_count}</p>
                </div>
              </div>

              {/* Bottom stats details */}
              <div className="flex flex-col gap-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 print:text-slate-700 uppercase tracking-wider mb-2">Priority Focus Area:</h4>
                  <div className="flex flex-wrap gap-2">
                    {classSummary.stats.weak_competencies.map((comp, i) => (
                      <span key={i} className="text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold px-3 py-1 rounded-lg print:border-black/25 print:text-black">
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t border-white/5 pt-6 print:border-black/20">
                  <h4 className="text-xs font-bold text-blue-400 print:text-slate-800 uppercase tracking-wider mb-3">Group-Level Remedial Suggestions:</h4>
                  <div className="bg-slate-950/40 border border-white/5 p-5 rounded-2xl text-slate-300 print:text-slate-800 print:bg-slate-50 print:border-black/10 text-sm whitespace-pre-line leading-relaxed font-medium">
                    {classSummary.summary}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Student Report Output */}
          {studentRecs && selectedStudent && (
            <div className="glass-panel border border-white/5 rounded-3xl p-8 bg-gradient-to-b from-slate-900/40 to-transparent print:border-0 print:shadow-none print:p-0 print:text-black">
              {/* Print controls */}
              <div className="flex justify-end gap-3 mb-6 print:hidden">
                <button
                  onClick={handlePrint}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" /> Print Report Card
                </button>
              </div>

              {/* Document Header */}
              <div className="border-b border-white/10 pb-5 mb-6 print:border-black/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white print:text-black tracking-tight">{selectedStudent.name}</h2>
                  <p className="text-xs text-slate-400 print:text-slate-500 mt-1 uppercase tracking-wider font-semibold">
                    Grade {selectedStudent.grade} Student • Profile ID: #{selectedStudent.id}
                  </p>
                </div>
                <div className="text-left md:text-right text-xs text-slate-400 print:text-slate-600 font-medium">
                  <p>School: {selectedStudent.school}</p>
                  <p>Preferred Instruction: {selectedStudent.language}</p>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-4 mb-8 print:grid-cols-3 print:gap-4">
                <div className="bg-slate-950/60 border border-white/5 p-4 rounded-xl print:bg-slate-100 print:border-black/10">
                  <span className="text-[10px] text-slate-400 print:text-slate-600 font-bold uppercase">Learning Level</span>
                  <p className="text-2xl font-black text-white print:text-black mt-1">{selectedStudent.learning_gap?.actual_level || 0.0}</p>
                </div>
                <div className="bg-slate-950/60 border border-white/5 p-4 rounded-xl print:bg-slate-100 print:border-black/10">
                  <span className="text-[10px] text-slate-400 print:text-slate-600 font-bold uppercase">Curriculum Gap</span>
                  <p className="text-2xl font-black text-rose-400 mt-1">{selectedStudent.learning_gap?.gap_years || 0.0} Years</p>
                </div>
                <div className="bg-slate-950/60 border border-white/5 p-4 rounded-xl print:bg-slate-100 print:border-black/10">
                  <span className="text-[10px] text-slate-400 print:text-slate-600 font-bold uppercase">Diagnostic Risk</span>
                  <p className="text-2xl font-black text-yellow-400 mt-1">{selectedStudent.risk_level?.risk_level || 'LOW'}</p>
                </div>
              </div>

              {/* Recommendations */}
              <div className="flex flex-col gap-6">
                <div>
                  <h4 className="text-xs font-bold text-blue-400 print:text-slate-700 uppercase tracking-wider mb-2">Targeted Classroom Interventions:</h4>
                  {studentRecs.recommendations.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No recommendations compiled. Complete a test session first.</p>
                  ) : (
                    <div className="bg-slate-950/40 border border-white/5 p-5 rounded-2xl text-slate-300 print:text-slate-800 print:bg-slate-50 print:border-black/10 text-xs whitespace-pre-line leading-relaxed font-semibold">
                      {studentRecs.recommendations[0].teacher_recommendation}
                    </div>
                  )}
                </div>

                <div className="border-t border-white/5 pt-6 print:border-black/20">
                  <h4 className="text-xs font-bold text-violet-400 print:text-slate-700 uppercase tracking-wider mb-2">Parent Consult Statement (Hindi Language):</h4>
                  {studentRecs.recommendations.length === 0 || !studentRecs.recommendations[0].parent_report ? (
                    <p className="text-xs text-slate-500 italic">No statement compiled.</p>
                  ) : (
                    <div className="bg-slate-950/40 border border-white/5 p-5 rounded-2xl text-slate-300 print:text-slate-800 print:bg-slate-50 print:border-black/10 text-sm italic font-sans whitespace-pre-line leading-relaxed">
                      {studentRecs.recommendations[0].parent_report}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
