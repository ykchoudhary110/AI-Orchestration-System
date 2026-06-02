import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, RotateCcw, Volume2, CheckCircle2, AlertTriangle, UserCheck, AudioLines } from 'lucide-react';
import { api } from '../services/api';

export default function VoiceRecorder({ expectedText, onEvaluationCompleted, studentId, assessmentId, questionId }) {
  const [isRecording, setIsRecording] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [recognition, setRecognition] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [evalResult, setEvalResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [startTime, setStartTime] = useState(null);

  // HTML5 Audio Recording States
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);

  // Initialize Speech Recognition (for real-time display feedback)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.continuous = true;
      recog.interimResults = true;
      recog.lang = 'en-US';

      recog.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        const currentText = finalTranscript || interimTranscript;
        setSpokenText(currentText);
      };

      recog.onerror = (event) => {
        // Log silently. Since we are offline-first, Chrome Web Speech network failures are expected.
        console.warn('Real-time Web Speech status:', event.error);
      };

      recog.onend = () => {
        console.log('Real-time Web Speech session ended.');
      };

      setRecognition(recog);
    }
  }, []);

  // Handle Recording Toggle
  const startRecording = async () => {
    setErrorMsg('');
    setSpokenText('');
    setEvalResult(null);
    setAudioBlob(null);
    chunksRef.current = [];
    setStartTime(Date.now());
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMsg('Microphone access is unavailable. Please ensure you are accessing the website via http://localhost:5173 (not an IP address) to grant secure browser permissions. Otherwise, use Teacher Oral Grading below.');
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Start HTML5 binary recording
      const options = { mimeType: 'audio/webm' };
      let recorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch {
        recorder = new MediaRecorder(stream);
      }
      
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();

      // Deactivated online Web Speech recognition in offline mode to prevent 
      // Chrome network exceptions from resetting the component state.
      /*
      if (recognition) {
        try {
          recognition.start();
        } catch {}
      }
      */

      setIsRecording(true);
      startVisualizer(stream);
    } catch (e) {
      console.error('Failed to access microphone:', e);
      setErrorMsg('Microphone hardware was blocked. Please check browser privacy settings or use manual grading.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    
    if (recognition) {
      try {
        recognition.stop();
      } catch {}
    }
    
    setIsRecording(false);
    stopVisualizer();
  };

  // Visualizer drawing
  const startVisualizer = (stream) => {
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 64;
      source.connect(analyserRef.current);
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        animationRef.current = requestAnimationFrame(draw);
        analyserRef.current.getByteFrequencyData(dataArray);

        ctx.fillStyle = '#080d1a';
        ctx.fillRect(0, 0, width, height);

        const barWidth = (width / bufferLength) * 1.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          barHeight = dataArray[i] / 2;
          
          const grad = ctx.createLinearGradient(0, height, 0, height - barHeight);
          grad.addColorStop(0, '#2563eb');
          grad.addColorStop(0.5, '#3b82f6');
          grad.addColorStop(1, '#60a5fa');
          
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, height - barHeight, barWidth - 4, barHeight, 4);
          ctx.fill();

          x += barWidth;
        }
      };
      draw();
    } catch (err) {
      console.warn("Unable to draw audio context visualizer:", err);
    }
  };

  const stopVisualizer = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
    }
  };

  // Submit Spoken Transcript to Backend (uploads audio file for Local Whisper evaluation)
  const submitSpeech = async () => {
    if (!audioBlob) {
      setErrorMsg('No recorded audio found. Please speak into the mic.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    const duration = startTime ? (Date.now() - startTime) / 1000.0 : 5.0;
    
    try {
      const data = await api.uploadVoiceFile(
        studentId,
        expectedText,
        Math.max(1.0, duration),
        audioBlob,
        assessmentId,
        questionId
      );
      
      setEvalResult(data);
      setSpokenText(data.spoken_text);
      if (onEvaluationCompleted) {
        onEvaluationCompleted(data);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Local Whisper service is unreachable. Please grade the student manually using the options below.');
    } finally {
      setLoading(false);
    }
  };

  // Manual Grading Action
  const handleManualEvaluation = async (isCorrect) => {
    setLoading(true);
    setErrorMsg('');
    
    try {
      const data = {
        expected_text: expectedText,
        spoken_text: isCorrect ? expectedText : 'FAILED_READING_ATTEMPT',
        accuracy: isCorrect ? 100.0 : 0.0,
        words_per_minute: isCorrect ? 60.0 : 0.0,
        skipped_words: isCorrect ? [] : expectedText.split(' '),
        wrong_words: [],
        reading_fluency: isCorrect ? 85.0 : 0.0,
        transcription_source: "Manual Teacher Input"
      };
      setEvalResult(data);
      setSpokenText(data.spoken_text);
      if (onEvaluationCompleted) {
        onEvaluationCompleted(data);
      }
    } catch (err) {
      console.error("Manual evaluation mapping error:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetSpeech = () => {
    setSpokenText('');
    setEvalResult(null);
    setErrorMsg('');
    setAudioBlob(null);
    chunksRef.current = [];
  };

  return (
    <div className="flex flex-col items-center p-6 bg-slate-900/40 border border-white/5 rounded-2xl w-full">
      {/* Read Target Text Header */}
      <div className="w-full flex items-center justify-between border-b border-white/5 pb-3 mb-4">
        <div className="flex items-center gap-2 text-slate-400">
          <Volume2 className="h-4.5 w-4.5 text-blue-400" />
          <span className="text-xs font-semibold uppercase tracking-wider">Please ask the student to read this sentence aloud:</span>
        </div>
      </div>
      
      <div className="w-full bg-slate-950/60 p-5 rounded-xl border border-white/5 text-center mb-6">
        <p className="text-2xl font-bold text-white tracking-wide leading-relaxed">
          "{expectedText}"
        </p>
      </div>

      {/* Recording Status indicator */}
      {isRecording && (
        <div className="flex items-center gap-2 mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3.5 py-1.5 rounded-lg text-xs font-bold animate-pulse">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          Recording Active... Speak Now
        </div>
      )}

      {/* Visualizer Canvas & Capture Status */}
      {isRecording && (
        <div className="w-full h-12 mb-4 overflow-hidden rounded-lg">
          <canvas ref={canvasRef} width="600" height="48" className="w-full h-full block" />
        </div>
      )}

      {/* Spoken Text Display */}
      {spokenText && spokenText !== 'FAILED_READING_ATTEMPT' && (
        <div className="w-full bg-blue-950/15 border border-blue-500/10 p-4 rounded-xl mb-6">
          <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Recognized Speech:</span>
          <p className="text-lg font-medium text-slate-200 mt-1 italic">
            "{spokenText}"
          </p>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="flex items-center gap-2 bg-rose-950/20 border border-rose-500/10 p-3 rounded-lg text-rose-400 text-xs w-full mb-4">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Rec Controls */}
      <div className="flex items-center gap-4 mb-6">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/10 cursor-pointer"
          >
            <Mic className="h-4 w-4" />
            Start Speaking
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 active:scale-95 transition-all text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-rose-600/10 animate-pulse cursor-pointer"
          >
            <MicOff className="h-4 w-4" />
            Stop Speaking
          </button>
        )}

        {audioBlob && (
          <>
            <button
              onClick={submitSpeech}
              disabled={loading}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-sm px-5 py-2.5 rounded-xl cursor-pointer"
            >
              <AudioLines className="h-4 w-4" />
              {loading ? 'Transcribing...' : 'Transcribe with Local Whisper'}
            </button>
            
            <button
              onClick={resetSpeech}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm px-3.5 py-2.5 rounded-xl cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </>
        )}
      </div>

      {/* Manual Evaluation Backup Options */}
      <div className="w-full flex flex-col items-center border-t border-white/5 pt-5 mt-2 bg-slate-950/20 p-4 rounded-xl">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2.5 flex items-center gap-1">
          <UserCheck className="h-3.5 w-3.5 text-blue-400" />
          Teacher Oral Grading (Offline Backup)
        </span>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => handleManualEvaluation(true)}
            disabled={loading}
            className="bg-emerald-600/15 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 hover:border-emerald-500 px-4 py-2 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
          >
            ✔️ Read Correctly (Pass)
          </button>
          <button
            type="button"
            onClick={() => handleManualEvaluation(false)}
            disabled={loading}
            className="bg-rose-600/15 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 hover:border-rose-500 px-4 py-2 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
          >
            ❌ Read Incorrectly (Fail)
          </button>
        </div>
      </div>

      {/* Fluency Metrics Result */}
      {evalResult && (
        <div className="w-full bg-slate-950/80 border border-white/5 rounded-xl p-5 flex flex-col gap-4 mt-6">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reading Assessment Metrics</h4>
            <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/10">
              Source: {evalResult.transcription_source}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-900 p-3 rounded-lg border border-white/5 text-center">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Accuracy</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">{evalResult.accuracy}%</p>
            </div>
            <div className="bg-slate-900 p-3 rounded-lg border border-white/5 text-center">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Words / Min</span>
              <p className="text-2xl font-black text-blue-400 mt-1">{evalResult.words_per_minute}</p>
            </div>
            <div className="bg-slate-900 p-3 rounded-lg border border-white/5 text-center">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Fluency Score</span>
              <p className="text-2xl font-black text-yellow-400 mt-1">{evalResult.reading_fluency}/100</p>
            </div>
          </div>

          {(evalResult.skipped_words.length > 0 || evalResult.wrong_words.length > 0) && evalResult.accuracy < 100 && (
            <div className="border-t border-white/5 pt-3 mt-1 flex flex-col gap-2">
              {evalResult.skipped_words.length > 0 && (
                <div className="text-xs">
                  <span className="font-semibold text-rose-400">Skipped Words:</span>{' '}
                  <span className="text-slate-300 bg-rose-500/10 px-1.5 py-0.5 rounded ml-1">
                    {evalResult.skipped_words.join(', ')}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
