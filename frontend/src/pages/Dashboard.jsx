import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import MetricCard from '../components/MetricCard';
import { Users, AlertCircle, BarChart3, Clock, ArrowRight, ShieldAlert, Play, BookOpen, Calculator } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link, useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);
  const [gapData, setGapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);

  // Quick Launcher State
  const [quickStudentId, setQuickStudentId] = useState('');
  const [quickSubject, setQuickSubject] = useState('literacy');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, heatmapRes, gapRes, studentsRes] = await Promise.all([
          api.getDashboardStats(),
          api.getHeatmapData(),
          api.getGapDistribution(),
          api.getStudents()
        ]);
        setStats(statsRes);
        setHeatmapData(heatmapRes);
        setGapData(gapRes);
        setStudents(studentsRes);
        if (studentsRes.length > 0) {
          setQuickStudentId(studentsRes[0].id.toString());
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLaunchQuickTest = (e) => {
    e.preventDefault();
    if (!quickStudentId) {
      alert('Please select a student or register one in the Student Manager.');
      return;
    }
    navigate(`/assessment/${quickSubject}/${quickStudentId}`);
  };

  const getHeatmapColor = (score) => {
    if (score === 0) return 'bg-slate-900/40 text-slate-500 border-white/5';
    if (score >= 80) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (score >= 60) return 'bg-teal-500/15 text-teal-400 border-teal-500/25';
    if (score >= 40) return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25';
    return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
  };

  // Extract High Risk Students
  const highRiskStudents = students.filter(s => s.risk_level?.risk_level === 'HIGH');

  return (
    <div className="container mx-auto px-6 pb-12">
      {/* Title */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Classroom Analytics</h1>
          <p className="text-slate-400 text-sm mt-1">
            Monitor foundational literacy and numeracy performance indices locally.
          </p>
        </div>
        <Link
          to="/students"
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-4 py-2.5 rounded-xl border border-white/5 flex items-center gap-1.5 w-fit"
        >
          <Users className="h-4 w-4 text-blue-400" /> Go to Student Manager
        </Link>
      </div>

      {/* Prominent Quick Test Launcher Card */}
      <div className="glass-panel border border-blue-500/15 rounded-3xl p-6 mb-8 bg-gradient-to-r from-blue-950/15 via-indigo-950/10 to-transparent shadow-xl relative overflow-hidden">
        {/* Glow indicator decoration */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full filter blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Play className="h-4.5 w-4.5 text-blue-400 fill-blue-400/20" />
              Quick Diagnostic Assessment Launcher
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Initiate a student assessment immediately. Select a registered student, select the subject area, and begin the adaptive diagnostic evaluation.
            </p>
          </div>

          <form onSubmit={handleLaunchQuickTest} className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            {/* Student Dropdown */}
            <select
              value={quickStudentId}
              onChange={(e) => setQuickStudentId(e.target.value)}
              className="w-full sm:w-60 bg-slate-950/80 border border-white/10 text-slate-300 text-xs px-4 py-3 rounded-xl focus:border-blue-500/30 focus:outline-none cursor-pointer font-semibold"
            >
              {students.length === 0 ? (
                <option value="">No students registered...</option>
              ) : (
                students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (Grade {s.grade})
                  </option>
                ))
              )}
            </select>

            {/* Subject Selector */}
            <select
              value={quickSubject}
              onChange={(e) => setQuickSubject(e.target.value)}
              className="w-full sm:w-40 bg-slate-950/80 border border-white/10 text-slate-300 text-xs px-4 py-3 rounded-xl focus:border-blue-500/30 focus:outline-none cursor-pointer font-semibold"
            >
              <option value="literacy">Literacy</option>
              <option value="numeracy">Numeracy</option>
            </select>

            {/* Launch button */}
            <button
              type="submit"
              disabled={students.length === 0}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:opacity-50 text-white font-bold text-xs px-6 py-3 rounded-xl transition cursor-pointer shadow-lg shadow-blue-600/20"
            >
              Start Adaptive Test
            </button>
          </form>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Students"
          value={loading ? 0 : stats?.total_students || 0}
          icon={Users}
          color="blue"
          loading={loading}
        />
        <MetricCard
          title="High Risk (Gap > 2y)"
          value={loading ? 0 : stats?.high_risk_count || 0}
          icon={ShieldAlert}
          color="rose"
          loading={loading}
          subtext="Requires immediate intervention"
        />
        <MetricCard
          title="Medium Risk (Gap 1-2y)"
          value={loading ? 0 : stats?.medium_risk_count || 0}
          icon={AlertCircle}
          color="yellow"
          loading={loading}
        />
        <MetricCard
          title="Avg. Learning Gap"
          value={loading ? '0.0y' : `${stats?.avg_learning_gap || 0.0} Yrs`}
          icon={BarChart3}
          color="emerald"
          loading={loading}
          subtext="Class average academic gap"
        />
      </div>

      {/* Graphs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Competency Heatmap */}
        <div className="lg:col-span-2 glass-panel border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Competency Heatmap</h3>
            <p className="text-xs text-slate-400 mt-1 mb-6">
              Average scores of students across grade levels and skill layers.
            </p>
            
            {loading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-8 bg-slate-800 rounded w-full"></div>
                <div className="h-8 bg-slate-800 rounded w-full"></div>
                <div className="h-8 bg-slate-800 rounded w-full"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Competency</th>
                      <th className="pb-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Grade 1 Avg</th>
                      <th className="pb-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Grade 2 Avg</th>
                      <th className="pb-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Grade 3 Avg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {heatmapData.map((row, idx) => (
                      <tr key={idx} className="border-b border-white/5 last:border-0 hover:bg-slate-900/20">
                        <td className="py-3.5 text-sm font-semibold text-slate-200">{row.competency}</td>
                        <td className="py-2 text-center">
                          <div className={`mx-auto w-16 py-1.5 rounded-lg border text-xs font-bold heatmap-cell ${getHeatmapColor(row.G1)}`}>
                            {row.G1 > 0 ? `${row.G1}%` : 'N/A'}
                          </div>
                        </td>
                        <td className="py-2 text-center">
                          <div className={`mx-auto w-16 py-1.5 rounded-lg border text-xs font-bold heatmap-cell ${getHeatmapColor(row.G2)}`}>
                            {row.G2 > 0 ? `${row.G2}%` : 'N/A'}
                          </div>
                        </td>
                        <td className="py-2 text-center">
                          <div className={`mx-auto w-16 py-1.5 rounded-lg border text-xs font-bold heatmap-cell ${getHeatmapColor(row.G3)}`}>
                            {row.G3 > 0 ? `${row.G3}%` : 'N/A'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Learning Gap distribution */}
        <div className="glass-panel border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Grade Level Gap</h3>
            <p className="text-xs text-slate-400 mt-1 mb-6">
              Distribution of curriculum gap sizes in years.
            </p>
            
            {loading ? (
              <div className="h-60 bg-slate-800/40 rounded-xl animate-pulse"></div>
            ) : (
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gapData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis dataKey="range" type="category" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#0d1426', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '12px' }}
                      labelClassName="text-white font-bold"
                    />
                    <Bar dataKey="students" fill="#2563eb" radius={[0, 4, 4, 0]} maxBarSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          
          <div className="border-t border-white/5 pt-4 mt-4 flex items-center justify-between text-xs text-slate-400">
            <span>High Risk Threshold: 2+ Years Gap</span>
            <span className="font-semibold text-rose-400">🚨 {stats?.high_risk_count || 0} students</span>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Assessments list */}
        <div className="glass-panel border border-white/5 rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4.5 w-4.5 text-blue-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recent Diagnostic Activities</h3>
            </div>
            <Link to="/students" className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition">
              Assess Student <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-10 bg-slate-800 rounded"></div>
              <div className="h-10 bg-slate-800 rounded"></div>
            </div>
          ) : stats?.recent_assessments.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              No recent assessment activity recorded.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {stats?.recent_assessments.map((a, idx) => (
                <div key={idx} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                  <div className="flex flex-col">
                    <Link to={`/student/${a.student_id}`} className="text-sm font-bold text-slate-200 hover:text-blue-400 transition">
                      {a.student_name}
                    </Link>
                    <span className="text-[10px] text-slate-400 font-medium mt-0.5">{a.date}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-slate-800 text-slate-300 font-bold px-2.5 py-1 rounded-lg border border-white/5">
                      {a.subject}
                    </span>
                    <span className={`text-sm font-black ${a.score >= 70 ? 'text-emerald-400' : a.score >= 40 ? 'text-yellow-400' : 'text-rose-400'}`}>
                      {a.score}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Flagged Students Side Panel */}
        <div className="glass-panel border border-rose-500/10 rounded-2xl p-6 bg-gradient-to-b from-rose-950/5 to-transparent">
          <div className="flex items-center gap-2 border-b border-rose-500/10 pb-4 mb-4">
            <ShieldAlert className="h-4.5 w-4.5 text-rose-500" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Urgent Intervention Alerts</h3>
          </div>

          {loading ? (
            <div className="h-32 bg-slate-800/40 rounded-xl animate-pulse"></div>
          ) : highRiskStudents.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              🎉 Excellent! No students are currently flagged as High Risk.
            </div>
          ) : (
            <div className="flex flex-col gap-3.5">
              {highRiskStudents.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-950/40 border border-white/5 hover:border-rose-500/20 px-4 py-3 rounded-xl transition">
                  <div className="flex flex-col">
                    <Link to={`/student/${s.id}`} className="text-sm font-bold text-slate-200 hover:text-rose-400 transition">
                      {s.name}
                    </Link>
                    <span className="text-[10px] text-slate-400 font-medium mt-0.5">Grade {s.grade} | School: {s.school.split(' ').pop()}</span>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400 font-extrabold px-2 py-0.5 rounded-lg">
                      -{s.learning_gap?.gap_years || 2.0} Yrs
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
