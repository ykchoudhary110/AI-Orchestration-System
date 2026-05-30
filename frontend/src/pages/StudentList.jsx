import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { UserPlus, Search, Filter, BookOpen, Calculator, ChevronRight, GraduationCap } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';

export default function StudentList() {
  const userRole = localStorage.getItem('userRole');
  if (userRole === 'Student') {
    return <Navigate to="/" replace />;
  }

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    age: 8,
    grade: 3,
    gender: 'Male',
    language: 'English',
    school: 'Government Primary School A',
  });

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await api.getStudents();
      setStudents(data);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'age' || name === 'grade' ? parseInt(value) : value,
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await api.createStudent(formData);
      setIsModalOpen(false);
      // Reset form
      setFormData({
        name: '',
        age: 8,
        grade: 3,
        gender: 'Male',
        language: 'English',
        school: 'Government Primary School A',
      });
      fetchStudents();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to add student. Ensure name is unique in this school.');
    }
  };

  // Filter logic
  const filteredStudents = students.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchesGrade = gradeFilter === '' || s.grade.toString() === gradeFilter;
    const matchesRisk = riskFilter === '' || s.risk_level?.risk_level === riskFilter;
    return matchesSearch && matchesGrade && matchesRisk;
  });

  const getRiskBadgeColor = (risk) => {
    if (risk === 'HIGH') return 'bg-rose-500/15 border-rose-500/20 text-rose-400';
    if (risk === 'MEDIUM') return 'bg-yellow-500/15 border-yellow-500/20 text-yellow-400';
    return 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400';
  };

  return (
    <div className="container mx-auto px-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Student Manager</h1>
          <p className="text-slate-400 text-sm mt-1">
            Register and manage student profiles, diagnostic histories, and assessments.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all text-white font-semibold text-sm px-5 py-2.5 rounded-xl cursor-pointer"
        >
          <UserPlus className="h-4.5 w-4.5" />
          Add Student
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel border border-white/5 rounded-2xl p-5 mb-8 flex flex-col md:flex-row items-center gap-4">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950/60 border border-white/5 text-slate-200 text-sm pl-11 pr-4 py-3 rounded-xl focus:border-blue-500/30 focus:outline-none transition-all"
          />
        </div>
        {/* Grade Filter */}
        <div className="relative w-full md:w-48">
          <Filter className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="w-full bg-slate-950/60 border border-white/5 text-slate-300 text-sm pl-10 pr-4 py-3 rounded-xl focus:border-blue-500/30 focus:outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="">All Grades</option>
            <option value="1">Grade 1</option>
            <option value="2">Grade 2</option>
            <option value="3">Grade 3</option>
          </select>
        </div>
        {/* Risk Filter */}
        <div className="relative w-full md:w-48">
          <GraduationCap className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="w-full bg-slate-950/60 border border-white/5 text-slate-300 text-sm pl-10 pr-4 py-3 rounded-xl focus:border-blue-500/30 focus:outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="">All Risk levels</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
          </select>
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="glass-panel border border-white/5 rounded-2xl p-6 h-[180px] animate-pulse"></div>
          ))}
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="glass-panel border border-white/5 rounded-2xl p-12 text-center text-slate-500 text-sm">
          No students found matching current filters. Click "Add Student" above to register a new record.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((s) => (
            <div key={s.id} className="glass-panel border border-white/5 hover:border-white/10 rounded-2xl p-6 flex flex-col justify-between shadow-lg hover:shadow-2xl transition-all duration-300 group">
              <div>
                {/* Top Info */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400 font-semibold uppercase">Grade {s.grade} Student</span>
                    <h3 className="text-lg font-bold text-white tracking-tight mt-0.5 group-hover:text-blue-400 transition-colors">
                      {s.name}
                    </h3>
                    <span className="text-[10px] font-black uppercase text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100 mt-1.5 self-start">
                      Login Code: STU-{s.id}
                    </span>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded border ${getRiskBadgeColor(s.risk_level?.risk_level)}`}>
                    {s.risk_level?.risk_level || 'LOW'} RISK
                  </span>
                </div>
                
                {/* Secondary details */}
                <div className="text-xs text-slate-400 flex flex-col gap-1 mb-5">
                  <p>School: <span className="font-semibold text-slate-300">{s.school}</span></p>
                  <p>Language: <span className="font-semibold text-slate-300">{s.language}</span></p>
                  {s.learning_gap && (
                    <p className="mt-1">
                      Learning Gap:{' '}
                      <span className={`font-bold ${s.learning_gap.gap_years >= 2.0 ? 'text-rose-400' : s.learning_gap.gap_years >= 1.0 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                        {s.learning_gap.gap_years} Years
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {/* Assessment Actions */}
              <div className="border-t border-white/5 pt-4 flex items-center justify-between gap-2.5">
                <Link
                  to={`/student/${s.id}`}
                  className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1 group/link transition"
                >
                  Profile <ChevronRight className="h-3 w-3 group-hover/link:translate-x-0.5 transition-transform" />
                </Link>
                
                <div className="flex items-center gap-2">
                  <Link
                    to={`/assessment/literacy/${s.id}`}
                    className="flex items-center gap-1 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/10 hover:border-blue-500 text-[10px] font-bold px-3 py-2 rounded-lg transition-all"
                  >
                    <BookOpen className="h-3 w-3" />
                    Literacy
                  </Link>
                  <Link
                    to={`/assessment/numeracy/${s.id}`}
                    className="flex items-center gap-1 bg-violet-600/10 hover:bg-violet-600 text-violet-400 hover:text-white border border-violet-500/10 hover:border-violet-500 text-[10px] font-bold px-3 py-2 rounded-lg transition-all"
                  >
                    <Calculator className="h-3 w-3" />
                    Numeracy
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Student Popup Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel border border-white/10 rounded-2xl w-full max-w-md p-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-white mb-4">Register New Student</h3>
            
            {errorMsg && (
              <div className="bg-rose-950/20 border border-rose-500/10 p-3 rounded-lg text-rose-400 text-xs mb-4">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
              {/* Name */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Full Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Aman Sharma"
                  className="w-full bg-slate-950 border border-white/5 text-slate-200 text-sm px-4 py-2.5 rounded-lg focus:border-blue-500/30 focus:outline-none mt-1 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Age */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Age</label>
                  <input
                    type="number"
                    name="age"
                    min="4"
                    max="16"
                    required
                    value={formData.age}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-white/5 text-slate-200 text-sm px-4 py-2.5 rounded-lg focus:border-blue-500/30 focus:outline-none mt-1 transition-all"
                  />
                </div>
                {/* Grade */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Grade</label>
                  <select
                    name="grade"
                    value={formData.grade}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-white/5 text-slate-300 text-sm px-4 py-2.5 rounded-lg focus:border-blue-500/30 focus:outline-none mt-1 transition-all cursor-pointer"
                  >
                    <option value="1">Grade 1</option>
                    <option value="2">Grade 2</option>
                    <option value="3">Grade 3</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Gender */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-white/5 text-slate-300 text-sm px-4 py-2.5 rounded-lg focus:border-blue-500/30 focus:outline-none mt-1 transition-all cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                {/* Instruction Language */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Language</label>
                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-white/5 text-slate-300 text-sm px-4 py-2.5 rounded-lg focus:border-blue-500/30 focus:outline-none mt-1 transition-all cursor-pointer"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Marathi">Marathi</option>
                    <option value="Tamil">Tamil</option>
                    <option value="Bengali">Bengali</option>
                    <option value="Gujarati">Gujarati</option>
                    <option value="Telugu">Telugu</option>
                  </select>
                </div>
              </div>

              {/* School */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">School Name</label>
                <input
                  type="text"
                  name="school"
                  required
                  value={formData.school}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-white/5 text-slate-200 text-sm px-4 py-2.5 rounded-lg focus:border-blue-500/30 focus:outline-none mt-1 transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-sm transition active:scale-95"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
