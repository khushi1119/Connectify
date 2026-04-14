import React, { useRef, useState, useEffect, useContext } from "react";
import { Badge } from "@mui/material";
import io from "socket.io-client";
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ChatIcon from '@mui/icons-material/Chat';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import EffectsIcon from '@mui/icons-material/AutoAwesome';
import ParticipantsIcon from '@mui/icons-material/Groups';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import PersonIcon from '@mui/icons-material/Person';
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contents/AuthContext";

const server_url = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

const peerConfigConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

let connections = {};
let peerStates = {};

const black = ({ width = 640, height = 480 } = {}) => {
  const canvas = Object.assign(document.createElement("canvas"), { width, height });
  const ctx = canvas.getContext("2d");
  ctx.fillRect(0, 0, width, height);
  const stream = canvas.captureStream();
  const track = stream.getVideoTracks()[0];
  return Object.assign(track, { enabled: false });
};

const silence = () => {
  const ctx = new AudioContext();
  const oscillator = ctx.createOscillator();
  const dst = oscillator.connect(ctx.createMediaStreamDestination());
  oscillator.start();
  const track = dst.stream.getAudioTracks()[0];
  return Object.assign(track, { enabled: false });
};

export default function VideoMeetComponent() {
  const { addToUserHistory } = useContext(AuthContext);
  const socketRef = useRef();
  const socketIdRef = useRef();
  const localVideoRef = useRef();
  const navigate = useNavigate();

  const [videoAvailable, setVideoAvailable] = useState(true);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const [video, setVideo] = useState(true);
  const [audio, setAudio] = useState(true);
  const [askForUsername, setAskForUsername] = useState(true);
  const [username, setUsername] = useState("");
  const [videos, setVideos] = useState([]);
  const [screen, setScreen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [newMessage, setNewMessage] = useState(0);
  const [joinDisabledDevices, setJoinDisabledDevices] = useState(false);
  const [primarySpeaker, setPrimarySpeaker] = useState(null);

  // UI State
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);

  // Participant & Reaction State
  const [participants, setParticipants] = useState({}); // socketId -> username
  const [activeReactions, setActiveReactions] = useState([]); // [{id, emoji, socketId}]
  const [videoEffect, setVideoEffect] = useState("none");
  const [showEffectsMenu, setShowEffectsMenu] = useState(false);

  const sendReaction = (emoji) => {
    socketRef.current.emit("reaction", emoji);
    // Show own reaction locally
    showReaction(socketIdRef.current, emoji);
  };

  const showReaction = (socketId, emoji) => {
    const id = Math.random().toString(36).substring(7);
    setActiveReactions(prev => [...prev, { id, emoji, socketId }]);
    setTimeout(() => {
      setActiveReactions(prev => prev.filter(r => r.id !== id));
    }, 3000);
  };

  const getFilterStyle = (effect) => {
    switch (effect) {
      case "sepia": return "sepia(0.8) contrast(1.1)";
      case "noir": return "grayscale(1) contrast(1.2)";
      case "glow": return "brightness(1.1) contrast(1.1) saturate(1.2)";
      case "dream": return "blur(4px) brightness(1.1)";
      default: return "none";
    }
  };

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const startRecording = () => {
    const stream = window.localStream;
    if (!stream) return;

    recordedChunksRef.current = [];
    const options = { mimeType: 'video/webm;codecs=vp8,opus' };
    
    try {
      const recorder = new MediaRecorder(stream, options);
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `connectify-meeting-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error("Recording error:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const getPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      window.localStream = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setVideoAvailable(true); setAudioAvailable(true);
    } catch (err) {
      setVideoAvailable(false); setAudioAvailable(false);
    }
  };

  useEffect(() => {
    getPermission();
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      Object.values(connections).forEach((pc) => pc.close());
      connections = {}; peerStates = {};
      if (window.localStream) window.localStream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const createPeerConnection = (socketListId, isPolite) => {
    if (connections[socketListId]) return connections[socketListId];
    const pc = new RTCPeerConnection(peerConfigConnections);
    peerStates[socketListId] = { makingOffer: false, ignoreOffer: false, polite: isPolite };

    pc.onicecandidate = (event) => {
      if (event.candidate) socketRef.current.emit("signal", socketListId, JSON.stringify({ ice: event.candidate }));
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0];
      setVideos((prev) => {
        const h = prev.find((v) => v.socketId === socketListId);
        if (h) return prev.map((v) => v.socketId === socketListId ? { ...v, stream } : v);
        return [...prev, { socketId: socketListId, stream }];
      });
    };

    pc.onnegotiationneeded = async () => {
      try {
        peerStates[socketListId].makingOffer = true;
        await pc.setLocalDescription(await pc.createOffer());
        socketRef.current.emit("signal", socketListId, JSON.stringify({ sdp: pc.localDescription }));
      } catch (err) { console.error(err); } finally { peerStates[socketListId].makingOffer = false; }
    };

    if (window.localStream) {
      window.localStream.getTracks().forEach((track) => pc.addTrack(track, window.localStream));
    }
    connections[socketListId] = pc;
    return pc;
  };

  const gotMessageFromServer = async (fromId, message) => {
    const signal = JSON.parse(message);
    if (fromId === socketIdRef.current) return;
    const isPolite = fromId < socketIdRef.current;
    const pc = createPeerConnection(fromId, isPolite);
    const state = peerStates[fromId];

    try {
      if (signal.sdp) {
        const description = signal.sdp;
        const collision = description.type === "offer" && (state.makingOffer || pc.signalingState !== "stable");
        state.ignoreOffer = !state.polite && collision;
        if (state.ignoreOffer) return;
        await pc.setRemoteDescription(new RTCSessionDescription(description));
        if (description.type === "offer") {
          await pc.setLocalDescription(await pc.createAnswer());
          socketRef.current.emit("signal", fromId, JSON.stringify({ sdp: pc.localDescription }));
        }
      }
      if (signal.ice) await pc.addIceCandidate(new RTCIceCandidate(signal.ice));
    } catch (err) { console.error(err); }
  };

  const connectToSocketServer = () => {
    socketRef.current = io(server_url);
    socketRef.current.on("signal", gotMessageFromServer);
    socketRef.current.on("chat-message", (data, sender, socketIdSender) => {
      // ONLY add if it's from someone else (Optimistic UI handles the local side)
      if (socketIdSender !== socketIdRef.current) {
        setMessages((prev) => [...prev, { sender, data }]);
        if (!showModal) setNewMessage((p) => p + 1);
      }
    });
    socketRef.current.on("reaction", (id, emoji) => {
      showReaction(id, emoji);
    });

    socketRef.current.on("user-metadata", (id, name) => {
      setParticipants(prev => {
        if (!prev[id]) {
          setMessages(m => [...m, { sender: "System", data: `${name} joined the meeting` }]);
        }
        return { ...prev, [id]: name };
      });
    });

    socketRef.current.on("user-metadata-sync", (data) => {
      setParticipants(prev => ({ ...prev, ...data }));
    });

    socketRef.current.on("connect", () => {
      socketIdRef.current = socketRef.current.id;
      
      socketRef.current.emit("join-call", window.location.href);
      // Synchronize name
      socketRef.current.emit("user-metadata", username);

      socketRef.current.on("user-left", (id) => {
        setParticipants(prev => {
          const name = prev[id] || `User ${id.slice(0, 4)}`;
          setMessages(m => [...m, { sender: "System", data: `${name} left the meeting` }]);
          return prev;
        });
        if (connections[id]) { connections[id].close(); delete connections[id]; }
        if (peerStates[id]) delete peerStates[id];
        setVideos((prev) => prev.filter((v) => v.socketId !== id));
      });
      socketRef.current.on("user-joined", (id, clients) => {
        clients.forEach((sid) => {
          if (sid === socketIdRef.current) return;
          createPeerConnection(sid, sid < socketIdRef.current);
        });
      });

      socketRef.current.on("screen-sharing", (id, isSharing) => {
        if (isSharing) {
          setVideos((prev) => {
            const sharer = prev.find(v => v.socketId === id);
            if (sharer) setPrimarySpeaker(sharer);
            return prev;
          });
        } else {
          setPrimarySpeaker(null);
        }
      });
    });
  };

  const sendMessage = () => {
    if (message.trim()) {
      // Optimistic Update: Add to local state immediately
      setMessages((prev) => [...prev, { sender: username, data: message }]);
      // Emit to server
      socketRef.current.emit("chat-message", message, username);
      setMessage("");
    }
  };

  const connect = async () => {
    const fv = joinDisabledDevices ? false : videoAvailable;
    const fa = joinDisabledDevices ? false : audioAvailable;
    setVideo(fv); setAudio(fa); setAskForUsername(false);
    if (window.localStream) {
      window.localStream.getVideoTracks().forEach(t => t.enabled = fv);
      window.localStream.getAudioTracks().forEach(t => t.enabled = fa);
    }
    try { await addToUserHistory(window.location.pathname); } catch (e) {}
    connectToSocketServer();
  };

  const messagesEndRef = React.useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleVideo = () => {
    const s = !video; setVideo(s);
    if (window.localStream) window.localStream.getVideoTracks().forEach(t => t.enabled = s);
  };
  const handleAudio = () => {
    const s = !audio; setAudio(s);
    if (window.localStream) window.localStream.getAudioTracks().forEach(t => t.enabled = s);
  };

  const getUserMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: video, audio: audio });
      window.localStream = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      
      if (socketRef.current) socketRef.current.emit("screen-sharing", false);
      setPrimarySpeaker(null);
      
      Object.keys(connections).forEach((id) => {
        const pc = connections[id];
        const senders = pc.getSenders();
        stream.getTracks().forEach((track) => {
          const sender = senders.find((s) => s.track && s.track.kind === track.kind);
          if (sender) sender.replaceTrack(track);
          else pc.addTrack(track, stream);
        });
      });
    } catch (e) {
      console.log("getUserMedia error:", e);
    }
  };

  const getDisplayMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) { console.log(e); }
    window.localStream = stream;
    localVideoRef.current.srcObject = stream;

    if (socketRef.current) socketRef.current.emit("screen-sharing", true);
    setPrimarySpeaker({ socketId: 'local', stream: stream });

    Object.keys(connections).forEach((id) => {
      const pc = connections[id];
      const senders = pc.getSenders();
      stream.getTracks().forEach((track) => {
        const sender = senders.find((s) => s.track && s.track.kind === track.kind);
        if (sender) sender.replaceTrack(track);
        else pc.addTrack(track, stream);
      });
    });

    stream.getTracks().forEach((track) => (track.onended = () => {
      setScreen(false);
      getUserMedia();
    }));
  };

  const getDisplayMedia = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
        .then(getDisplayMediaSuccess)
        .catch((e) => console.log(e));
    }
  };

  useEffect(() => {
    if (screen) getDisplayMedia();
  }, [screen]);

  const handleScreen = () => {
    setScreen(!screen);
  };

  const handleEndCall = () => {
    try { window.localStream.getTracks().forEach(t => t.stop()); } catch (e) {}
    navigate("/history");
  };

  const mainSpeaker = React.useMemo(() => {
    return primarySpeaker || (videos.length > 0 ? videos[0] : { socketId: 'local', stream: window.localStream });
  }, [primarySpeaker, videos]);

  const otherVideos = React.useMemo(() => {
    return videos.filter(v => v.socketId !== mainSpeaker.socketId);
  }, [videos, mainSpeaker]);

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white font-['Outfit','Inter',sans-serif] overflow-hidden">
      {askForUsername ? (
        /* LOBBY VIEW */
        <div className="flex min-h-screen flex-col items-center justify-center relative px-6 overflow-hidden">
           {/* Background Blobs */}
           <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/5 blur-[120px] rounded-full -z-10 animate-pulse"></div>
           <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/5 blur-[120px] rounded-full -z-10 animate-pulse" style={{ animationDelay: '3s' }}></div>

           <div className="absolute top-0 left-0 p-8 flex items-center gap-3 group cursor-pointer" onClick={() => navigate("/")}>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-xl shadow-blue-600/30 group-hover:scale-110 transition-transform">
                <VideocamIcon className="text-white" fontSize="large" />
              </div>
              <span className="text-2xl font-black tracking-tighter text-white">Connectify</span>
           </div>
           
           <div className="z-10 w-full max-w-2xl text-center animate-fade-in">
              <h1 className="text-5xl font-extrabold tracking-tight mb-8">Ready to join?</h1>
              <div className="relative aspect-video rounded-[2.5rem] overflow-hidden border border-white/10 bg-black/60 shadow-2xl transition-all duration-500 ring-4 ring-white/5" style={{ opacity: joinDisabledDevices ? 0.4 : 1 }}>
                <video ref={localVideoRef} autoPlay muted playsInline className="h-full w-full object-cover scale-x-[-1]" />
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-5">
                   <button onClick={handleVideo} className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all shadow-xl ${video ? 'bg-white/10 border border-white/20 backdrop-blur-md hover:bg-white/20' : 'bg-red-500/80 border border-red-500 shadow-red-500/20'}`}>
                      {video ? <VideocamIcon /> : <VideocamOffIcon />}
                   </button>
                   <button onClick={handleAudio} className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all shadow-xl ${audio ? 'bg-white/10 border border-white/20 backdrop-blur-md hover:bg-white/20' : 'bg-red-500/80 border border-red-500 shadow-red-500/20'}`}>
                      {audio ? <MicIcon /> : <MicOffIcon />}
                   </button>
                </div>
              </div>

              <div className="mt-12 max-w-sm mx-auto space-y-8">
                <div className="text-left space-y-3">

                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Your Presence</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none text-gray-500 group-focus-within:text-blue-500 transition-colors">
                      <PersonIcon fontSize="small" />
                    </div>
                    <input 
                      className="block w-full rounded-2xl border-0 bg-white/5 py-5 pl-14 pr-4 text-white ring-1 ring-inset ring-white/10 placeholder:text-gray-600 focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-all outline-none text-lg"
                      placeholder="Enter your name"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <label className="flex items-center gap-4 cursor-pointer group select-none bg-white/5 p-4 rounded-2xl border border-white/5 transition hover:bg-white/10">
                    <input 
                      type="checkbox" 
                      className="h-6 w-6 rounded-lg border-white/10 bg-black/20 text-blue-600 focus:ring-blue-500 transition-all" 
                      checked={joinDisabledDevices}
                      onChange={(e) => setJoinDisabledDevices(e.target.checked)}
                    />
                    <span className="text-sm font-semibold text-gray-400 group-hover:text-white transition-colors">Safety: Start with hardware muted</span>

                  </label>

                  <button 
                    onClick={connect}
                    className="w-full rounded-2xl bg-blue-600 py-5 text-xl font-bold shadow-xl shadow-blue-600/30 hover:bg-blue-500 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    Enter Meeting Room
                  </button>
                </div>
              </div>
           </div>
        </div>
      ) : (
        /* MEETING VIEW */
        <div className="flex h-screen flex-col bg-[#0b0e14]">
          <div className="flex flex-1 overflow-hidden p-4 gap-4">
            {/* PREVIEW / LOGO BAR */}
            <div className="absolute top-8 left-8 z-50 flex items-center gap-3 group cursor-pointer bg-[#0b0e14]/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/5 hover:bg-[#0b0e14]/60 transition-all" onClick={() => {
               if(window.confirm("Leave meeting and return to landing page?")) {
                  handleEndCall();
                  navigate("/");
               }
            }}>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-lg shadow-blue-600/30 group-hover:scale-110 transition-transform">
                  <VideocamIcon className="text-white" sx={{ fontSize: 18 }} />
                </div>
                <span className="text-sm font-bold tracking-tight text-white">Connectify</span>
            </div>

            {/* MAIN SPEAKER BOX */}
            <div className="relative flex-1 rounded-3xl overflow-hidden bg-black/40 border border-white/5 group shadow-2xl">
                <video
                  ref={(el) => {
                    if (el && mainSpeaker.stream) el.srcObject = mainSpeaker.stream;
                    else if (el && mainSpeaker.socketId === 'local') el.srcObject = window.localStream;
                  }}
                  autoPlay
                  muted={mainSpeaker.socketId === 'local'}
                  playsInline
                  style={{ filter: mainSpeaker.socketId === 'local' ? getFilterStyle(videoEffect) : 'none' }}
                  className={`h-full w-full object-cover ${(mainSpeaker.socketId === 'local' && !screen) ? 'scale-x-[-1]' : ''}`}
                />
              <div className="absolute bottom-4 left-4 rounded-xl bg-[#0b0e14]/60 px-4 py-2 text-sm font-semibold backdrop-blur-md border border-white/5 flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${mainSpeaker.socketId === 'local' ? 'bg-blue-500' : 'bg-green-500'} animate-pulse`}></div>
                {mainSpeaker.socketId === 'local' ? `${username} (You)` : (participants[mainSpeaker.socketId] || `User ${mainSpeaker.socketId.slice(0, 4)}`)}
              </div>
            </div>

            {/* SIDEBAR PARTICIPANTS */}
            <div className="hidden lg:flex w-72 flex-col gap-4 overflow-y-auto no-scrollbar">
              {/* Local Video in Sidebar if not main speaker */}
              {mainSpeaker.socketId !== 'local' && (
                <div 
                  className="relative aspect-video rounded-2xl overflow-hidden cursor-pointer ring-2 ring-transparent transition hover:ring-blue-500/50"
                  onClick={() => setPrimarySpeaker({ socketId: 'local', stream: window.localStream })}
                >
                  <video ref={(el) => { if (el) el.srcObject = window.localStream; }} autoPlay muted playsInline className="h-full w-full object-cover scale-x-[-1]" />
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="absolute bottom-2 left-2 text-[10px] font-bold bg-black/40 px-2 py-1 rounded">You</div>
                </div>
              )}
              {videos.filter(v => v.socketId !== mainSpeaker.socketId).map(v => (
                <div 
                  key={v.socketId}
                  className="relative aspect-video rounded-2xl overflow-hidden cursor-pointer ring-2 ring-transparent transition hover:ring-blue-500/50"
                  onClick={() => setPrimarySpeaker(v)}
                >
                  <video ref={(el) => { if (el && v.stream) el.srcObject = v.stream; }} autoPlay playsInline className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="absolute bottom-2 left-2 text-[10px] font-bold bg-black/40 px-2 py-1 rounded">
                    {participants[v.socketId] || `User ${v.socketId.slice(0, 4)}`}
                  </div>
                </div>
              ))}
            </div>
            <ChatDrawer 
              show={showModal} 
              onClose={() => setShowModal(false)}
              messages={messages}
              setMessages={setMessages}
              username={username}
              socket={socketRef.current}
              messagesEndRef={messagesEndRef}
            />
          </div>

          {/* REACTION OVERLAY */}
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
             {activeReactions.map(r => (
                <div 
                  key={r.id}
                  className="absolute bottom-20 left-1/2 animate-bounce-up text-4xl"
                  style={{ left: `${45 + Math.random() * 10}%` }}
                >
                  {r.emoji}
                </div>
             ))}
          </div>

          {/* TOOLBAR */}
          <div className="z-10 bg-gradient-to-t from-[#0b0e14] via-[#0b0e14]/80 to-transparent pt-12 pb-8 relative">
            
            {/* EMOJI PICKER POPUP */}
            {showEmojiPicker && (
              <div className="absolute bottom-28 left-1/2 -translate-x-1/2 flex gap-5 p-5 rounded-[2rem] bg-[#0b0e14]/90 border border-white/10 backdrop-blur-3xl animate-fade-in shadow-2xl z-50 ring-1 ring-white/10">
                 {['💖', '👍', '🔥', '👏', '😂', '😮'].map(e => (
                   <button 
                    key={e}
                    onClick={() => { sendReaction(e); setShowEmojiPicker(false); }}
                    className="text-3xl hover:scale-125 transition-all active:scale-95 drop-shadow-lg"
                   >
                     {e}
                   </button>
                 ))}
              </div>
            )}

            {/* EFFECTS PICKER POPUP */}
            {showEffectsMenu && (
               <div className="absolute bottom-28 left-1/2 -translate-x-[70%] flex gap-4 p-4 rounded-[2rem] bg-[#0b0e14]/90 border border-white/10 backdrop-blur-3xl animate-fade-in shadow-2xl z-50 ring-1 ring-white/10">
                  {[
                    { id: 'none', icon: '🚫', label: 'None' },
                    { id: 'glow', icon: '✨', label: 'Glow' },
                    { id: 'sepia', icon: '📜', label: 'Sepia' },
                    { id: 'noir', icon: '🎬', label: 'Noir' },
                    { id: 'dream', icon: '☁️', label: 'Dream' }
                  ].map(eff => (
                    <button 
                      key={eff.id}
                      onClick={() => { setVideoEffect(eff.id); setShowEffectsMenu(false); }}
                      className={`flex flex-col items-center justify-center h-20 w-16 rounded-2xl transition-all ${videoEffect === eff.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                    >
                      <span className="text-2xl mb-1">{eff.icon}</span>
                      <span className="text-[10px] font-bold uppercase tracking-tighter">{eff.label}</span>
                    </button>
                  ))}
               </div>
            )}

            <div className="mx-auto flex w-fit items-center gap-4 rounded-full border border-white/10 bg-white/5 px-8 py-4 backdrop-blur-3xl shadow-3xl shadow-black/40 ring-1 ring-white/5">

               <button 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`h-11 w-11 rounded-full flex items-center justify-center transition-all ${showEmojiPicker ? 'text-blue-400 bg-blue-400/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`} 
                title="Reactions"
               >
                 <EmojiEmotionsIcon sx={{ fontSize: 24 }} />
               </button>
               <button 
                onClick={handleScreen}
                className={`h-11 w-11 rounded-full flex items-center justify-center transition-all ${screen ? 'text-blue-400 bg-blue-400/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`} 
                title="Screen Share"
               >
                 {screen ? <StopScreenShareIcon sx={{ fontSize: 24 }} /> : <ScreenShareIcon sx={{ fontSize: 24 }} />}
               </button>
               
               <div className="w-px h-8 bg-white/10 mx-2"></div>

               <div className="flex items-center gap-3">
                 <button 
                  onClick={handleAudio}
                  className={`h-12 flex items-center gap-1 rounded-2xl px-5 transition-all font-bold shadow-lg ${audio ? 'bg-white/10 text-white border border-white/10 hover:bg-white/20' : 'bg-red-500 text-white shadow-red-500/20'}`}
                 >
                   {audio ? <MicIcon /> : <MicOffIcon />}
                   <ArrowDropDownIcon fontSize="small" className="opacity-50" />
                 </button>
                 <button 
                  onClick={handleVideo}
                  className={`h-12 flex items-center gap-1 rounded-2xl px-5 transition-all font-bold shadow-lg ${video ? 'bg-white/10 text-white border border-white/10 hover:bg-white/20' : 'bg-red-500 text-white shadow-red-500/20'}`}
                 >
                   {video ? <VideocamIcon /> : <VideocamOffIcon />}
                   <ArrowDropDownIcon fontSize="small" className="opacity-50" />
                 </button>
               </div>

               <div className="w-px h-8 bg-white/10 mx-2"></div>

               <button 
                onClick={handleEndCall}
                className="h-16 w-16 rounded-full bg-red-600 flex items-center justify-center text-white shadow-2xl shadow-red-600/40 hover:bg-red-500 hover:scale-110 active:scale-90 transition-all duration-300"
               >
                 <CallEndIcon sx={{ fontSize: 32 }} />
               </button>

               <div className="w-px h-8 bg-white/10 mx-2"></div>

               <button 
                onClick={() => { setShowEffectsMenu(!showEffectsMenu); setShowEmojiPicker(false); }}
                className={`h-11 w-11 rounded-full flex items-center justify-center transition-all ${showEffectsMenu ? 'text-blue-400 bg-blue-400/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                title="Filters"
               >
                 <EffectsIcon sx={{ fontSize: 24 }} />
               </button>
               <button 
                onClick={() => { setShowParticipants(!showParticipants); setShowModal(false); }}
                className={`h-11 w-11 rounded-full flex items-center justify-center transition-all ${showParticipants ? 'text-blue-400 bg-blue-400/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`} 
                title="People"
               >
                 <Badge badgeContent={videos.length + 1} color="primary" sx={{ "& .MuiBadge-badge": { fontSize: '9px', height: '16px', minWidth: '16px', fontWeight: 'bold' } }}>
                    <ParticipantsIcon sx={{ fontSize: 24 }} />
                 </Badge>
               </button>
               <button 
                onClick={() => { setShowModal(!showModal); setShowParticipants(false); setNewMessage(0); }}
                className={`h-11 w-11 rounded-full flex items-center justify-center transition-all relative ${showModal ? 'text-blue-400 bg-blue-400/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
               >
                 <Badge badgeContent={newMessage} color="primary" sx={{ "& .MuiBadge-badge": { fontSize: '9px', height: '16px', minWidth: '16px', fontWeight: 'bold' } }}>
                    <ChatIcon sx={{ fontSize: 24 }} />
                 </Badge>
               </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .animate-fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes bounceUp {
          0% { transform: translateY(0) scale(0.5); opacity: 0; }
          20% { opacity: 1; transform: translateY(-20px) scale(1.2); }
          100% { transform: translateY(-300px) scale(0.8); opacity: 0; }
        }
        .animate-bounce-up { animation: bounceUp 3s ease-out forwards; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// MEMOIZED CHAT COMPONENT TO PREVENT RE-RENDERS ON TYPING
const ChatDrawer = React.memo(({ show, onClose, messages, setMessages, username, socket, messagesEndRef }) => {
  const [localMessage, setLocalMessage] = React.useState("");

  const handleSend = () => {
    if (localMessage.trim() && socket) {
      // Optimistic Update: Add to parent state immediately
      setMessages((prev) => [...prev, { sender: username, data: localMessage }]);
      // Emit to server
      socket.emit("chat-message", localMessage, username);
      setLocalMessage("");
    }
  };

  if (!show) return null;

  return (
    <div className="w-80 h-full flex-shrink-0 rounded-[2.5rem] bg-[#0b0e14]/90 border border-white/10 backdrop-blur-3xl flex flex-col shadow-3xl animate-fade-in overflow-hidden ring-1 ring-white/10">
       <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-3 font-bold text-gray-200">
            <ChatIcon fontSize="small" className="text-blue-500" />
            <span className="tracking-tight">Meeting Chat</span>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-xl flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 transition-all active:scale-90 font-bold italic">✕</button>
       </div>
       <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-20 select-none">
               <ChatIcon sx={{ fontSize: 64 }} className="mb-4" />
               <p className="text-sm font-bold uppercase tracking-widest">No Activity yet</p>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.sender === "System" ? 'items-center' : (m.sender === username ? 'items-end' : 'items-start')}`}>
                {m.sender !== "System" && (
                  <span className="text-[10px] font-bold text-gray-500 mb-2 mx-2 uppercase tracking-tighter">
                    {m.sender === username ? "You" : m.sender}
                  </span>
                )}
                <div className={`rounded-2xl px-5 py-3 text-sm max-w-[95%] break-words shadow-lg transition-all ${m.sender === "System" ? 'bg-white/5 text-blue-400 text-[11px] font-bold italic py-2 rounded-full border border-white/5' : (m.sender === username ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-600/20' : 'bg-white/5 text-gray-200 border border-white/10 rounded-tl-none')}`}>
                  {m.data}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
       </div>
       <div className="p-6 bg-black/20 border-t border-white/5">
          <div className="flex gap-3 items-center bg-white/5 rounded-2xl p-2 pr-3 ring-1 ring-white/10 focus-within:ring-2 focus-within:ring-blue-500 transition-all group">
            <input 
              className="flex-1 bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 font-medium" 
              placeholder="Send a whisper..." 
              value={localMessage}
              onChange={(e) => setLocalMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={handleSend}
              className="h-11 w-11 flex items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all hover:scale-110 active:scale-90"
            >
              <SendIcon fontSize="small" />
            </button>
          </div>
       </div>
    </div>
  );
});
