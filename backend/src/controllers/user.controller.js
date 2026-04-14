import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Meeting } from "../models/meeting.model.js";

// Helper to sign JWT
const signToken = (user) => {
  return jwt.sign(
    { userId: user._id, username: user.username },
    process.env.JWT_SECRET || "default_secret",
    { expiresIn: "7d" }
  );
};

// LOGIN CONTROLLER
const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(httpStatus.BAD_REQUEST).json({ message: "Username and Password are required" });
  }

  try {
    const user = await User.findOne({ username });
    if (!user || !user.password) {
      return res.status(httpStatus.NOT_FOUND).json({ message: "Invalid Username or Password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid Username or Password" });
    }

    const token = signToken(user);
    user.token = token; // Keep for legacy compatibility if needed
    await user.save();

    return res.status(httpStatus.OK).json({
      message: "Login successful",
      token: token,
      user: { name: user.name, username: user.username }
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Server error during login" });
  }
};

// REGISTER CONTROLLER
const register = async (req, res) => {
  const { name, username, password } = req.body;

  if (!name || !username || !password) {
    return res.status(httpStatus.BAD_REQUEST).json({ message: "All fields are required" });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(httpStatus.CONFLICT).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      username,
      password: hashedPassword,
    });

    await newUser.save();
    const token = signToken(newUser);
    
    return res.status(httpStatus.CREATED).json({
      message: "User registered successfully",
      token: token
    });
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Server error during registration" });
  }
};

const getUserHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
    }

    const meetings = await Meeting.find({ user_id: user.username });
    res.json(meetings);
  } catch (e) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong: ${e.message}` });
  }
};

const addToHistory = async (req, res) => {
  const { meetingCode } = req.body;

  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
    }

    const newMeeting = new Meeting({
      user_id: user.username,
      meetingCode: meetingCode,
      date: new Date(),
    });

    await newMeeting.save();
    res.json({ message: "Meeting saved successfully" });
  } catch (e) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong: ${e.message}` });
  }
};

const socialLoginSuccess = (req, res) => {
  if (req.user) {
    const token = signToken(req.user);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/home?token=${token}`);
  } else {
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/auth?error=auth_failed`);
  }
};

const mockSocialLogin = async (req, res) => {
  try {
    let user = await User.findOne({ username: "mockuser@connectify.com" });
    if (!user) {
      user = new User({
        name: "Mock User",
        username: "mockuser@connectify.com",
      });
      await user.save();
    }
    const token = signToken(user);
    res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}/home?token=${token}`);
  } catch (error) {
    console.error("Mock Auth Error:", error);
    res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}/auth?error=mock_failed`);
  }
};

const clearHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
    }

    await Meeting.deleteMany({ user_id: user.username });
    res.json({ message: "History cleared successfully" });
  } catch (e) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong: ${e.message}` });
  }
};

export { login, register, getUserHistory, addToHistory, clearHistory, socialLoginSuccess, mockSocialLogin };
