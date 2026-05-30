import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import VoiceRecorder from '../components/VoiceRecorder';
import { BookOpen, Calculator, Play, Award, CheckCircle2, ChevronRight, AlertCircle, ArrowLeft } from 'lucide-react';

export default function AssessmentSession() {
  const { studentId, subject } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionStarted, setSessionStarted] = useState(false);
  
  // Session States
  const [assessmentId, setAssessmentId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [selectedOption, setSelectedOption] = useState('');
  const [writtenResponse, setWrittenResponse] = useState('');
  const [isFinished, setIsFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Timer States
  const [totalTimer, setTotalTimer] = useState(0);
  const [questionTimer, setQuestionTimer] = useState(0);
  const timerIntervalRef = useRef(null);
  const qTimerIntervalRef = useRef(null);

  // Outcome Summary State
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const data = await api.getStudent(studentId);
        setStudent(data);
      } catch (err) {
        console.error('Failed to load student details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [studentId]);

  // Clean timers on unmount
  useEffect(() => {
    return () => {
      clearInterval(timerIntervalRef.current);
      clearInterval(qTimerIntervalRef.current);
    };
  }, []);

  const handleStartSession = async () => {
    setLoading(true);
    try {
      const data = await api.startAssessment(studentId, subject);
      setAssessmentId(data.assessment_id);
      setCurrentQuestion(data.first_question);
      setSessionStarted(true);
      setQuestionCount(1);
      
      // Start timers
      setTotalTimer(0);
      setQuestionTimer(0);
      timerIntervalRef.current = setInterval(() => setTotalTimer(t => t + 1), 1000);
      qTimerIntervalRef.current = setInterval(() => setQuestionTimer(q => q + 1), 1000);
    } catch (err) {
      console.error('Failed to start assessment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = async () => {
    if (!currentQuestion) return;
    
    // Validate response input
    let studentResponse = '';
    if (currentQuestion.options) {
      if (!selectedOption) {
        alert('Please select an option first.');
        return;
      }
      studentResponse = selectedOption;
    } else if (currentQuestion.competency === 'sentence_reading') {
      // Handled inside VoiceRecorder component, we just fetch written response snapshot
      if (!writtenResponse) {
        alert('Please record and evaluate the voice reading first.');
        return;
      }
      studentResponse = writtenResponse;
    } else {
      if (!writtenResponse.trim()) {
        alert('Please type an answer first.');
        return;
      }
      studentResponse = writtenResponse;
    }

    setSubmitting(true);
    try {
      const qTime = questionTimer;
      // Reset question timer
      setQuestionTimer(0);
      
      const responseData = await api.nextQuestion(
        assessmentId,
        currentQuestion.id,
        studentResponse,
        qTime
      );

      // Reset inputs
      setSelectedOption('');
      setWrittenResponse('');

      if (responseData.finished) {
        clearInterval(qTimerIntervalRef.current);
        // Call submit assessment to calculate outcomes
        const submitData = await api.submitAssessment(assessmentId, totalTimer);
        clearInterval(timerIntervalRef.current);
        setSummary(submitData);
        setIsFinished(true);
      } else {
        setCurrentQuestion(responseData.next_question);
        setQuestionCount(responseData.current_progress + 1);
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Callback when voice evaluation finishes inside VoiceRecorder component
  const handleVoiceEvaluationCompleted = (result) => {
    // Save transcript as written response to submit to adaptive tracker
    setWrittenResponse(result.spoken_text);
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Convert JSON string options to array
  const parseOptions = (optionsStr) => {
    try {
      return JSON.parse(optionsStr);
    } catch {
      return [];
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6 pb-12 animate-pulse space-y-6">
        <div className="h-40 bg-slate-800 rounded-2xl w-full"></div>
      </div>
    );
  }

  // Finished Screen
  if (isFinished && summary) {
    const rec = summary.recommendation;
    return (
      <div className="container mx-auto px-6 pb-12 max-w-2xl animate-in fade-in slide-in-from-bottom-6 duration-300">
        <div className="glass-panel border border-emerald-500/10 rounded-3xl p-8 bg-gradient-to-b from-emerald-950/5 to-transparent text-center">
          <div className="mx-auto bg-emerald-500/15 border border-emerald-500/20 p-4 rounded-2xl w-fit mb-6">
            <Award className="h-12 w-12 text-emerald-400" />
          </div>
          
          <h2 className="text-2xl font-black text-white tracking-tight">Assessment Completed!</h2>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
            {subject} Diagnostics Dashboard Updated
          </p>

          {/* Scores Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-slate-950/60 border border-white/5 p-4 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Score</span>
              <p className="text-xl font-black text-white mt-1">{summary.score}%</p>
            </div>
            <div className="bg-slate-950/60 border border-white/5 p-4 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Active Gap</span>
              <p className="text-xl font-black text-rose-400 mt-1">{summary.learning_gap} Yrs</p>
            </div>
            <div className="bg-slate-950/60 border border-white/5 p-4 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Grade Level</span>
              <p className="text-xl font-black text-blue-400 mt-1">{summary.actual_level}</p>
            </div>
            <div className="bg-slate-950/60 border border-white/5 p-4 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Risk Rating</span>
              <p className="text-xl font-black text-yellow-400 mt-1">{summary.risk_level}</p>
            </div>
          </div>

          {/* AI recommendations */}
          {rec && (
            <div className="border-t border-white/5 pt-6 mt-8 text-left flex flex-col gap-4">
              <div>
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Classroom Action Plan:</h4>
                <div className="bg-slate-950/40 border border-white/5 p-4 rounded-xl text-xs text-slate-300 whitespace-pre-line leading-relaxed font-semibold">
                  {rec.teacher}
                </div>
              </div>
              {rec.parent && (
                <div>
                  <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-2">Parent Consultation (Hindi):</h4>
                  <div className="bg-slate-950/40 border border-white/5 p-4 rounded-xl text-xs text-slate-300 font-sans italic leading-relaxed">
                    {rec.parent}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Go Back button */}
          <button
            onClick={() => navigate(`/student/${studentId}`)}
            className="w-full mt-8 bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all text-white font-bold text-sm py-3 rounded-xl cursor-pointer"
          >
            Go to Student Profile
          </button>
        </div>
      </div>
    );
  }

  // Pre-Start Screen
  if (!sessionStarted) {
    return (
      <div className="container mx-auto px-6 pb-12 max-w-xl">
        <div className="glass-panel border border-white/5 rounded-3xl p-8 flex flex-col items-center text-center">
          <div className="bg-blue-600/10 border border-blue-500/10 p-4 rounded-2xl w-fit mb-6">
            {subject === 'literacy' ? (
              <BookOpen className="h-12 w-12 text-blue-400" />
            ) : (
              <Calculator className="h-12 w-12 text-violet-400" />
            )}
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight">Adaptive {subject === 'literacy' ? 'Literacy' : 'Numeracy'} Assessment</h2>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed">
            You are beginning a diagnostic evaluation for <span className="text-white font-bold">{student.name}</span>.<br />
            The testing engine will scale question difficulties dynamically to analyze core foundational competency boundaries.
          </p>

          <div className="w-full bg-slate-950/60 border border-white/5 rounded-xl p-4.5 text-left text-xs text-slate-400 my-6 flex flex-col gap-2 font-medium">
            <p>• Language preference: <span className="text-slate-200 font-bold">{student.language}</span></p>
            <p>• Current School Grade: <span className="text-slate-200 font-bold">Grade {student.grade}</span></p>
            <p>• Question format: Adaptive (Correct answers raise difficulty, wrong answers reduce difficulty)</p>
          </div>

          <div className="flex items-center gap-3 w-full">
            <button
              onClick={() => navigate(`/student/${studentId}`)}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm py-3 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" /> Cancel
            </button>
            <button
              onClick={handleStartSession}
              className="flex-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm py-3 rounded-xl transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-lg shadow-blue-600/10"
            >
              <Play className="h-4 w-4" /> Start Assessment
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Assessment Question screen
  const questionOptions = currentQuestion ? parseOptions(currentQuestion.options) : [];

  return (
    <div className="container mx-auto px-6 pb-12 max-w-2xl">
      {/* Session Progress Header */}
      <div className="flex items-center justify-between mb-5 text-slate-400 text-xs">
        <span className="font-bold uppercase tracking-wider">Question {questionCount}</span>
        <div className="flex items-center gap-4.5 font-bold uppercase tracking-wider">
          <span>Active Competency: <span className="text-blue-400">{currentQuestion.competency.replace('_', ' ').toUpperCase()}</span></span>
          <span>Time: <span className="text-white">{formatTimer(totalTimer)}</span></span>
        </div>
      </div>

      {/* Main Question Panel Card */}
      <div className="glass-panel border border-white/5 rounded-3xl p-6.5 mb-6 flex flex-col gap-6 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <span className="text-[10px] font-extrabold bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded uppercase tracking-wider">
            Difficulty: {currentQuestion.difficulty} / 5
          </span>
          <span className="text-[10px] font-bold text-slate-500 uppercase">
            Curriculum Grade {currentQuestion.grade_level}
          </span>
        </div>

        {/* Check if Voice reading question */}
        {currentQuestion.competency === 'sentence_reading' ? (
          <div className="flex flex-col gap-5">
            <VoiceRecorder
              expectedText={currentQuestion.correct_answer}
              studentId={student.id}
              onEvaluationCompleted={handleVoiceEvaluationCompleted}
            />
            
            {/* Direct manual grading backup right in the main session view */}
            {!writtenResponse && (
              <div className="border-t border-white/5 pt-4 mt-2 flex flex-col items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2.5">
                  Microphone Issues? Grade Oral Sentence Reading Directly:
                </span>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setWrittenResponse(currentQuestion.correct_answer);
                    }}
                    className="bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/25 px-4.5 py-2.5 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
                  >
                    ✔️ Student Read Correctly (Skip Mic)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWrittenResponse('FAILED_ORAL_READING');
                    }}
                    className="bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/25 px-4.5 py-2.5 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
                  >
                    ❌ Student Read Incorrectly (Skip Mic)
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-6.5">
            {/* Question Text */}
            <div className="text-xl font-bold text-white leading-relaxed text-center py-4 bg-slate-950/40 rounded-2xl border border-white/5 px-6">
              {currentQuestion.text.replace(/\[\w+\]/, '').trim()}
            </div>

            {/* Answer Selector Inputs */}
            {currentQuestion.options ? (
              /* Multiple Choice */
              <div className="grid grid-cols-1 gap-3">
                {questionOptions.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedOption(opt)}
                    className={`text-left p-4.5 rounded-xl border text-sm font-semibold transition active:scale-99 cursor-pointer ${
                      selectedOption === opt
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/15'
                        : 'bg-slate-900/50 border-white/5 hover:border-white/10 text-slate-300 hover:text-white'
                    }`}
                  >
                    <span className="inline-block bg-slate-800 text-slate-400 text-xs font-bold w-6 h-6 rounded-md text-center leading-6 mr-3">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {opt}
                  </button>
                ))}
              </div>
            ) : (subject === 'literacy' || currentQuestion.competency === 'number_recognition') ? (
              /* Teacher Grading for Oral Questions (Phonics, Word Reading, Number Recognition, etc.) */
              <div className="flex flex-col items-center bg-slate-950/40 border border-white/5 rounded-2xl p-5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3">
                  Teacher Oral Grading (No typing required)
                </span>
                <div className="flex gap-4 w-full">
                  <button
                    type="button"
                    onClick={() => {
                      setWrittenResponse(currentQuestion.correct_answer);
                      setSelectedOption(currentQuestion.correct_answer);
                    }}
                    className={`flex-1 py-4.5 rounded-xl border text-sm font-bold transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 ${
                      writtenResponse === currentQuestion.correct_answer
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/15'
                        : 'bg-emerald-600/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-600 hover:text-white'
                    }`}
                  >
                    ✔️ Read Correctly
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWrittenResponse('FAILED_ORAL_READING');
                      setSelectedOption('FAILED_ORAL_READING');
                    }}
                    className={`flex-1 py-4.5 rounded-xl border text-sm font-bold transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 ${
                      writtenResponse === 'FAILED_ORAL_READING'
                        ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/15'
                        : 'bg-rose-600/10 border-rose-500/25 text-rose-400 hover:bg-rose-600 hover:text-white'
                    }`}
                  >
                    ❌ Read Incorrectly
                  </button>
                </div>
              </div>
            ) : (
              /* Standard Numeracy Written Text Input (expected answer is a standard English number) */
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Write response below:</label>
                <input
                  type="text"
                  value={writtenResponse}
                  onChange={(e) => setWrittenResponse(e.target.value)}
                  placeholder="Type student response here..."
                  className="w-full bg-slate-950 border border-white/5 text-slate-200 text-base font-bold px-4.5 py-3.5 rounded-xl focus:border-blue-500/30 focus:outline-none transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleNextQuestion();
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Navigation Action bar */}
      <div className="flex items-center justify-between gap-4 mt-6">
        <button
          onClick={() => {
            if (confirm('Are you sure you want to stop this assessment? Progress will be lost.')) {
              navigate(`/student/${studentId}`);
            }
          }}
          className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-semibold text-sm rounded-xl transition cursor-pointer"
        >
          Abort
        </button>

        {/* Hide Next button if voice recorder is not completed or spoken */}
        {currentQuestion.competency === 'sentence_reading' && !writtenResponse ? null : (
          <button
            onClick={handleNextQuestion}
            disabled={submitting}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl flex items-center gap-1 active:scale-95 transition-all cursor-pointer shadow-lg shadow-blue-600/10"
          >
            {submitting ? 'Submitting...' : 'Submit Response'}
            <ChevronRight className="h-4.5 w-4.5" />
          </button>
        )}
      </div>
    </div>
  );
}
