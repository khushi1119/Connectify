import mongoose, { Schema } from "mongoose";
const userSchema = new Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String },
  token: { type: String },
  googleId: { type: String },
  githubId: { type: String },
  linkedinId: { type: String },
});
const User = mongoose.model("User", userSchema);
export { User };
