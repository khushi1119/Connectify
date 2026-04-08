// user register and login

import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { Meeting } from "../models/meeting.model.js";

// LOGIN CONTROLLER
const login = async (req, res) => {
  const { username, password } = req.body;

  // validation
  if (!username || !password) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: "Username and Password are required" });
  }

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: "User not found" });
    }

    // compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ message: "Invalid Username or Password" });
    }

    // generate token
    const token = crypto.randomBytes(20).toString("hex");

    user.token = token;
    await user.save();

    return res.status(httpStatus.OK).json({
      message: "Login successful",
      token: token,
    });
  } catch (error) {
    console.error("Login Error:", error);

    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "Server error during login" });
  }
};

// REGISTER CONTROLLER
const register = async (req, res) => {
  const { name, username, password } = req.body;

  // validation
  if (!name || !username || !password) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: "All fields are required" });
  }

  try {
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res
        .status(httpStatus.CONFLICT)
        .json({ message: "User already exists" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      username,
      password: hashedPassword,
    });

    await newUser.save();

    return res.status(httpStatus.CREATED).json({
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("Register Error:", error);

    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "Server error during registration" });
  }
};

const getUserHistory = async (req, res) => {
  const { token } = req.query;

  try {
    const user = await User.findOne({ token: token });

    if (!user) {
      return res.json({ message: "User not found" });
    }

    const meetings = await Meeting.find({
      user_id: user.username,
    });

    res.json(meetings);
  } catch (e) {
    res.json({ message: `Something went wrong ${e}` });
  }
};
const addToHistory = async (req, res) => {
  const { token, meetingCode } = req.body;

  try {
    const user = await User.findOne({ token: token });

    if (!user) {
      return res.json({ message: "User not found" });
    }

    const newMeeting = new Meeting({
      user_id: user.username,
      meetingCode: meetingCode,
      date: new Date(),
    });

    await newMeeting.save();

   res.json({ message: "Meeting saved successfully" });
  } catch (e) {
    res.json({ message: `Something went wrong ${e}` });
  }
};

export { login, register, getUserHistory, addToHistory };
