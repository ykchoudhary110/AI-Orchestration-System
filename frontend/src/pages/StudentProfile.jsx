import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { BookOpen, Calculator, Calendar, Brain, School, Heart, ChevronLeft, RefreshCw, Milestone } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function StudentProfile() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloadingAI, setReloadingAI] = useState(false);

  const loadData = async () => {
    try {
      const studentData = await api.getStudent(id);
      setStudent(studentData);
      
      const recsData = await api.getRecommendations(id);
      setRecs(recsData.recommendations);
    } catch (err) {
      console.error('Failed to load profile data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const triggerAIRecommendation = async () => {
    setReloadingAI(true);
    try {
      // Direct call will force a refresh of the AI content in the backend database
      const res = await api.getRecommendations(id);
      setRecs(res.recommendations);
    } catch (err) {
      console.error('AI regeneration failed:', err);
    } finally {
      setReloadingAI(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6 pb-12 animate-pulse space-y-6">
        <div className="h-6 bg-slate-800 rounded w-24"></div>
        <div className="h-40 bg-slate-800 rounded-2xl w-full"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-800 rounded-2xl"></div>
          <div className="h-80 bg-slate-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="container mx-auto px-6 pb-12 text-center text-slate-400">
        Student profile not found. <Link to="/students" className="text-blue-400 font-semibold underline">Back to List</Link>
      </div>
    );
  }

  // Format competency scores for Radar Chart
  // Split into literacy/numeracy or show combined
  const competenciesRadar = student.competency_scores.map(c => ({
    subject: titleCase(c.competency),
    score: c.score,
    fullMark: 100,
  }));

  // Helper to titlecase strings in Javascript
  function titleCase(str) {
    return str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  // Process longitudinal data for progress chart
  // Group history by month/date
  const timelineMap = {};
  student.progress_history?.forEach(h => {
    const month = new Date(h.date).toLocaleString('default', { month: 'short' });
    if (!timelineMap[month]) {
      timelineMap[month] = { name: month, count: 0, sum: 0 };
    }
    timelineMap[month].sum += h.score;
    timelineMap[month].count += 1;
  });

  const timelineData = Object.values(timelineMap).map(t => ({
    name: t.name,
    'Average Index': Math.round(t.sum / t.count),
  }));

  const getRiskBadgeColor = (risk) => {
    if (risk === 'HIGH') return 'bg-rose-500/15 border-rose-500/20 text-rose-400';
    if (risk === 'MEDIUM') return 'bg-yellow-500/15 border-yellow-500/20 text-yellow-400';
    return 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400';
  };

  return (
    <div className="container mx-auto px-6 pb-12">
      {/* Back Button */}
      <Link to="/students" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-semibold transition mb-6">
        <ChevronLeft className="h-4 w-4" />
        Back to Student Manager
      </Link>

      {/* Profile Info Header Banner */}
      <div className="glass-panel border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 mb-8 bg-gradient-to-r from-blue-950/10 via-slate-900/40 to-transparent">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Avatar Initials */}
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-blue-500/10">
            {student.name.split(' ').map(n => n[0]).join('')}
          </div>
          
          <div className="text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <h2 className="text-2xl font-black text-white tracking-tight">{student.name}</h2>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded border uppercase tracking-wider ${getRiskBadgeColor(student.risk_level?.risk_level)}`}>
                {student.risk_level?.risk_level || 'LOW'} Risk Profile
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:flex items-center gap-y-2 gap-x-4.5 mt-2.5 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5"><School className="h-3.5 w-3.5 text-blue-400" /> {student.school}</span>
              <span className="flex items-center gap-1.5"><Heart className="h-3.5 w-3.5 text-rose-400" /> Age {student.age} | {student.gender}</span>
              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-yellow-400" /> Primary Lang: {student.language}</span>
            </div>
          </div>
        </div>

        {/* Start Assessment Buttons */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Link
            to={`/assessment/literacy/${student.id}`}
            className="flex-1 md:flex-none text-center bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all text-white font-semibold text-xs px-5 py-2.5 rounded-xl flex items-center justify-center gap-1.5"
          >
            <BookOpen className="h-4 w-4" />
            Assess Literacy
          </Link>
          <Link
            to={`/assessment/numeracy/${student.id}`}
            className="flex-1 md:flex-none text-center bg-violet-600 hover:bg-violet-500 active:scale-95 transition-all text-white font-semibold text-xs px-5 py-2.5 rounded-xl flex items-center justify-center gap-1.5"
          >
            <Calculator className="h-4 w-4" />
            Assess Numeracy
          </Link>
        </div>
      </div>

      {/* Grid Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Learning Fingerprint Radar */}
        <div className="glass-panel border border-white/5 rounded-3xl p-6 flex flex-col items-center">
          <div className="w-full text-left mb-6">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Milestone className="h-4.5 w-4.5 text-blue-400" />
              Learning Fingerprint
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Current competency metrics mapped across literacy and numeracy layers.
            </p>
          </div>
          
          <div className="h-64 w-full flex items-center justify-center">
            {competenciesRadar.length === 0 ? (
              <div className="text-slate-500 text-sm">No assessment history recorded.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={competenciesRadar}>
                  <PolarGrid stroke="rgba(255,255,255,0.05)" />
                  <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={9} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" fontSize={8} />
                  <Radar name={student.name} dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Progress Tracker Line Chart */}
        <div className="glass-panel border border-white/5 rounded-3xl p-6 flex flex-col justify-between">
          <div className="w-full text-left">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Milestone className="h-4.5 w-4.5 text-violet-400" />
              Longitudinal Development
            </h3>
            <p className="text-xs text-slate-400 mt-1 mb-6">
              Track overall learning level index improvements over the last 5 months.
            </p>
          </div>

          <div className="h-60 w-full">
            {timelineData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                Insufficient history. Complete assessments to generate timeline.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#0d1426', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '12px' }}
                    labelClassName="text-white font-bold"
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px' }} />
                  <Line type="monotone" dataKey="Average Index" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Diagnostic Gap Details and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Diagnostic Metrics Cards */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          {/* Expected vs Actual */}
          <div className="glass-panel border border-white/5 rounded-2xl p-5 flex flex-col justify-between h-[115px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Curriculum Mapping</span>
            <div className="flex items-center justify-between mt-2">
              <div className="text-center">
                <span className="text-2xl font-black text-white">{student.grade}.0</span>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Expected Grade</p>
              </div>
              <div className="h-8 w-px bg-white/5"></div>
              <div className="text-center">
                <span className="text-2xl font-black text-blue-400">{student.learning_gap?.actual_level || 0.0}</span>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Actual Level</p>
              </div>
            </div>
          </div>

          {/* Academic Gap */}
          <div className="glass-panel border border-white/5 rounded-2xl p-5 flex flex-col justify-between h-[115px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Curriculum Gap Size</span>
            <div className="flex items-end justify-between mt-2">
              <span className={`text-3xl font-extrabold ${student.learning_gap?.gap_years >= 2.0 ? 'text-rose-400' : student.learning_gap?.gap_years >= 1.0 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                {student.learning_gap?.gap_years || 0.0} Years
              </span>
              <span className="text-[10px] font-bold text-slate-500">Curriculum Behind</span>
            </div>
          </div>
        </div>

        {/* AI Recommendations Panel */}
        <div className="glass-panel border border-blue-500/10 rounded-3xl p-6 lg:col-span-2 bg-gradient-to-b from-blue-950/5 to-transparent relative">
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-400" />
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Actionable Intervention Plan</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Custom remedial guidelines targeting student gaps.</p>
              </div>
            </div>
            <button
              onClick={triggerAIRecommendation}
              disabled={reloadingAI}
              className="text-[10px] font-bold text-slate-400 hover:text-white border border-white/5 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition"
            >
              <RefreshCw className={`h-3 w-3 ${reloadingAI ? 'animate-spin' : ''}`} />
              Sync AI
            </button>
          </div>

          {recs.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              Complete an assessment to compile targeted diagnostic interventions.
            </div>
          ) : (
            <div className="flex flex-col gap-5.5">
              {/* Teacher recommendations */}
              <div>
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block mb-2">
                  Classroom Remedial Focus ({titleCase(recs[0].competency)})
                </span>
                <div className="bg-slate-950/60 border border-white/5 rounded-xl p-4.5 text-xs text-slate-300 leading-relaxed whitespace-pre-line font-medium">
                  {recs[0].teacher_recommendation}
                </div>
              </div>
              
              {/* Parent Letter in regional language */}
              {recs[0].parent_report && (
                <div>
                  <span className="text-[11px] font-bold text-violet-400 uppercase tracking-wider block mb-2">
                    Parent Consult Statement (Hindi Translation)
                  </span>
                  <div className="bg-slate-950/60 border border-white/5 rounded-xl p-4.5 text-xs text-slate-300 leading-relaxed italic whitespace-pre-line font-medium font-sans">
                    {recs[0].parent_report}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
