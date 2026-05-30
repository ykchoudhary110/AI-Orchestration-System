import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Database, BrainCircuit, Activity, BookOpen } from 'lucide-react';
import axios from 'axios';

export default function Navbar() {
  const location = useLocation();
  const [aiMode, setAiMode] = useState('Checking...');
  const [backendStatus, setBackendStatus] = useState('offline');

  useEffect(() => {
    // Probe backend connection
    const checkStatus = async () => {
      try {
        const res = await axios.get('http://localhost:8000/');
        if (res.data.status === 'online') {
          setBackendStatus('online');
          // Check if LM Studio is reachable
          try {
            const lmRes = await axios.post('http://localhost:1234/v1/chat/completions', {
              model: 'gemma-3-4b',
              messages: [{ role: 'user', content: 'test' }],
              max_tokens: 1
            }, { timeout: 1000 });
            if (lmRes.status === 200) {
              setAiMode('Gemma 3 4B (Local)');
            } else {
              setAiMode('Local Fallback (Rule-Based)');
            }
          } catch {
            setAiMode('Local Fallback (Rule-Based)');
          }
        }
      } catch {
        setBackendStatus('offline');
        setAiMode('Offline');
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#003366] border-t-4 border-orange-500 border-b border-[#002244] px-6 py-4 flex items-center justify-between mb-8 shadow-md">
      {/* Brand Header */}
      <div className="flex items-center gap-3">
        <div className="bg-white/10 p-2.5 rounded-xl">
          <BookOpen className="h-6 w-6 text-white" />
        </div>
        <div>
          <span className="font-extrabold text-xl tracking-tight text-white uppercase">
            FLN Compass
          </span>
          <p className="text-[9px] text-slate-300 font-bold tracking-wider uppercase">
            Ministry of Education | FLN Diagnostic Portal
          </p>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="hidden md:flex items-center gap-1.5">
        <Link
          to="/"
          className={`flex items-center gap-2 px-4.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
            isActive('/') 
              ? 'bg-white/20 text-white border border-white/20' 
              : 'text-slate-300 hover:text-white hover:bg-white/10 border border-transparent'
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>
        <Link
          to="/students"
          className={`flex items-center gap-2 px-4.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
            isActive('/students') || location.pathname.startsWith('/student/') || location.pathname.startsWith('/assessment')
              ? 'bg-white/20 text-white border border-white/20' 
              : 'text-slate-300 hover:text-white hover:bg-white/10 border border-transparent'
          }`}
        >
          <Users className="h-4 w-4" />
          Students
        </Link>
        <Link
          to="/reports"
          className={`flex items-center gap-2 px-4.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
            isActive('/reports') 
              ? 'bg-white/20 text-white border border-white/20' 
              : 'text-slate-300 hover:text-white hover:bg-white/10 border border-transparent'
          }`}
        >
          <FileText className="h-4 w-4" />
          Reports
        </Link>
      </div>

      {/* System Status Metrics */}
      <div className="flex items-center gap-3">
        {/* DB Status */}
        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 text-[11px] font-medium text-white">
          <Database className="h-3.5 w-3.5 text-emerald-300" />
          SQLite: <span className={backendStatus === 'online' ? 'text-emerald-300' : 'text-rose-300'}>
            {backendStatus === 'online' ? 'Connected' : 'Offline'}
          </span>
        </div>

        {/* AI status */}
        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 text-[11px] font-medium text-white">
          <BrainCircuit className="h-3.5 w-3.5 text-blue-300" />
          AI: <span className={aiMode.includes('Fallback') ? 'text-yellow-300' : aiMode === 'Offline' ? 'text-rose-300' : 'text-blue-300'}>
            {aiMode}
          </span>
        </div>
      </div>
    </nav>
  );
}
