import { Router } from "express";
import { addToHistory, getUserHistory, clearHistory, login, register, socialLoginSuccess, mockSocialLogin } from "../controllers/user.controller.js";
import passport from "passport";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/login").post(login);
router.route("/register").post(register);
router.route("/add_to_activity").post(authMiddleware, addToHistory);
router.route("/get_all_activity").get(authMiddleware, getUserHistory);
router.route("/clear_activity").post(authMiddleware, clearHistory);

// SOCIAL AUTH ROUTES
if (process.env.MOCK_SOCIAL_AUTH === "true") {
  router.get("/auth/google", mockSocialLogin);
  router.get("/auth/github", mockSocialLogin);
  router.get("/auth/linkedin", mockSocialLogin);
} else {
  router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
  router.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/auth" }), socialLoginSuccess);

  router.get("/auth/github", passport.authenticate("github", { scope: ["user:email"] }));
  router.get("/auth/github/callback", passport.authenticate("github", { failureRedirect: "/auth" }), socialLoginSuccess);

  router.get("/auth/linkedin", passport.authenticate("linkedin", { state: 'some_random_state' }));
  router.get("/auth/linkedin/callback", passport.authenticate("linkedin", { failureRedirect: "/auth" }), socialLoginSuccess);
}

export default router;
