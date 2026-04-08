import React, { useContext, useState } from "react";
import withAuth from "./utils/withAuth";
import { useNavigate } from "react-router-dom";
import "./App.css";
import { IconButton, Button, TextField } from "@mui/material";
import RestoreIcon from "@mui/icons-material/Restore";
import { AuthContext } from "./contents/AuthContext";

function HomeComponent() {
  let navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");

  const { addToUserHistory } = useContext(AuthContext);
  let handleJoinVideoCall = async () => {
    await addToUserHistory(meetingCode);
    navigate(`/meeting/${meetingCode}`);
  };
  return (
    <>
      <div className="navBar">
        <div style={{ display: "flex", alignItems: "center" }}>
          <h2>Connectify</h2>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <IconButton
            onClick={() => {
              navigate("/history");
            }}
          >
            {" "}
            <RestoreIcon />
          </IconButton>
          <span style={{ fontSize: "16px", fontWidth: 500 }}>History</span>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/auth");
            }}
          >
            Logout
          </Button>
        </div>
      </div>

      <div className="meetContainer">
        <div className="leftPanel">
          <h2>
            Connect instantly with
            <br />
            high-quality video calls.
          </h2>
          <p style={{ color: "#6b7280", marginBottom: "20px" }}>
            Start or join a secure video meeting in seconds.
          </p>

          <div className="joinBox">
            <TextField
              onChange={(e) => setMeetingCode(e.target.value)}
              label="Meeting Code"
              variant="outlined"
            />

            <Button onClick={handleJoinVideoCall} variant="contained">
              Join
            </Button>
          </div>
        </div>

        <div className="rightPanel">
          <img src="/Callimage.png" alt="Video call" />
        </div>
      </div>
    </>
  );
}
export default withAuth(HomeComponent);
