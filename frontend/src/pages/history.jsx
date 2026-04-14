import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../contents/AuthContext";
import { useNavigate } from "react-router-dom";
import withAuth from "../utils/withAuth";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarIcon from '@mui/icons-material/CalendarToday';
import TimeIcon from '@mui/icons-material/AccessTime';
import MeetingIcon from '@mui/icons-material/MeetingRoom';
import RejoinIcon from '@mui/icons-material/Replay';
import CopyIcon from '@mui/icons-material/ContentPaste';
import HomeIcon from '@mui/icons-material/Home';
import VideocamIcon from '@mui/icons-material/Videocam';

function History() {
  const { getHistoryOfUser, clearHistoryOfUser } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true); // Start as true to avoid flicker
  const navigate = useNavigate();

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const history = await getHistoryOfUser();
      setMeetings(history || []);
    } catch (err) {
      console.error("Fetch history error:", err);
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to clear your entire meeting history? This cannot be undone.")) return;
    
    setLoading(true);
    try {
      await clearHistoryOfUser();
      setMeetings([]);
    } catch (err) {
      console.error("Clear history error:", err);
      alert("Failed to clear history. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [getHistoryOfUser]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white selection:bg-blue-500/30 font-['Outfit','Inter',sans-serif] overflow-x-hidden">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[10%] w-[50%] h-[50%] bg-blue-600/5 blur-[120px] rounded-full -z-10 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/5 blur-[120px] rounded-full -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0b0e14]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-4">
          <div className="flex cursor-pointer items-center gap-2 group" onClick={() => navigate("/")}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">
              <VideocamIcon className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Connectify</span>
          </div>

          <div className="h-6 w-px bg-white/10 ml-2"></div>
          
          <button 
            className="flex h-11 px-4 items-center justify-center rounded-xl bg-white/5 border border-white/10 transition-all hover:bg-white/10 active:scale-95 text-gray-400 hover:text-white gap-2" 
            onClick={() => navigate("/home")}
          >
            <ArrowBackIcon fontSize="small" />
            <span className="text-sm font-bold">Dashboard</span>
          </button>
          
          <button 
            onClick={handleClearHistory}
            className={`ml-auto flex h-11 px-6 items-center justify-center rounded-xl bg-red-600/10 border border-red-500/20 text-red-500 text-xs font-bold uppercase tracking-wider transition-all hover:bg-red-600/20 hover:scale-[1.02] active:scale-95 ${loading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            {loading ? "Clearing..." : "Clear History"}
          </button>
        </div>
      </nav>

      {/* CONTENT */}
      <main className="mx-auto max-w-5xl px-6 pt-40 pb-32 animate-fade-in">
        <header className="mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/5 px-4 py-1.5 text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">
             Archive
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight mb-4">Past Sessions</h1>
          <p className="text-xl text-gray-400">Review your past meetings and rejoin active discussions instantly.</p>
        </header>

        {loading ? (
          /* LOADING STATE */
          <div className="flex flex-col items-center justify-center py-32 space-y-6">
              <div className="h-16 w-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin shadow-lg shadow-blue-600/20"></div>

          </div>
        ) : meetings.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {meetings.slice().reverse().map((meeting, index) => (
              <div 
                key={index} 
                className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-8 rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-2xl transition-all duration-500 hover:border-white/20 hover:bg-white/[0.08] hover:translate-y-[-4px] shadow-2xl"
              >
                <div className="flex items-center gap-8">
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-600/20 border border-blue-500/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
                    <MeetingIcon className="text-blue-400" fontSize="large" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-4">
                      <h3 className="text-2xl font-bold tracking-tight text-white font-mono uppercase">
                        {meeting.meetingCode.replace("/meeting/", "")}
                      </h3>
                      <button 
                        onClick={() => {
                           navigator.clipboard.writeText(meeting.meetingCode.replace("/meeting/", ""));
                        }}
                        className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-all hover:bg-white/10"
                        title="Copy Code"
                      >
                        <CopyIcon sx={{ fontSize: 16 }} />
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-gray-400">
                      <div className="flex items-center gap-2">
                        <CalendarIcon sx={{ fontSize: 18 }} className="text-blue-500" />
                        {formatDate(meeting.date)}
                      </div>
                      <div className="flex items-center gap-2">
                        <TimeIcon sx={{ fontSize: 18 }} className="text-indigo-400" />
                        {formatTime(meeting.date)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button 
                    className="flex flex-1 sm:flex-none items-center justify-center gap-3 rounded-2xl bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-blue-600/30 transition-all hover:bg-blue-500 hover:scale-[1.05] active:scale-95"
                    onClick={() => navigate(meeting.meetingCode.startsWith("/meeting") ? meeting.meetingCode : `/meeting/${meeting.meetingCode}`)}
                  >
                    <RejoinIcon sx={{ fontSize: 20 }} />
                    Rejoin Session
                  </button>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-0 right-10 -z-10 h-32 w-32 bg-blue-600/5 blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center rounded-[3rem] border border-dashed border-white/10 bg-white/5 animate-fade-in">
            <div className="h-24 w-24 mb-8 rounded-[2rem] bg-white/5 flex items-center justify-center shadow-inner">
               <MeetingIcon className="text-gray-700" sx={{ fontSize: 48 }} />
            </div>
            <h2 className="text-3xl font-extrabold text-white mb-4">The vault is empty</h2>
            <p className="text-gray-400 max-w-sm text-lg leading-relaxed">Your journey begins here. Once you host your first meeting, all your logs will appear in this secure archive.</p>
            <button 
              onClick={() => navigate("/home")}
              className="mt-10 rounded-2xl bg-blue-600 px-10 py-4 text-base font-bold text-white shadow-xl shadow-blue-600/30 transition-all hover:bg-blue-500 hover:scale-[1.05] active:scale-95"
            >
              Launch First Meeting
            </button>
          </div>
        )}
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.8s ease-out; }
      `}</style>
    </div>
  );
}

export default withAuth(History);
