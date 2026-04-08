import * as React from "react";
import {
  Box,
  TextField,
  Button,
  Paper,
  Avatar,
  Link,
  Snackbar,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Alert from "@mui/material/Alert";
import { AuthContext } from "../contents/AuthContext";
import { useNavigate } from "react-router-dom";
export default function Authentication() {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");

  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");

  const [formState, setFormState] = React.useState(0);
  const [open, setOpen] = React.useState(false);

  const { handleRegister, handleLogin } = React.useContext(AuthContext);
  const navigate = useNavigate();
  const handleClose = (event, reason) => {
    if (reason === "clickaway") return;

    setOpen(false);
    setError("");
    setMessage("");
  };

  const handleAuth = async () => {
    setError("");
    setMessage("");

    try {
      if (formState === 0) {
        const result = await handleLogin(username, password);
        setMessage(result?.message || "Login Successful");
        navigate("/home");
      } else {
        const result = await handleRegister(name, username, password);
        setMessage(result.message || result);
      }
      //reset the field
      setUsername("");
      setPassword("");
      setName("");

      // switch to login after register
      if (formState === 1) {
        setFormState(0);
      }

      setOpen(true);
    } catch (err) {
      const message = err?.response?.data?.message || "Something went wrong";
      setError(message);
      setOpen(true);
    }
  };
  return (
    <Box sx={{ display: "flex", height: "100vh", width: "100%" }}>
      {/* LEFT IMAGE */}

      <Box
        sx={{
          width: "65%",
          display: { xs: "none", sm: "block" },
        }}
      >
        <Box
          component="img"
          src="/login.png"
          alt="Login"
          sx={{
            width: "100%",
            height: "100vh",
            objectFit: "cover",
            display: "block",
          }}
        />
      </Box>

      {/* RIGHT FORM */}

      <Paper
        elevation={3}
        square
        sx={{
          width: { xs: "100%", sm: "35%" },
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          px: 4,
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 400 }}>
          {/* HEADER */}

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Avatar sx={{ bgcolor: "secondary.main", mb: 2 }}>
              <LockOutlinedIcon />
            </Avatar>

            <Box>
              <Button
                variant={formState === 0 ? "contained" : "outlined"}
                onClick={() => setFormState(0)}
              >
                Sign In
              </Button>

              <Button
                sx={{ ml: 1 }}
                variant={formState === 1 ? "contained" : "outlined"}
                onClick={() => setFormState(1)}
              >
                Sign Up
              </Button>
            </Box>
          </Box>

          {/* NAME FIELD */}

          {formState === 1 && (
            <TextField
              fullWidth
              label="Full Name"
              margin="normal"
              value={name}
              type="text"
              onChange={(e) => setName(e.target.value)}
            />
          )}

          {/* USERNAME */}

          <TextField
            fullWidth
            label="Username"
            margin="normal"
            value={username}
            type="text"
            onChange={(e) => setUsername(e.target.value)}
          />

          {/* PASSWORD */}

          <TextField
            fullWidth
            label="Password"
            margin="normal"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p style={{ color: "red", marginTop: "5px" }}>{error}</p>}
          {/* SUBMIT BUTTON */}

          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 2, mb: 2 }}
            onClick={handleAuth}
          >
            {formState === 0 ? "Login" : "Register"}
          </Button>

          {/* LINKS */}

          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Link href="#">Forgot password?</Link>
            <Link href="#">Sign up</Link>
          </Box>
        </Box>
      </Paper>

      {/* SNACKBAR */}

      <Snackbar open={open} autoHideDuration={4000} onClose={handleClose}>
        <Alert severity={error ? "error" : "success"}>{error || message}</Alert>
      </Snackbar>
    </Box>
  );
}
