import React, { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { api } from '../services/api';
import { BookOpen, Calculator, Calendar, Brain, School, Heart, ChevronLeft, RefreshCw, Milestone, Volume2, Music, Check, X, ShieldAlert } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function StudentProfile() {
  const { id } = useParams();
  const userRole = localStorage.getItem('userRole');
  const studentId = localStorage.getItem('studentId');

  if (userRole === 'Student') {
    return <Navigate to="/" replace />;
  }

  const [student, setStudent] = useState(null);
  const [recs, setRecs] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [expandedAssessmentId, setExpandedAssessmentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reloadingAI, setReloadingAI] = useState(false);

  const loadData = async () => {
    try {
      const [studentData, recsData, assessmentsData] = await Promise.all([
        api.getStudent(id),
        api.getRecommendations(id),
        api.getStudentAssessments(id)
      ]);
      setStudent(studentData);
      setRecs(recsData.recommendations);
      setAssessments(assessmentsData);
      
      // Auto expand the latest assessment if available
      if (assessmentsData.length > 0) {
        setExpandedAssessmentId(assessmentsData[0].id);
      }
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
  const competenciesRadar = student.competency_scores.map(c => ({
    subject: titleCase(c.competency),
    score: c.score,
    fullMark: 100,
  }));

  // Helper to titlecase strings
  function titleCase(str) {
    return str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  // Process longitudinal data
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
            className="flex-1 md:flex-none text-center bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all text-white font-semibold text-xs px-5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <BookOpen className="h-4 w-4" />
            Assess Literacy
          </Link>
          <Link
            to={`/assessment/numeracy/${student.id}`}
            className="flex-1 md:flex-none text-center bg-violet-600 hover:bg-violet-500 active:scale-95 transition-all text-white font-semibold text-xs px-5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Diagnostic Metrics Cards */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          <div className="glass-panel border border-white/5 rounded-2xl p-5 flex flex-col justify-between h-[115px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Curriculum Mapping</span>
            <div className="flex items-center justify-between mt-2">
              <div className="text-center">
                <span className="text-2xl font-black text-slate-700">{student.grade}.0</span>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Expected Grade</p>
              </div>
              <div className="h-8 w-px bg-slate-200"></div>
              <div className="text-center">
                <span className="text-2xl font-black text-blue-600">{student.learning_gap?.actual_level || 0.0}</span>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Actual Level</p>
              </div>
            </div>
          </div>

          <div className="glass-panel border border-white/5 rounded-2xl p-5 flex flex-col justify-between h-[115px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Curriculum Gap Size</span>
            <div className="flex items-end justify-between mt-2">
              <span className={`text-3xl font-extrabold ${student.learning_gap?.gap_years >= 2.0 ? 'text-rose-600' : student.learning_gap?.gap_years >= 1.0 ? 'text-yellow-600' : 'text-emerald-600'}`}>
                {student.learning_gap?.gap_years || 0.0} Years
              </span>
              <span className="text-[10px] font-bold text-slate-500">Curriculum Behind</span>
            </div>
          </div>
        </div>

        {/* AI Recommendations Panel */}
        <div className="glass-panel border border-blue-500/10 rounded-3xl p-6 lg:col-span-2 bg-gradient-to-b from-blue-950/5 to-transparent relative">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Actionable Intervention Plan</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Custom remedial guidelines targeting student gaps.</p>
              </div>
            </div>
            <button
              onClick={triggerAIRecommendation}
              disabled={reloadingAI}
              className="text-[10px] font-bold text-slate-600 hover:text-slate-900 border border-slate-300 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer"
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
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block mb-2">
                  Classroom Remedial Focus ({titleCase(recs[0].competency)})
                </span>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 text-xs text-slate-700 leading-relaxed whitespace-pre-line font-semibold">
                  {recs[0].teacher_recommendation}
                </div>
              </div>
              
              {recs[0].parent_report && (
                <div>
                  <span className="text-[11px] font-bold text-violet-600 uppercase tracking-wider block mb-2">
                    Parent Consult Statement (Hindi Translation)
                  </span>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 text-xs text-slate-700 leading-relaxed italic whitespace-pre-line font-semibold font-sans">
                    {recs[0].parent_report}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Historical Assessment Records & Playback Section */}
      <div className="glass-panel border border-slate-300 rounded-3xl p-6">
        <h3 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2 mb-2">
          <Volume2 className="h-5 w-5 text-orange-500" />
          Completed Diagnostics & Voice Playback Records
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Listen to reading recordings, view exact phonetic matching alignment metrics, and track question details.
        </p>

        {assessments.length === 0 ? (
          <div className="py-12 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-xs">
            No completed assessments found for this student.
          </div>
        ) : (
          <div className="space-y-4">
            {assessments.map((a) => {
              const isExpanded = expandedAssessmentId === a.id;
              return (
                <div key={a.id} className="border border-slate-200 rounded-2xl overflow-hidden transition-all duration-200">
                  {/* Collapsed Header */}
                  <div 
                    onClick={() => setExpandedAssessmentId(isExpanded ? null : a.id)}
                    className="flex items-center justify-between p-4.5 bg-slate-50/80 hover:bg-slate-50 cursor-pointer text-xs font-semibold text-slate-700"
                  >
                    <div className="flex items-center gap-4">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase ${a.subject === 'literacy' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
                        {a.subject}
                      </span>
                      <span>Date: <span className="font-bold text-slate-900">{a.date}</span></span>
                      <span>Duration: <span className="font-bold text-slate-900">{a.duration_seconds}s</span></span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span>Score: <span className={`font-black text-sm ${a.score >= 80 ? 'text-emerald-600' : a.score >= 50 ? 'text-yellow-600' : 'text-rose-600'}`}>{a.score}%</span></span>
                      <ChevronLeft className={`h-4 w-4 text-slate-400 transform transition-transform ${isExpanded ? '-rotate-90' : 'rotate-180'}`} />
                    </div>
                  </div>

                  {/* Expanded Content Responses */}
                  {isExpanded && (
                    <div className="p-5 bg-white divide-y divide-slate-100 space-y-5">
                      {a.responses.length === 0 ? (
                        <p className="text-slate-400 text-xs text-center py-4">No logged responses for this session.</p>
                      ) : (
                        a.responses.map((r, rIdx) => (
                          <div key={r.id} className={`pt-4 first:pt-0 text-xs flex flex-col gap-3.5`}>
                            {/* Response Metadata */}
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase">Question {rIdx + 1} — {r.competency.replace('_', ' ')}</span>
                                <p className="font-bold text-slate-800 mt-0.5">{r.question_text}</p>
                              </div>
                              <span className={`flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded border uppercase ${r.is_correct ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                {r.is_correct ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                {r.is_correct ? 'Correct' : 'Incorrect'}
                              </span>
                            </div>

                            {/* Spoken Audio & Speech Evaluation Panel */}
                            {r.audio_url ? (
                              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                                {/* Pronunciation metrics */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                                  <div className="bg-white border border-slate-200 p-2 rounded-lg">
                                    <span className="text-[9px] text-slate-400 font-extrabold uppercase">Reading Accuracy</span>
                                    <p className="text-sm font-black text-slate-800 mt-0.5">{r.accuracy_score}%</p>
                                  </div>
                                  <div className="bg-white border border-slate-200 p-2 rounded-lg">
                                    <span className="text-[9px] text-slate-400 font-extrabold uppercase">Pronunciation</span>
                                    <p className="text-sm font-black text-slate-800 mt-0.5">{r.pronunciation_score}%</p>
                                  </div>
                                  <div className="bg-white border border-slate-200 p-2 rounded-lg">
                                    <span className="text-[9px] text-slate-400 font-extrabold uppercase">Fluency</span>
                                    <p className="text-sm font-black text-slate-800 mt-0.5">{r.fluency_score}%</p>
                                  </div>
                                  <div className="bg-white border border-slate-200 p-2 rounded-lg">
                                    <span className="text-[9px] text-slate-400 font-extrabold uppercase">Speed (WPM)</span>
                                    <p className="text-sm font-black text-slate-800 mt-0.5">{r.wpm}</p>
                                  </div>
                                </div>

                                {/* Audio Control */}
                                <div className="flex items-center gap-3">
                                  <Music className="h-4.5 w-4.5 text-slate-400" />
                                  <audio src={r.audio_url?.startsWith('blob:') ? r.audio_url : `http://localhost:8000${r.audio_url}`} controls className="flex-1 h-8 rounded" />
                                </div>

                                {/* Alignment highlights */}
                                <div>
                                  <span className="text-[9px] text-slate-400 font-extrabold uppercase block mb-1">Pronunciation Alignment Highlights</span>
                                  <p className="text-xs font-bold leading-relaxed text-slate-700">
                                    {r.question_correct_answer.split(' ').map((word, wIdx) => {
                                      const clean = word.toLowerCase().replace(/[^\w\u0900-\u097F]/g, '');
                                      const isSkipped = r.skipped_words.map(w => w.toLowerCase()).includes(clean);
                                      const isWrong = r.wrong_words.map(w => w.toLowerCase()).includes(clean);

                                      let highlightColor = 'text-emerald-600 bg-emerald-50 px-1 rounded';
                                      if (isSkipped) highlightColor = 'text-slate-400 bg-slate-100 line-through px-1 rounded';
                                      else if (isWrong) highlightColor = 'text-rose-500 bg-rose-50 px-1 rounded border border-rose-100';

                                      return (
                                        <span key={wIdx} className={`${highlightColor} mr-1.5 inline-block my-0.5`}>
                                          {word}
                                        </span>
                                      );
                                    })}
                                  </p>
                                </div>

                                <div className="text-[10px] text-slate-400 font-semibold border-t border-slate-100 pt-2 flex justify-between">
                                  <span>Transcribed Text: "{r.student_response || 'No speech captured'}"</span>
                                  <span>Green: Correct | Red: Mispronounced | Gray: Skipped</span>
                                </div>

                              </div>
                            ) : (
                              r.student_response && (
                                <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                                  Student Response: <span className="font-bold text-slate-800">{r.student_response}</span> 
                                  {r.question_correct_answer && (
                                    <span className="block text-[10px] text-slate-400 mt-1">Expected: "{r.question_correct_answer}"</span>
                                  )}
                                </p>
                              )
                            )}

                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
