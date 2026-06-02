import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import MetricCard from '../components/MetricCard';
import VoiceRecorder from '../components/VoiceRecorder';
import { 
  Users, AlertCircle, BarChart3, Clock, ArrowRight, ShieldAlert, 
  Play, BookOpen, Calculator, Upload, Plus, Trash2, CheckCircle2, 
  RefreshCw, Volume2, Sparkles, Languages, Check, X, FileSpreadsheet, 
  Building2, HelpCircle, Activity, Trophy, Mic, GraduationCap 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar, LineChart, Line 
} from 'recharts';
import { Link, useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || '');
  
  // Shared States
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [schools, setSchools] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [stats, setStats] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);
  const [gapData, setGapData] = useState([]);
  
  // Admin-Specific States
  const [adminTab, setAdminTab] = useState('schools'); // schools, question_bank, csv_import
  const [newSchool, setNewSchool] = useState({ name: '', location: '' });
  const [newTeacher, setNewTeacher] = useState({ name: '', email: '', school_id: '' });
  const [questions, setQuestions] = useState([]);
  const [questionFilters, setQuestionFilters] = useState({ subject: '', language: '', grade_level: '' });
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState([]);
  const [csvImportSummary, setCsvImportSummary] = useState(null);
  const [csvTargetSchool, setCsvTargetSchool] = useState('');
  const [csvTargetTeacher, setCsvTargetTeacher] = useState('');
  const [newQuestionForm, setNewQuestionForm] = useState({
    subject: 'literacy', competency: 'dictation', difficulty: 1, grade_level: 1,
    text: '', options: '', correct_answer: '', language: 'English', question_type: 'Dictation'
  });
  const [aiGenerating, setAiGenerating] = useState(false);

  // Student-Specific States
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentProfile, setStudentProfile] = useState(null);
  const [studentRadarData, setStudentRadarData] = useState([]);
  const [studentProgressData, setStudentProgressData] = useState([]);
  const [voicePracticeLevel, setVoicePracticeLevel] = useState(1);
  const [voicePracticeText, setVoicePracticeText] = useState('Read the word: Apple');
  const [voicePracticeResponse, setVoicePracticeResponse] = useState(null);
  const [voicePracticeLoading, setVoicePracticeLoading] = useState(false);

  const fetchGlobalData = async () => {
    setLoading(true);
    try {
      const [studentsRes, schoolsRes, teachersRes, statsRes, heatmapRes, gapRes] = await Promise.all([
        api.getStudents(),
        api.getSchools(),
        api.getTeachers(),
        api.getDashboardStats(),
        api.getHeatmapData(),
        api.getGapDistribution()
      ]);
      setStudents(studentsRes);
      setSchools(schoolsRes);
      setTeachers(teachersRes);
      setStats(statsRes);
      setHeatmapData(heatmapRes);
      setGapData(gapRes);

      // Default CSV dropdowns
      if (schoolsRes.length > 0) setCsvTargetSchool(schoolsRes[0].id.toString());
      if (teachersRes.length > 0) setCsvTargetTeacher(teachersRes[0].id.toString());
      
      // Default Student dropdown
      const storedStudentId = localStorage.getItem('studentId');
      if (userRole === 'Student' && storedStudentId) {
        setSelectedStudentId(storedStudentId);
        loadStudentDetails(parseInt(storedStudentId));
      } else if (studentsRes.length > 0) {
        setSelectedStudentId(studentsRes[0].id.toString());
        loadStudentDetails(studentsRes[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalData();
  }, []);

  useEffect(() => {
    if (adminTab === 'question_bank') {
      loadQuestions();
    }
  }, [adminTab, questionFilters]);

  // Load Questions for Admin question bank
  const loadQuestions = async () => {
    try {
      const params = {};
      if (questionFilters.subject) params.subject = questionFilters.subject;
      if (questionFilters.language) params.language = questionFilters.language;
      if (questionFilters.grade_level) params.grade_level = parseInt(questionFilters.grade_level);
      const data = await api.getQuestions(params);
      setQuestions(data);
    } catch (err) {
      console.error('Failed to load questions:', err);
    }
  };

  // Add School
  const handleAddSchool = async (e) => {
    e.preventDefault();
    if (!newSchool.name) return;
    try {
      await api.createSchool(newSchool);
      setNewSchool({ name: '', location: '' });
      fetchGlobalData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create school');
    }
  };

  // Add Teacher
  const handleAddTeacher = async (e) => {
    e.preventDefault();
    if (!newTeacher.name) return;
    try {
      const data = {
        name: newTeacher.name,
        email: newTeacher.email || null,
        school_id: newTeacher.school_id ? parseInt(newTeacher.school_id) : null
      };
      await api.createTeacher(data);
      setNewTeacher({ name: '', email: '', school_id: schools[0]?.id || '' });
      fetchGlobalData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create teacher');
    }
  };

  // Toggle question status
  const handleToggleQuestion = async (id, currentActive) => {
    try {
      await api.toggleQuestionStatus(id, !currentActive);
      loadQuestions();
    } catch (err) {
      alert('Failed to toggle question status');
    }
  };

  // Handle Question Deletion
  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await api.deleteQuestion(id);
      loadQuestions();
    } catch (err) {
      alert('Failed to delete question');
    }
  };

  // AI Generate Question
  const handleAIGenerateQuestion = async () => {
    setAiGenerating(true);
    try {
      const data = {
        subject: newQuestionForm.subject,
        competency: newQuestionForm.competency,
        difficulty: parseInt(newQuestionForm.difficulty),
        grade_level: parseInt(newQuestionForm.grade_level),
        language: newQuestionForm.language
      };
      const res = await api.generateQuestionAI(data);
      setNewQuestionForm(prev => ({
        ...prev,
        text: res.text,
        correct_answer: res.correct_answer,
        options: res.options ? JSON.parse(res.options).join(', ') : '',
        question_type: res.question_type
      }));
    } catch (err) {
      alert('Failed to generate question. Falling back to offline rule generator.');
      // Fallback is also triggered in the backend automatically, but in case of connection failure:
      const fallback = getOfflineQuestionFallback();
      setNewQuestionForm(prev => ({ ...prev, ...fallback }));
    } finally {
      setAiGenerating(false);
    }
  };

  const getOfflineQuestionFallback = () => {
    // Basic local fallback structures
    const subject = newQuestionForm.subject;
    const comp = newQuestionForm.competency;
    const diff = newQuestionForm.difficulty;
    const lang = newQuestionForm.language;

    if (subject === 'literacy') {
      if (comp === 'dictation') {
        return {
          text: lang === 'English' ? 'Listen and type the word: [Dictation]' : 'सुनें और शब्द टाइप करें: [Dictation]',
          correct_answer: lang === 'English' ? 'apple' : 'सेब',
          options: '',
          question_type: 'Dictation'
        };
      }
      return {
        text: lang === 'English' ? 'Read this sentence aloud: The cat sat.' : 'इस वाक्य को ज़ोर से पढ़ें: घर चल।',
        correct_answer: lang === 'English' ? 'The cat sat.' : 'घर चल।',
        options: '',
        question_type: 'Reading'
      };
    } else {
      const num1 = diff * 3;
      const num2 = diff * 2;
      return {
        text: `Solve: ${num1} + ${num2} = ?`,
        correct_answer: `${num1 + num2}`,
        options: `${num1 + num2 - 1}, ${num1 + num2}, ${num1 + num2 + 2}`,
        question_type: 'MCQ'
      };
    }
  };

  // Submit Question Creation
  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestionForm.text || !newQuestionForm.correct_answer) {
      alert('Question Text and Correct Answer are required!');
      return;
    }
    try {
      const opts = newQuestionForm.options
        ? JSON.stringify(newQuestionForm.options.split(',').map(o => o.trim()))
        : null;

      const data = {
        ...newQuestionForm,
        options: opts,
        is_teacher_created: userRole === 'Teacher',
        difficulty: parseInt(newQuestionForm.difficulty),
        grade_level: parseInt(newQuestionForm.grade_level)
      };

      await api.createQuestion(data);
      alert('Question successfully saved to pool!');
      setNewQuestionForm({
        subject: 'literacy', competency: 'dictation', difficulty: 1, grade_level: 1,
        text: '', options: '', correct_answer: '', language: 'English', question_type: 'Dictation'
      });
      if (adminTab === 'question_bank') loadQuestions();
    } catch (err) {
      alert('Failed to save question');
    }
  };

  // Read CSV locally for preview
  const handleCsvSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFile(file);
    setCsvImportSummary(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').map(l => l.split(','));
      if (lines.length > 0) {
        // Assume first line is header
        const headers = lines[0].map(h => h.trim());
        const previewRows = [];
        for (let i = 1; i < Math.min(lines.length, 6); i++) {
          if (lines[i].length >= headers.length && lines[i][0]) {
            previewRows.push({
              name: lines[i][0].trim(),
              age: lines[i][1]?.trim() || '',
              grade: lines[i][2]?.trim() || '',
              gender: lines[i][3]?.trim() || '',
              language: lines[i][4]?.trim() || ''
            });
          }
        }
        setCsvPreview(previewRows);
      }
    };
    reader.readAsText(file);
  };

  // Perform bulk student import
  const handleConfirmCsvImport = async () => {
    if (!csvFile) return;
    try {
      const res = await api.importStudents(csvFile, csvTargetSchool, csvTargetTeacher);
      setCsvImportSummary(res.summary);
      setCsvPreview([]);
      setCsvFile(null);
      fetchGlobalData();
      alert(`Import complete! Successfully imported ${res.summary.success_count} students.`);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to import CSV file');
    }
  };

  // Load details for selected Student (Student Role Dashboard)
  const loadStudentDetails = async (studentId) => {
    try {
      const res = await api.getStudent(studentId);
      setStudentProfile(res);
      
      // Load radar competency scores
      const radar = res.competency_scores.map(s => ({
        subject: s.competency.replace('_', ' ').replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase()),
        score: s.score,
        fullMark: 100
      }));
      setStudentRadarData(radar);

      // Simple timeline mock for linechart progress
      const progress = [
        { name: 'Jan', Score: 20 },
        { name: 'Feb', Score: 30 },
        { name: 'Mar', Score: 45 },
        { name: 'Apr', Score: 50 },
        { name: 'May', Score: res.learning_gap ? Math.max(20, Math.round(res.learning_gap.actual_level * 20)) : 40 }
      ];
      setStudentProgressData(progress);
      
      // Set default practice prompt
      updatePracticePrompt(voicePracticeLevel, res.language);
    } catch (err) {
      console.error('Failed to load student details:', err);
    }
  };

  const updatePracticePrompt = (level, lang = 'English') => {
    // Update local voice practice expected text based on grade level
    const prompts = {
      English: [
        "Cat", // Grade 1
        "The sun is warm.", // Grade 2
        "Priya has a little white dog named Spot. Spot loves to run in the park.", // Grade 3
        "Rainwater harvesting is the simple process of collecting and storing rainwater for future use. It helps recharge groundwater levels.", // Grade 4
        "Foundational learning builds the cognitive pathway to student success. Every child deserves quality offline metrics support." // Grade 5
      ],
      Hindi: [
        "कमल", // Grade 1
        "घर चल कर फल खा।", // Grade 2
        "प्रिया के पास एक छोटा सफेद कुत्ता है जिसका नाम स्पॉट है। स्पॉट को पार्क में दौड़ना पसंद है।", // Grade 3
        "वर्षा जल संचयन भविष्य के उपयोग के लिए बारिश के पानी को इकट्ठा करने की प्रक्रिया है। यह गर्मियों में पानी की कमी को रोकता है।", // Grade 4
        "प्राथमिक शिक्षा ही देश के उज्ज्वल भविष्य की मजबूत नींव रखती है। हर छात्र को बुनियादी साक्षरता और संख्यात्मक कौशल प्राप्त करना चाहिए।" // Grade 5
      ]
    };
    const pool = prompts[lang] || prompts["English"];
    const idx = min(level - 1, pool.length - 1);
    setVoicePracticeText(pool[idx]);
    setVoicePracticeResponse(null);
  };

  const min = (a, b) => (a < b ? a : b);

  const handlePracticeLevelChange = (level) => {
    setVoicePracticeLevel(level);
    updatePracticePrompt(level, studentProfile?.language);
  };

  // Submit voice recording practice file
  const handlePracticeVoiceUpload = async (audioBlob, duration) => {
    setVoicePracticeLoading(true);
    try {
      const file = new File([audioBlob], 'practice_recording.wav', { type: 'audio/wav' });
      const res = await api.uploadVoiceFile(
        studentProfile.id,
        voicePracticeText,
        duration,
        file
      );
      setVoicePracticeResponse(res);
    } catch (err) {
      console.error('Voice practice upload failed:', err);
      alert('Failed to evaluate recording. Ensure Whisper server is running or try again.');
    } finally {
      setVoicePracticeLoading(false);
    }
  };

  const renderAdminDashboard = () => {
    return (
      <div className="space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <MetricCard title="Total Schools" value={schools.length} icon={Building2} color="orange" />
          <MetricCard title="Total Teachers" value={teachers.length} icon={GraduationCap} color="blue" />
          <MetricCard title="Total Students" value={students.length} icon={Users} color="emerald" />
          <MetricCard title="High Risk Students" value={stats?.high_risk_count || 0} icon={ShieldAlert} color="rose" />
          <MetricCard title="Avg learning Gap" value={`${stats?.avg_learning_gap || 0.0}y`} icon={BarChart3} color="yellow" />
        </div>

        {/* Double Column Manager Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls Side panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Schools management Form */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-300">
              <h3 className="text-md font-extrabold uppercase text-slate-800 tracking-wider mb-4 flex items-center gap-2">
                <Building2 className="h-4.5 w-4.5 text-orange-500" />
                Register New School
              </h3>
              <form onSubmit={handleAddSchool} className="space-y-4">
                <input
                  type="text"
                  placeholder="School Name (e.g. GPS Block A)"
                  value={newSchool.name}
                  onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300"
                  required
                />
                <input
                  type="text"
                  placeholder="Location (e.g. New Delhi)"
                  value={newSchool.location}
                  onChange={(e) => setNewSchool({ ...newSchool, location: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300"
                />
                <button type="submit" className="w-full bg-[#003366] text-white py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1">
                  <Plus className="h-3.5 w-3.5" /> Add School
                </button>
              </form>
            </div>

            {/* Teacher management Form */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-300">
              <h3 className="text-md font-extrabold uppercase text-slate-800 tracking-wider mb-4 flex items-center gap-2">
                <GraduationCap className="h-4.5 w-4.5 text-blue-500" />
                Register New Teacher
              </h3>
              <form onSubmit={handleAddTeacher} className="space-y-4">
                <input
                  type="text"
                  placeholder="Teacher Full Name"
                  value={newTeacher.name}
                  onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300"
                  required
                />
                <input
                  type="email"
                  placeholder="Email ID (optional)"
                  value={newTeacher.email}
                  onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300"
                />
                <select
                  value={newTeacher.school_id}
                  onChange={(e) => setNewTeacher({ ...newTeacher, school_id: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 cursor-pointer"
                  required
                >
                  <option value="">Select Associated School...</option>
                  {schools.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1">
                  <Plus className="h-3.5 w-3.5" /> Add Teacher
                </button>
              </form>
            </div>
          </div>

          {/* Tabbed Central views */}
          <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border border-slate-300 flex flex-col min-h-[450px]">
            {/* Header Tabs */}
            <div className="flex border-b border-slate-300 pb-3 mb-6 gap-6">
              <button
                onClick={() => setAdminTab('schools')}
                className={`text-xs font-black uppercase tracking-wider pb-2 border-b-2 cursor-pointer transition ${adminTab === 'schools' ? 'border-[#003366] text-[#003366]' : 'border-transparent text-slate-400'}`}
              >
                Registered Schools & Teachers
              </button>
              <button
                onClick={() => setAdminTab('question_bank')}
                className={`text-xs font-black uppercase tracking-wider pb-2 border-b-2 cursor-pointer transition ${adminTab === 'question_bank' ? 'border-[#003366] text-[#003366]' : 'border-transparent text-slate-400'}`}
              >
                Master Question Bank
              </button>
              <button
                onClick={() => setAdminTab('csv_import')}
                className={`text-xs font-black uppercase tracking-wider pb-2 border-b-2 cursor-pointer transition ${adminTab === 'csv_import' ? 'border-[#003366] text-[#003366]' : 'border-transparent text-slate-400'}`}
              >
                Bulk Student CSV Upload
              </button>
            </div>

            {/* Tab contents */}
            {adminTab === 'schools' && (
              <div className="space-y-6 flex-1">
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">School Records ({schools.length})</h4>
                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                    {schools.length === 0 ? (
                      <p className="p-4 text-xs text-slate-400 text-center">No schools registered yet.</p>
                    ) : (
                      schools.map(s => (
                        <div key={s.id} className="flex justify-between items-center p-3 text-xs bg-slate-50/50 hover:bg-slate-50">
                          <span className="font-semibold text-slate-700">{s.name} <span className="text-slate-400">({s.location || 'No Location'})</span></span>
                          <button onClick={() => api.deleteSchool(s.id).then(fetchGlobalData)} className="text-rose-500 hover:text-rose-600 cursor-pointer">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">Teacher Records ({teachers.length})</h4>
                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                    {teachers.length === 0 ? (
                      <p className="p-4 text-xs text-slate-400 text-center">No teachers registered yet.</p>
                    ) : (
                      teachers.map(t => {
                        const associatedSchool = schools.find(s => s.id === t.school_id)?.name || 'Unassigned';
                        return (
                          <div key={t.id} className="flex justify-between items-center p-3 text-xs bg-slate-50/50 hover:bg-slate-50">
                            <span className="font-semibold text-slate-700">
                              {t.name} <span className="text-slate-400">({t.email || 'No email'})</span> — <span className="text-blue-500">{associatedSchool}</span>
                            </span>
                            <button onClick={() => api.deleteTeacher(t.id).then(fetchGlobalData)} className="text-rose-500 hover:text-rose-600 cursor-pointer">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {adminTab === 'question_bank' && (
              <div className="flex-1 flex flex-col space-y-4">
                {/* Filters */}
                <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <select
                    value={questionFilters.subject}
                    onChange={(e) => setQuestionFilters({ ...questionFilters, subject: e.target.value })}
                    className="text-xs p-2 rounded border cursor-pointer"
                  >
                    <option value="">All Subjects</option>
                    <option value="literacy">Literacy</option>
                    <option value="numeracy">Numeracy</option>
                  </select>
                  <select
                    value={questionFilters.language}
                    onChange={(e) => setQuestionFilters({ ...questionFilters, language: e.target.value })}
                    className="text-xs p-2 rounded border cursor-pointer"
                  >
                    <option value="">All Languages</option>
                    {["English", "Hindi", "Marathi", "Gujarati", "Bengali", "Tamil", "Telugu"].map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                  <select
                    value={questionFilters.grade_level}
                    onChange={(e) => setQuestionFilters({ ...questionFilters, grade_level: e.target.value })}
                    className="text-xs p-2 rounded border cursor-pointer"
                  >
                    <option value="">All Grades</option>
                    <option value="1">Grade 1</option>
                    <option value="2">Grade 2</option>
                    <option value="3">Grade 3</option>
                    <option value="4">Grade 4</option>
                    <option value="5">Grade 5</option>
                  </select>
                </div>

                {/* Table list */}
                <div className="flex-1 max-h-72 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                  {questions.length === 0 ? (
                    <p className="p-8 text-xs text-slate-400 text-center">No questions found matching criteria.</p>
                  ) : (
                    questions.map(q => (
                      <div key={q.id} className="p-3 text-xs bg-slate-50/50 hover:bg-slate-50 flex justify-between items-center gap-4">
                        <div className="flex-1">
                          <p className="font-bold text-slate-800 mb-1">{q.text}</p>
                          <div className="flex gap-2.5 text-[9px] font-bold text-slate-400">
                            <span className="uppercase text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">{q.subject}</span>
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded">{q.competency}</span>
                            <span className="bg-yellow-50 text-yellow-600 px-1.5 py-0.5 rounded">Grade {q.grade_level}</span>
                            <span className="bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded">Diff {q.difficulty}</span>
                            <span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded">{q.language}</span>
                            <span className="bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">{q.question_type}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {/* Toggle Active status */}
                          <button
                            onClick={() => handleToggleQuestion(q.id, q.is_active)}
                            className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition ${q.is_active ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}
                          >
                            {q.is_active ? 'Active' : 'Inactive'}
                          </button>

                          <button onClick={() => handleDeleteQuestion(q.id)} className="text-rose-500 hover:text-rose-600 cursor-pointer">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {adminTab === 'csv_import' && (
              <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider mb-2">CSV Upload Form</h4>
                    <p className="text-xs text-slate-500 mb-4">
                      Upload a CSV file containing student records. CSV header must contain: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">Name,Age,Grade,Gender,Language</code>. Duplicate records matching existing student name + grade + school will be automatically ignored.
                    </p>
                  </div>

                  {/* Settings selector for default School/Teacher assignment */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1">Assign to School (Default)</label>
                      <select
                        value={csvTargetSchool}
                        onChange={(e) => setCsvTargetSchool(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 cursor-pointer font-semibold text-slate-600"
                      >
                        {schools.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1">Assign to Teacher (Default)</label>
                      <select
                        value={csvTargetTeacher}
                        onChange={(e) => setCsvTargetTeacher(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 cursor-pointer font-semibold text-slate-600"
                      >
                        {teachers.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Drag drop slot */}
                  <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 bg-slate-50/50 hover:bg-slate-50/80 transition flex flex-col items-center justify-center cursor-pointer relative">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvSelect}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <FileSpreadsheet className="h-9 w-9 text-slate-400 mb-2" />
                    <span className="text-xs font-bold text-slate-600">
                      {csvFile ? csvFile.name : 'Click to browse or drop student CSV file'}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1">Accepts .csv up to 10MB</span>
                  </div>

                  {/* Import summary indicator */}
                  {csvImportSummary && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div className="text-xs text-emerald-800">
                        <p className="font-extrabold uppercase tracking-wider text-[10px] mb-1">CSV Bulk Import Complete Summary</p>
                        <ul className="grid grid-cols-2 gap-2 mt-2 font-semibold">
                          <li>Total Processed: {csvImportSummary.total_processed}</li>
                          <li className="text-emerald-700">Successful: {csvImportSummary.success_count}</li>
                          <li className="text-yellow-700">Duplicates Skipped: {csvImportSummary.duplicate_count}</li>
                          <li className="text-rose-700">Errors: {csvImportSummary.error_count}</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Preview table */}
                  {csvPreview.length > 0 && (
                    <div>
                      <h5 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-2">CSV Parsing Preview (Top 5 rows)</h5>
                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-left border-collapse text-[11px]">
                          <thead>
                            <tr className="bg-slate-100 font-bold border-b border-slate-200 text-slate-500">
                              <th className="p-2">Name</th>
                              <th className="p-2">Age</th>
                              <th className="p-2">Grade</th>
                              <th className="p-2">Gender</th>
                              <th className="p-2">Language</th>
                            </tr>
                          </thead>
                          <tbody>
                            {csvPreview.map((row, idx) => (
                              <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 text-slate-600">
                                <td className="p-2 font-semibold">{row.name}</td>
                                <td className="p-2">{row.age}</td>
                                <td className="p-2">Grade {row.grade}</td>
                                <td className="p-2">{row.gender}</td>
                                <td className="p-2">{row.language}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {csvFile && (
                  <div className="flex justify-end gap-3 mt-6 border-t border-slate-200 pt-4">
                    <button
                      onClick={() => { setCsvFile(null); setCsvPreview([]); }}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold text-xs rounded-lg transition"
                    >
                      Clear
                    </button>
                    <button
                      onClick={handleConfirmCsvImport}
                      className="px-5 py-2 bg-[#003366] text-white font-bold text-xs rounded-lg transition hover:scale-[1.02] active:scale-95 flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Upload className="h-4 w-4" /> Confirm & Import Students
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTeacherDashboard = () => {
    return (
      <div className="space-y-8">
        {/* Quick Launcher Header */}
        <div className="glass-panel border border-blue-500/15 rounded-3xl p-6 bg-gradient-to-r from-blue-950/15 via-indigo-950/10 to-transparent shadow-xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <Play className="h-4.5 w-4.5 text-blue-600 fill-blue-600/20" />
                Adaptive Assessment Launcher
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                Initiate a student assessment immediately. Select a registered student, select the subject area, and begin the adaptive diagnostic evaluation.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const studentSelect = e.target.elements.studentSelect.value;
                const subjSelect = e.target.elements.subjSelect.value;
                if (!studentSelect) {
                  alert('Please select or register a student first.');
                  return;
                }
                navigate(`/assessment/${subjSelect}/${studentSelect}`);
              }}
              className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto"
            >
              <select
                name="studentSelect"
                className="w-full sm:w-60 bg-white border border-slate-300 text-slate-600 text-xs px-4 py-3 rounded-xl focus:border-blue-500/30 focus:outline-none cursor-pointer font-bold"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (Grade {s.grade})
                  </option>
                ))}
              </select>

              <select
                name="subjSelect"
                className="w-full sm:w-40 bg-white border border-slate-300 text-slate-600 text-xs px-4 py-3 rounded-xl focus:border-blue-500/30 focus:outline-none cursor-pointer font-bold"
              >
                <option value="literacy">Literacy</option>
                <option value="numeracy">Numeracy</option>
              </select>

              <button
                type="submit"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#003366] hover:bg-blue-800 text-white font-bold text-xs px-6 py-3 rounded-xl cursor-pointer active:scale-95 transition"
              >
                Start Adaptive Test
              </button>
            </form>
          </div>
        </div>

        {/* Dashboard Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left charts */}
          <div className="lg:col-span-2 space-y-8">
            {/* Heatmap & Gap Distributions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Heatmap */}
              <div className="glass-panel border border-slate-300 rounded-2xl p-5">
                <h3 className="text-sm font-extrabold uppercase text-slate-800 tracking-wider mb-4">Competency Heatmap</h3>
                <div className="overflow-x-auto text-[11px]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="pb-2 text-slate-400 font-bold uppercase">Competency</th>
                        <th className="pb-2 text-center text-slate-400 font-bold uppercase">G1 Avg</th>
                        <th className="pb-2 text-center text-slate-400 font-bold uppercase">G2 Avg</th>
                        <th className="pb-2 text-center text-slate-400 font-bold uppercase">G3 Avg</th>
                      </tr>
                    </thead>
                    <tbody>
                      {heatmapData.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="border-b border-slate-100 last:border-0">
                          <td className="py-2.5 font-bold text-slate-600">{row.competency}</td>
                          {["G1", "G2", "G3"].map(g => {
                            const score = row[g] || 0;
                            let color = 'bg-slate-100 text-slate-400';
                            if (score >= 80) color = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                            else if (score >= 60) color = 'bg-teal-100 text-teal-800 border-teal-200';
                            else if (score >= 40) color = 'bg-yellow-100 text-yellow-800 border-yellow-200';
                            else if (score > 0) color = 'bg-rose-100 text-rose-800 border-rose-200';
                            return (
                              <td key={g} className="py-1.5 text-center">
                                <div className={`mx-auto w-12 py-1.5 rounded border text-[10px] font-bold ${color}`}>
                                  {score > 0 ? `${Math.round(score)}%` : 'N/A'}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Learning Gap distribution */}
              <div className="glass-panel border border-slate-300 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-extrabold uppercase text-slate-800 tracking-wider mb-4">Grade Level Gap</h3>
                  <div className="h-44 w-full text-[10px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={gapData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis type="number" stroke="#94a3b8" />
                        <YAxis dataKey="range" type="category" stroke="#94a3b8" />
                        <Tooltip />
                        <Bar dataKey="students" fill="#003366" radius={[0, 4, 4, 0]} maxBarSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Students list quick link */}
            <div className="glass-panel border border-slate-300 rounded-2xl p-5">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-3">
                <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Struggling Students Alerts</h3>
                <Link to="/students" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  View All Students <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {students.filter(s => s.risk_level?.risk_level === 'HIGH' || s.risk_level?.risk_level === 'MEDIUM').slice(0, 4).map(s => (
                  <div key={s.id} className="flex justify-between items-center p-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 transition">
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase">Grade {s.grade}</span>
                      <p className="text-xs font-bold text-slate-700 mt-0.5">{s.name}</p>
                    </div>
                    <span className={`text-[9px] font-black px-2 py-1 rounded border ${s.risk_level?.risk_level === 'HIGH' ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}`}>
                      {s.risk_level?.risk_level} RISK
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Teacher Question Creator with Gemma AI Form */}
          <div className="lg:col-span-1 glass-panel border border-slate-300 rounded-2xl p-5">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1">
                <Plus className="h-4 w-4 text-emerald-600" /> Custom Question Pool
              </h3>
              <button
                type="button"
                onClick={handleAIGenerateQuestion}
                disabled={aiGenerating}
                className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer active:scale-95 disabled:opacity-50 transition shadow-sm"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {aiGenerating ? 'AI Generating...' : 'AI Generate'}
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Subject</label>
                  <select
                    value={newQuestionForm.subject}
                    onChange={(e) => setNewQuestionForm({ ...newQuestionForm, subject: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded cursor-pointer"
                  >
                    <option value="literacy">Literacy</option>
                    <option value="numeracy">Numeracy</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Language</label>
                  <select
                    value={newQuestionForm.language}
                    onChange={(e) => setNewQuestionForm({ ...newQuestionForm, language: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded cursor-pointer"
                  >
                    {["English", "Hindi", "Marathi", "Gujarati", "Bengali", "Tamil", "Telugu"].map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Competency</label>
                  <select
                    value={newQuestionForm.competency}
                    onChange={(e) => setNewQuestionForm({ ...newQuestionForm, competency: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded cursor-pointer text-[10px]"
                  >
                    {newQuestionForm.subject === 'literacy' ? (
                      <>
                        <option value="dictation">Dictation</option>
                        <option value="sentence_reading">Sentence</option>
                        <option value="comprehension">Comprehend</option>
                      </>
                    ) : (
                      <>
                        <option value="number_recognition">Number</option>
                        <option value="counting">Counting</option>
                        <option value="number_sense">Sense</option>
                        <option value="addition">Addition</option>
                        <option value="subtraction">Subtract</option>
                        <option value="multiplication">Multiply</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Grade</label>
                  <select
                    value={newQuestionForm.grade_level}
                    onChange={(e) => setNewQuestionForm({ ...newQuestionForm, grade_level: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5].map(g => (
                      <option key={g} value={g}>G{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Diff</label>
                  <select
                    value={newQuestionForm.difficulty}
                    onChange={(e) => setNewQuestionForm({ ...newQuestionForm, difficulty: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5].map(d => (
                      <option key={d} value={d}>D{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Question Text</label>
                <textarea
                  placeholder="e.g. Read this sentence: The cat sat."
                  value={newQuestionForm.text}
                  onChange={(e) => setNewQuestionForm({ ...newQuestionForm, text: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded text-xs"
                  rows={2}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Options (Optional MCQ)</label>
                  <input
                    type="text"
                    placeholder="e.g. cat, dog, bird"
                    value={newQuestionForm.options}
                    onChange={(e) => setNewQuestionForm({ ...newQuestionForm, options: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded text-[11px]"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Correct Answer</label>
                  <input
                    type="text"
                    placeholder="e.g. cat"
                    value={newQuestionForm.correct_answer}
                    onChange={(e) => setNewQuestionForm({ ...newQuestionForm, correct_answer: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded text-[11px]"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#003366] text-white py-2.5 rounded-lg text-xs font-bold transition hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-1 shadow-md cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Save Question to pool
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const renderStudentDashboard = () => {
    if (!studentProfile) return <div className="text-slate-500 text-xs">Loading profile details...</div>;
    
    return (
      <div className="space-y-8">
        {/* Welcome greeting banner */}
        <div className="glass-panel border border-[#cbd5e1] rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 bg-gradient-to-r from-blue-50 to-transparent">
          <div>
            <span className="text-[10px] font-black uppercase text-orange-500 bg-orange-50 border border-orange-200/50 px-2.5 py-1 rounded-md">
              Student Login ID: STU-{studentProfile.id}
            </span>
            <h2 className="text-2xl font-black text-[#003366] mt-2.5">Welcome back, {studentProfile.name}!</h2>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Select an option below to start your diagnostic test or practice reading.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-extrabold bg-[#003366] text-white px-3 py-1.5 rounded-lg uppercase">
              Language of Instruction: {studentProfile.language}
            </span>
          </div>
        </div>

        {/* Take Test Launcher Options */}
        <div className="glass-panel border border-[#cbd5e1] rounded-2xl p-6 bg-gradient-to-b from-slate-50 to-transparent">
          <h3 className="text-xs font-black uppercase text-[#003366] tracking-wider flex items-center gap-2 mb-4">
            <BookOpen className="h-4.5 w-4.5 text-[#003366]" />
            Take Diagnostic Test
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              to={`/assessment/literacy/${studentProfile.id}`}
              className="bg-blue-600 hover:bg-blue-500 text-white font-black text-sm p-5 rounded-2xl flex items-center justify-between cursor-pointer transition active:scale-[0.98] shadow-md shadow-blue-600/10 border-0"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-white/10 rounded-xl">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <span className="block font-black uppercase text-[10px] tracking-wide text-blue-200">Literacy Module</span>
                  <span className="text-base font-bold">Start Literacy Assessment</span>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-white" />
            </Link>

            <Link
              to={`/assessment/numeracy/${studentProfile.id}`}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm p-5 rounded-2xl flex items-center justify-between cursor-pointer transition active:scale-[0.98] shadow-md shadow-emerald-600/10 border-0"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-white/10 rounded-xl">
                  <Calculator className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <span className="block font-black uppercase text-[10px] tracking-wide text-emerald-200">Numeracy Module</span>
                  <span className="text-base font-bold">Start Numeracy Assessment</span>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-white" />
            </Link>
          </div>
        </div>

        {/* Double column student workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Student Fingerprint & Progress timeline */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Student profile stats cards */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-300 bg-gradient-to-br from-emerald-50/30 to-transparent">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-800">{studentProfile.name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase">School: {studentProfile.school}</p>
                </div>
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded border ${studentProfile.risk_level?.risk_level === 'HIGH' ? 'bg-rose-100 text-rose-800 border-rose-200' : studentProfile.risk_level?.risk_level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'}`}>
                  {studentProfile.risk_level?.risk_level || 'LOW'} RISK
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-xs">
                <div className="text-slate-400">Age: <span className="font-bold text-slate-700">{studentProfile.age} Yrs</span></div>
                <div className="text-slate-400">Class: <span className="font-bold text-slate-700">Grade {studentProfile.grade}</span></div>
                <div className="text-slate-400 col-span-2">
                  Learning Gap:{' '}
                  <span className={`font-black ${studentProfile.learning_gap?.gap_years >= 2.0 ? 'text-rose-600' : studentProfile.learning_gap?.gap_years >= 1.0 ? 'text-yellow-600' : 'text-emerald-600'}`}>
                    {studentProfile.learning_gap?.gap_years || 0.0} Years
                  </span>
                </div>
              </div>
            </div>

            {/* Competency Radar chart */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-300">
              <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider mb-4">Learning Fingerprint</h3>
              <div className="h-60 w-full text-[9px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={studentRadarData}>
                    <PolarGrid stroke="#cbd5e1" />
                    <PolarAngleAxis dataKey="subject" stroke="#64748b" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94a3b8" />
                    <Radar name={studentProfile.name} dataKey="score" stroke="#138808" fill="#138808" fillOpacity={0.15} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Progress History linechart */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-300">
              <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider mb-4">Improvement Trends</h3>
              <div className="h-44 w-full text-[10px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={studentProgressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis domain={[0, 100]} stroke="#94a3b8" />
                    <Tooltip />
                    <Line type="monotone" dataKey="Score" stroke="#003366" strokeWidth={2.5} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Student Voice Reading Practice Board */}
          <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border border-slate-300 flex flex-col justify-between min-h-[500px]">
            <div>
              <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-5">
                <div>
                  <h3 className="text-md font-extrabold uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                    <Mic className="h-5 w-5 text-orange-500" />
                    Voice Reading Practice Board
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Read aloud to check your pronunciation indices offline</p>
                </div>
                
                {/* Level selector buttons */}
                <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                  {[1, 2, 3, 4, 5].map(lvl => (
                    <button
                      key={lvl}
                      onClick={() => handlePracticeLevelChange(lvl)}
                      className={`px-3 py-1 text-xs font-extrabold rounded-md cursor-pointer transition ${voicePracticeLevel === lvl ? 'bg-[#003366] text-white' : 'text-slate-500 hover:bg-slate-200'}`}
                    >
                      L{lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Large reading prompt display card */}
              <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 border border-slate-300 rounded-2xl p-8 mb-6 relative overflow-hidden flex items-center justify-center min-h-[160px]">
                <div className="text-center space-y-4 max-w-2xl relative z-10">
                  <span className="text-[10px] font-black tracking-widest uppercase text-orange-500 bg-orange-100 px-3 py-1 rounded-full">
                    Expected Reading Prompt Level {voicePracticeLevel}
                  </span>
                  <p className="text-xl md:text-2xl font-black text-slate-800 tracking-wide leading-relaxed mt-2" style={{ fontFamily: 'Georgia, serif' }}>
                    {voicePracticeText}
                  </p>
                </div>
                <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-[#003366]/5 rounded-full filter blur-xl pointer-events-none"></div>
              </div>

              {/* Microphone Voice Recording Zone */}
              <div className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-2xl mb-6 bg-slate-50/30">
                <VoiceRecorder 
                  studentId={studentProfile.id} 
                  expectedText={voicePracticeText} 
                  onEvaluationCompleted={(data) => setVoicePracticeResponse(data)} 
                />
              </div>

              {/* Practice evaluation reports */}
              {voicePracticeResponse && (
                <div className="space-y-4 border-t border-slate-200 pt-5 animate-in fade-in zoom-in-95 duration-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase">Reading Accuracy</span>
                      <p className="text-lg font-black text-emerald-700 mt-1">{voicePracticeResponse.accuracy}%</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase">Pronunciation Score</span>
                      <p className="text-lg font-black text-blue-700 mt-1">{voicePracticeResponse.pronunciation_score}%</p>
                    </div>
                    <div className="bg-teal-50 border border-teal-100 p-3 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase">Fluency Score</span>
                      <p className="text-lg font-black text-teal-700 mt-1">{voicePracticeResponse.reading_fluency}%</p>
                    </div>
                    <div className="bg-orange-50 border border-orange-100 p-3 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase">Speed (WPM)</span>
                      <p className="text-lg font-black text-orange-700 mt-1">{voicePracticeResponse.words_per_minute}</p>
                    </div>
                  </div>

                  {/* Transcript box with alignment highlighting */}
                  <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3">
                    <div>
                      <h4 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Spoken Audio Playback</h4>
                      <audio src={`http://localhost:8000${voicePracticeResponse.audio_url}`} controls className="w-full mt-2 h-9" />
                    </div>

                    <div>
                      <h4 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Pronunciation Word Alignment Highlight</h4>
                      <p className="text-sm font-semibold leading-relaxed mt-2 text-slate-700">
                        {voicePracticeText.split(' ').map((word, idx) => {
                          const cleanWord = word.toLowerCase().replace(/[^\w\u0900-\u097F]/g, '');
                          const isSkipped = voicePracticeResponse.skipped_words.map(w => w.toLowerCase()).includes(cleanWord);
                          const isWrong = voicePracticeResponse.wrong_words.map(w => w.toLowerCase()).includes(cleanWord);
                          
                          let color = 'text-emerald-600 bg-emerald-50 px-1 rounded';
                          if (isSkipped) color = 'text-slate-400 bg-slate-100 line-through px-1 rounded';
                          else if (isWrong) color = 'text-rose-500 bg-rose-50 px-1 rounded border border-rose-100';

                          return (
                            <span key={idx} className={`${color} mr-2 inline-block my-1`}>
                              {word}
                            </span>
                          );
                        })}
                      </p>
                    </div>

                    <div className="text-[10px] text-slate-400 font-semibold border-t border-slate-100 pt-2 flex justify-between">
                      <span>Transcription Source: {voicePracticeResponse.transcription_source || 'Whisper'}</span>
                      <span className="text-emerald-600">Green: Correct | Red: Mispronounced | Gray: Skipped</span>
                    </div>
                  </div>

                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-400 font-bold border-t border-slate-200 pt-4 mt-6 text-center">
              Target Level Goals: Grade 1 (Words) &rarr; Grade 2 (Sentences) &rarr; Grade 3 (Paragraphs) &rarr; Grade 4 (Comprehension) &rarr; Grade 5 (Complex Contexts)
            </div>
          </div>

        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
        <RefreshCw className="h-9 w-9 text-[#003366] animate-spin" />
        <span className="text-sm text-slate-500 font-semibold">Probing local servers and building SQLite data index...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 pb-12">
      {/* Title */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight capitalize">
            {userRole} Diagnostic Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Offline FLN Diagnostics Portal — National Primary Education Assessment Framework.
          </p>
        </div>
      </div>

      {userRole === 'Admin' && renderAdminDashboard()}
      {userRole === 'Teacher' && renderTeacherDashboard()}
      {userRole === 'Student' && renderStudentDashboard()}
    </div>
  );
}
