import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import VideocamIcon from '@mui/icons-material/Videocam';

import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { AuthContext } from "./contents/AuthContext";

export default function LandingPage() {
  const navigate = useNavigate();
  const { addToUserHistory } = useContext(AuthContext);

  const handleStartMeeting = async () => {
    const code = Math.random().toString(36).substring(7);
    try {
      await addToUserHistory(code);
    } catch (e) {
      console.log("History sync skipped:", e);
    }
    navigate(`/meeting/${code}`);
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white selection:bg-blue-500/30 font-['Outfit','Inter',sans-serif] overflow-x-hidden">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0b0e14]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">
              <VideocamIcon className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Connectify</span>
          </Link>

          <div className="flex items-center gap-6 text-sm font-medium">
            <button 
              onClick={() => navigate("/meeting/guest-" + Math.random().toString(36).substring(7))}
              className="text-gray-400 hover:text-white transition-colors hidden md:block"
            >
              Join as Guest
            </button>
            <Link to="/auth?mode=register" className="text-gray-400 hover:text-white transition-colors">Register</Link>
            <Link 
              to="/auth?mode=login" 
              className="rounded-full bg-blue-600 px-6 py-2.5 text-white font-bold transition hover:bg-blue-500 active:scale-95 shadow-lg shadow-blue-600/20"
            >
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <main className="mx-auto max-w-7xl px-6 pt-40 pb-32">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
          
          {/* LEFT SIDE: CONTENT */}
          <div className="relative animate-fade-in-left">
            {/* Ambient Background Glow */}
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full -z-10 animate-pulse"></div>
            

            
            <h1 className="text-6xl font-extrabold tracking-tight sm:text-7xl mb-8 leading-[1.1]">
              Connect <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">instantly</span>, talk seamlessly.
            </h1>
            
            <p className="text-xl text-gray-400 mb-10 leading-relaxed max-w-lg">
              Experience the highest quality video meetings. Simple, secure, and built for everyone, from individuals to global teams.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-5 font-bold mb-12">
              <Link 
                to="/auth?mode=register" 
                className="w-full sm:w-auto rounded-2xl bg-blue-600 px-10 py-4 text-white shadow-xl shadow-blue-600/30 transition hover:bg-blue-500 hover:-translate-y-1 active:scale-95 text-center flex items-center justify-center gap-2"
              >
                Sign Up Now
                <ArrowForwardIcon sx={{ fontSize: 20 }} />
              </Link>
              <button 
                onClick={handleStartMeeting}
                className="w-full sm:w-auto rounded-2xl border border-white/10 bg-white/5 px-10 py-4 text-white backdrop-blur-xl transition hover:bg-white/10 hover:-translate-y-1 active:scale-95 text-center"
              >
                Start Meeting
              </button>
            </div>


          </div>

          {/* RIGHT SIDE: IMAGE & DECORATION */}
          <div className="relative lg:block animate-fade-in-right">
            {/* Background Aesthetic */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full -z-10"></div>
            
            <div className="relative group perspective-1000">
              <div className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-r from-blue-600 to-indigo-600 opacity-20 blur-2xl transition duration-1000 group-hover:opacity-40"></div>
              
              <div className="relative rounded-[2.5rem] border border-white/10 bg-[#0b0e14] overflow-hidden shadow-2xl animate-float-premium">
                <img 
                  src="/mobile.png" 
                  alt="Connectify Interface" 
                  className="w-full transition duration-700 group-hover:scale-[1.03]" 
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 to-transparent"></div>
              </div>
              

            </div>
          </div>

        </div>
      </main>

      {/* STYLE OVERRIDES */}
      <style>{`
        @keyframes floatPremium {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(1deg); }
        }
        @keyframes bounceSoft {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes fadeInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-float-premium { animation: floatPremium 8s ease-in-out infinite; }
        .animate-bounce-soft { animation: bounceSoft 6s ease-in-out infinite; }
        .animate-bounce-soft-delayed { animation: bounceSoft 7s ease-in-out infinite 1s; }
        .animate-fade-in-left { animation: fadeInLeft 1s ease-out; }
        .animate-fade-in-right { animation: fadeInRight 1.2s ease-out; }
        .animate-spin-slow { animation: spin 4s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .perspective-1000 { perspective: 1000px; }
      `}</style>
    </div>
  );
}
