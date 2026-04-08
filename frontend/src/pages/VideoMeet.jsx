import React, { useRef, useState, useEffect } from "react";
import { TextField, Button, IconButton, Badge } from "@mui/material";
import io from "socket.io-client";
import styles from "../styles/videoComponent.module.css";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";
import { useNavigate } from "react-router-dom";
import axios from "axios";
const server_url = "http://localhost:8000";

const peerConfigConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

let connections = {};
let peerStates = {};
const black = ({ width = 640, height = 480 } = {}) => {
  const canvas = Object.assign(document.createElement("canvas"), {
    width,
    height,
  });

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
  const socketRef = useRef();
  const socketIdRef = useRef();
  const localVideoRef = useRef();

  const [videoAvailable, setVideoAvailable] = useState(true);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const [video, setVideo] = useState(true);
  const [audio, setAudio] = useState(true);
  const [askForUsername, setAskForUsername] = useState(true);
  const [username, setUsername] = useState("");
  const [videos, setVideos] = useState([]);
  const [screenAvailable, setScreenAvailable] = useState(false);
  const [screen, setScreen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [newMessage, setNewMessage] = useState(0);

  const getPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      window.localStream = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setVideoAvailable(true);
      setAudioAvailable(true);
    } catch (err) {
      console.log("Media permission error:", err);
      setVideoAvailable(false);
      setAudioAvailable(false);
    }
  };

  useEffect(() => {
    getPermission();

    // detect screen share support
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      setScreenAvailable(true);
    }

    return () => {
      if (socketRef.current) socketRef.current.disconnect();

      Object.values(connections).forEach((pc) => pc.close());
      connections = {};
      peerStates = {};

      if (window.localStream) {
        window.localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const getUserMediaStream = async () => {
    try {
      if (window.localStream) {
        window.localStream.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      window.localStream = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      Object.keys(connections).forEach((id) => {
        const pc = connections[id];

        const senders = pc.getSenders();
        stream.getTracks().forEach((track) => {
          const alreadySending = senders.find(
            (sender) => sender.track && sender.track.kind === track.kind,
          );

          if (alreadySending) {
            alreadySending.replaceTrack(track);
          } else {
            pc.addTrack(track, stream);
          }
        });
      });
    } catch (e) {
      console.log("getUserMedia error:", e);
    }
  };
  const getUserMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video,
        audio: audio,
      });

      window.localStream = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      Object.keys(connections).forEach((id) => {
        const pc = connections[id];
        const senders = pc.getSenders();

        stream.getTracks().forEach((track) => {
          const sender = senders.find(
            (s) => s.track && s.track.kind === track.kind,
          );

          if (sender) sender.replaceTrack(track);
          else pc.addTrack(track, stream);
        });
      });
    } catch (e) {
      console.log("getUserMedia error:", e);
    }
  };

  useEffect(() => {
    if (!askForUsername && (videoAvailable || audioAvailable)) {
      getUserMediaStream();
    }
  }, [askForUsername]);

  const createPeerConnection = (socketListId, isPolite) => {
    if (connections[socketListId]) return connections[socketListId];

    const pc = new RTCPeerConnection(peerConfigConnections);

    peerStates[socketListId] = {
      makingOffer: false,
      ignoreOffer: false,
      polite: isPolite,
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit(
          "signal",
          socketListId,
          JSON.stringify({ ice: event.candidate }),
        );
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0];

      setVideos((prev) => {
        const exists = prev.find((v) => v.socketId === socketListId);
        if (exists) {
          return prev.map((v) =>
            v.socketId === socketListId ? { ...v, stream } : v,
          );
        }
        return [...prev, { socketId: socketListId, stream }];
      });
    };

    pc.onnegotiationneeded = async () => {
      try {
        peerStates[socketListId].makingOffer = true;
        await pc.setLocalDescription(await pc.createOffer());

        socketRef.current.emit(
          "signal",
          socketListId,
          JSON.stringify({ sdp: pc.localDescription }),
        );
      } catch (err) {
        console.log("Negotiation error:", err);
      } finally {
        peerStates[socketListId].makingOffer = false;
      }
    };

    if (window.localStream) {
      const senders = pc.getSenders();
      window.localStream.getTracks().forEach((track) => {
        const alreadySending = senders.find(
          (sender) => sender.track && sender.track.kind === track.kind,
        );
        if (!alreadySending) {
          pc.addTrack(track, window.localStream);
        }
      });
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

        const offerCollision =
          description.type === "offer" &&
          (state.makingOffer || pc.signalingState !== "stable");

        state.ignoreOffer = !state.polite && offerCollision;

        if (state.ignoreOffer) {
          return;
        }

        if (
          description.type === "answer" &&
          pc.signalingState !== "have-local-offer"
        ) {
          return;
        }

        await pc.setRemoteDescription(new RTCSessionDescription(description));

        if (description.type === "offer") {
          await pc.setLocalDescription(await pc.createAnswer());

          socketRef.current.emit(
            "signal",
            fromId,
            JSON.stringify({
              sdp: pc.localDescription,
            }),
          );
        }
      }

      if (signal.ice) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(signal.ice));
        } catch (e) {
          if (!state.ignoreOffer) {
            console.log("ICE candidate error:", e);
          }
        }
      }
    } catch (err) {
      console.log("Signal handling error:", err);
    }
  };

  let addMessage = (data, sender, socketIdSender) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: sender, data: data },
    ]);

    //increase notification count.
    if (socketIdSender !== socketIdRef.current && !showModal) {
      setNewMessage((prev) => prev + 1);
    }
  };

  const connectToSocketServer = () => {
    socketRef.current = io(server_url);

    socketRef.current.on("signal", gotMessageFromServer);

    //  CHAT MESSAGE LISTENER
    socketRef.current.on("chat-message", (data, sender, socketIdSender) => {
      addMessage(data, sender, socketIdSender);
    });

    socketRef.current.on("connect", () => {
      socketIdRef.current = socketRef.current.id;
      setMessages([]); // new user ke liye chat reset

      socketRef.current.emit("join-call", window.location.href);

      socketRef.current.on("user-left", (id) => {
        if (connections[id]) {
          connections[id].close();
          delete connections[id];
        }

        if (peerStates[id]) {
          delete peerStates[id];
        }

        setVideos((prev) => prev.filter((video) => video.socketId !== id));
      });

      socketRef.current.on("user-joined", (id, clients) => {
        clients.forEach((socketListId) => {
          if (socketListId === socketIdRef.current) return;

          const isPolite = socketListId < socketIdRef.current;
          createPeerConnection(socketListId, isPolite);
        });
      });
    });
  };

  let routeTo = useNavigate();

  const connect = async () => {
    setAskForUsername(false);
    setVideo(videoAvailable);
    setAudio(audioAvailable);

    await getUserMediaStream(); //start camera again
    //  SAVE MEETING HISTORY
    await axios.post("http://localhost:8000/api/v1/users/add_to_activity", {
      meetingCode: window.location.pathname,
      token: localStorage.getItem("token"),
    });

    connectToSocketServer();
  };

  let handleVideo = () => {
    const newVideoState = !video;
    setVideo(newVideoState);

    if (window.localStream) {
      window.localStream.getVideoTracks().forEach((track) => {
        track.enabled = newVideoState;
      });
    }
  };
  let handleAudio = () => {
    setAudio(!audio);
  };

  let getDisplayMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }
    window.localStream = stream;
    localVideoRef.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;
      connections[id].addStream(window.localStream);
      connections[id].createOffer().then((description) => {
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription }),
            );
          })
          .catch((e) => console.log(e));
      });
    }
    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setScreen(false);

          try {
            let tracks = localVideoRef.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log(e);
          }

          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()]);
          window.localStream = blackSilence();

          localVideoRef.current.srcObject = window.localStream;
          getUserMedia();
        }),
    );
  };

  let getDisplayMedia = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      navigator.mediaDevices
        .getDisplayMedia({ video: true, audio: true })
        .then((stream) => {
          getDisplayMediaSuccess(stream);
        })
        .catch((e) => console.log(e));
    }
  };

  useEffect(() => {
    if (screen === true) {
      getDisplayMedia();
    }
  }, [screen]);
  let handleScreen = () => {
    setScreen(!screen);
  };
  let sendMessage = () => {
    socketRef.current.emit("chat-message", message, username);
    setMessage("");
  };

  const toggleChat = () => {
    setShowModal(!showModal);
    setNewMessage(0);
  };

  let handleEndCall = () => {
    try {
      let tracks = localVideoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    } catch (e) {}
    routeTo("/home");
  };
  return (
    <div className="lobbyContainer">
      {askForUsername ? (
        <div className="lobbyBox">
          <h2>Enter into Lobby</h2>

          <div className="lobbyControls">
            <TextField
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <Button variant="contained" onClick={connect}>
              Connect
            </Button>
          </div>

          <div className="videoPreview">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="lobbyVideo"
              style={{ opacity: video ? 1 : 0.3 }}
            />
          </div>
        </div>
      ) : (
        <div className={styles.meetVideoContainer}>
          {showModal ? (
            <div className={styles.chatRoom}>
              <div className={styles.chatContainer}>
                <h1>Chat</h1>

                <div className={styles.chattingDisplay}>
                  {messages.length > 0 ? (
                    messages.map((item, index) => {
                      return (
                        <div style={{ marginBottom: "15px" }} key={index}>
                          <p style={{ fontWeight: "bold" }}>{item.sender}</p>
                          <p>{item.data}</p>
                        </div>
                      );
                    })
                  ) : (
                    <p>No messages Yet!</p>
                  )}
                </div>

                <div className={styles.chattingArea}>
                  <TextField
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    id="outlined-basic"
                    label="Enter Your Chat"
                    variant="outlined"
                  />
                  <Button variant="contained" onClick={sendMessage}>
                    Send
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <></>
          )}

          <div className={styles.buttonContainers}>
            <IconButton onClick={handleVideo} style={{ color: "white" }}>
              {video === true ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>
            <IconButton onClick={handleEndCall} style={{ color: "red" }}>
              <CallEndIcon />
            </IconButton>
            <IconButton onClick={handleAudio} style={{ color: "white" }}>
              {audio === true ? <MicIcon /> : <MicOffIcon />}
            </IconButton>
            {screenAvailable === true ? (
              <IconButton onClick={handleScreen} style={{ color: "white" }}>
                {screen === true ? (
                  <ScreenShareIcon />
                ) : (
                  <StopScreenShareIcon />
                )}
              </IconButton>
            ) : (
              <></>
            )}

            <Badge badgeContent={newMessage} max={999} color="secondary">
              <IconButton onClick={toggleChat} style={{ color: "white" }}>
                <ChatIcon />
              </IconButton>
            </Badge>
          </div>

          <video
            className={styles.meetUserVideo}
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            style={{ width: "400px" }}
          />
          <div className={styles.conferenceView}>
            {videos.map((video) => (
              <div key={video.socketId}>
                <video
                  autoPlay
                  playsInline
                  ref={(ref) => {
                    if (ref && video.stream) {
                      ref.srcObject = video.stream;
                    }
                  }}
                  style={{ width: "300px" }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
