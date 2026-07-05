import express from "express";
import { createServer } from "node:http";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import passport from "./config/passport.config.js";
import { connectToSocket } from "./controllers/socketManager.js";
import userRoutes from "./routes/users.routes.js";

dotenv.config();

const app = express();
const server = createServer(app);

connectToSocket(server);

app.set("port", process.env.PORT || 8000);

// Required when deployed on Render
app.set("trust proxy", 1);

// -------------------- CORS -------------------- //

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://connectifyfrontend-3gra.onrender.com",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));


// -------------------- Middleware -------------------- //

app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ extended: true, limit: "40kb" }));

// -------------------- Sessions -------------------- //

app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,

    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  }),
);

// -------------------- Passport -------------------- //

app.use(passport.initialize());
app.use(passport.session());

// -------------------- Routes -------------------- //

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Connectify Backend is running 🚀",
  });
});

app.use("/api/v1/users", userRoutes);

// -------------------- Database -------------------- //

const start = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing.");
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing.");
    }

    const connection = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MongoDB Connected: ${connection.connection.host}`);

    server.listen(app.get("port"), "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${app.get("port")}`);
    });
  } catch (err) {
    console.error("❌ Startup Error:");
    console.error(err.message);
    process.exit(1);
  }
};

start();
