import React from "react";
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VideocamIcon from '@mui/icons-material/Videocam';
import { AuthContext } from "../contents/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function Authentication() {
  const [searchParams] = useSearchParams();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [formState, setFormState] = React.useState(0); // 0: login, 1: register
  
  const { handleRegister, handleLogin } = React.useContext(AuthContext);
  const navigate = useNavigate();

  // Sync formState with URL parameters if they change
  React.useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "register") setFormState(1);
    else if (mode === "login") setFormState(0);
  }, [searchParams]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      if (formState === 0) {
        await handleLogin(username, password);
        navigate("/home");
      } else {
        await handleRegister(name, username, password);
        navigate("/home");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "An error occurred");
      setMessage("");
    }
  };


  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b0e14] px-4 py-12 relative overflow-hidden font-['Outfit','Inter',sans-serif]">
      {/* Background blobs for aesthetics */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="absolute top-8 left-8 flex items-center gap-2 group cursor-pointer" onClick={() => navigate("/")}>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">
          <VideocamIcon className="text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white">Connectify</span>
      </div>

      <div className="z-10 w-full max-w-md space-y-8 rounded-[2.5rem] border border-white/10 bg-white/5 p-10 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 transition-all duration-500 hover:ring-white/20 relative animate-fade-in">
        <div className="text-center">
          <div className="mb-8 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-xl shadow-blue-600/40 animate-float-premium">
              <VideocamIcon className="text-white" fontSize="large" />
            </div>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight text-white mb-2">
            {formState === 0 ? "Welcome Back" : "Start Journey"}
          </h2>
          <p className="text-sm text-gray-400 font-medium">
            {formState === 0 ? "Sign in to catch up with your circles" : "Join the future of secure communication"}
          </p>
        </div>

        <form className="mt-10 space-y-5" onSubmit={handleAuth}>
          {formState === 1 && (
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-500 group-focus-within:text-blue-500 transition-colors">
                <PersonIcon fontSize="small" />
              </div>
              <input
                type="text"
                className="block w-full rounded-2xl border-0 bg-white/5 py-4 pl-12 pr-4 text-white ring-1 ring-inset ring-white/10 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-all sm:text-sm outline-none"
                placeholder="How should we call you?"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-500 group-focus-within:text-blue-500 transition-colors">
              <PersonIcon fontSize="small" />
            </div>
            <input
              type="text"
              className="block w-full rounded-2xl border-0 bg-white/5 py-4 pl-12 pr-4 text-white ring-1 ring-inset ring-white/10 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-all sm:text-sm outline-none"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-500 group-focus-within:text-blue-500 transition-colors">
              <LockIcon fontSize="small" />
            </div>
            <input
              type="password"
              className="block w-full rounded-2xl border-0 bg-white/5 py-4 pl-12 pr-4 text-white ring-1 ring-inset ring-white/10 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-all sm:text-sm outline-none"
              placeholder="Top Secret Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-center text-xs font-bold text-red-400 bg-red-400/10 py-3 rounded-xl border border-red-400/20">{error}</p>}
          {message && <p className="text-center text-xs font-bold text-green-400 bg-green-400/10 py-3 rounded-xl border border-green-400/20">{message}</p>}

          <button
            type="submit"
            className="group relative flex w-full justify-center rounded-2xl bg-blue-600 py-4 text-base font-bold text-white shadow-xl shadow-blue-600/30 transition-all hover:bg-blue-500 hover:scale-[1.02] active:scale-95 focus:outline-none"
          >
            {formState === 0 ? "Unlock Account" : "Get Started"}
            <ArrowForwardIcon className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" fontSize="small" />
          </button>
        </form>

        <p className="text-center text-sm text-gray-400">
          {formState === 0 ? "New to Connectify?" : "Already found us?"}{" "}
          <button
            onClick={() => setFormState(formState === 0 ? 1 : 0)}
            className="font-bold text-blue-500 hover:text-blue-400 transition-colors"
          >
            {formState === 0 ? "Create an account" : "Sign in here"}
          </button>
        </p>

        <div className="pt-2 text-center border-t border-white/5 mt-4">
           <button onClick={() => navigate("/")} className="text-[11px] font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest flex items-center justify-center gap-2 mx-auto mt-4">
              <ArrowForwardIcon sx={{ fontSize: 12, transform: 'rotate(180deg)' }} />
              Return to Landing
           </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatPremium {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-fade-in { animation: fadeIn 0.8s ease-out; }
        .animate-float-premium { animation: floatPremium 4s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
