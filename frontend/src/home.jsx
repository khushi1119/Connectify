import React, { useContext, useState } from "react";
import withAuth from "./utils/withAuth";
import { useNavigate, Link } from "react-router-dom";
import RestoreIcon from '@mui/icons-material/Restore';
import VideocamIcon from '@mui/icons-material/Videocam';
import LogoutIcon from '@mui/icons-material/Logout';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import HomeIcon from '@mui/icons-material/Home';
import { AuthContext } from "./contents/AuthContext";

function HomeComponent() {
  const navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");
  const { addToUserHistory } = useContext(AuthContext);

  const handleJoinVideoCall = async () => {
    if (!meetingCode.trim()) return;
    try {
      await addToUserHistory(meetingCode);
      navigate(`/meeting/${meetingCode}`);
    } catch (err) {
      console.error(err);
      navigate(`/meeting/${meetingCode}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white selection:bg-blue-500/30 font-['Outfit','Inter',sans-serif] overflow-x-hidden">
      {/* Dynamic Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/5 blur-[120px] rounded-full -z-10 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[10%] w-[40%] h-[40%] bg-indigo-600/5 blur-[120px] rounded-full -z-10 animate-pulse" style={{ animationDelay: '3s' }}></div>

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0b0e14]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">
              <VideocamIcon className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Connectify</span>
          </Link>

          <div className="flex items-center gap-4">
            <button 
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/10 active:scale-95 text-blue-400" 
              onClick={() => navigate("/")}
            >
              <HomeIcon sx={{ fontSize: 20 }} />
              <span className="hidden sm:inline">Landing</span>
            </button>
            <button 
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/10 active:scale-95" 
              onClick={() => navigate("/history")}
            >
              <RestoreIcon sx={{ fontSize: 20 }} className="text-blue-400" />
              <span className="hidden sm:inline">History</span>
            </button>
            <button 
              className="flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-400 border border-red-500/20 transition hover:bg-red-500/20 active:scale-95" 
              onClick={handleLogout}
            >
              <LogoutIcon sx={{ fontSize: 18 }} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="mx-auto max-w-7xl px-6 pt-40 pb-32 animate-fade-in">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
          {/* LEFT PANEL */}
          <div className="space-y-8 lg:max-w-xl">

            <h1 className="text-6xl font-extrabold tracking-tight sm:text-7xl leading-[1.1]">
              Meet <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">differently</span>.
            </h1>
            <p className="text-xl text-gray-400 leading-relaxed">
              Experience the next generation of video collaboration. High definition meets low latency for a social experience that feels like togetherness.
            </p>

            <div className="group relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 p-10 shadow-3xl backdrop-blur-2xl transition-all hover:border-white/20">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 h-40 w-40 rounded-full bg-blue-600/10 blur-[80px]"></div>
              
              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-4 uppercase tracking-widest pl-1">Join a Room</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none text-gray-500 group-focus-within:text-blue-500 transition-colors">
                      <KeyboardIcon fontSize="small" />
                    </div>
                    <input 
                      className="block w-full rounded-2xl border-0 bg-[#0b0e14]/50 py-5 pl-14 pr-4 text-white ring-1 ring-inset ring-white/10 placeholder:text-gray-600 focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-all text-base outline-none font-mono"
                      placeholder="Enter code (e.g. xyz-123)"
                      value={meetingCode}
                      onChange={(e) => setMeetingCode(e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 py-5 text-xl font-bold text-white shadow-xl shadow-blue-600/30 transition hover:bg-blue-500 hover:scale-[1.01] active:scale-95"
                  onClick={handleJoinVideoCall}
                >
                  Join Meeting
                  <ArrowForwardIcon sx={{ fontSize: 24 }} />
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="relative group hidden lg:block animate-fade-in-right">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-20 blur-2xl transition duration-1000 group-hover:opacity-40"></div>
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur-sm animate-float-premium">
               <img 
                 src="/mobile.png" 
                 alt="Connectify Interface" 
                 className="rounded-[2.2rem] shadow-2xl transition duration-700 group-hover:scale-[1.02]" 
               />
               <div className="absolute inset-0 rounded-[2.2rem] bg-gradient-to-t from-black/20 to-transparent pointer-none"></div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes floatPremium {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        .animate-fade-in { animation: fadeIn 0.8s ease-out; }
        .animate-fade-in-right { animation: fadeInRight 1.2s ease-out; }
        .animate-float-premium { animation: floatPremium 6s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

export default withAuth(HomeComponent);
