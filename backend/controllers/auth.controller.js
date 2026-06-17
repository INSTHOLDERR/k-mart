import { redis } from "../lib/redis.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


const generateTokens = (userId) => {
  const accessToken  = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET,  { expiresIn: "15m" });
  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d"  });
  return { accessToken, refreshToken };
};

const storeRefreshToken = async (userId, refreshToken) => {
  await redis.set(`refresh_token:${userId}`, refreshToken, "EX", 7 * 24 * 60 * 60);
};

const setCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge:   15 * 60 * 1000,
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge:   7 * 24 * 60 * 60 * 1000,
  });
};

const userPayload = (user) => ({
  _id:        user._id,
  name:       user.name,
  email:      user.email,
  role:       user.role,
  profilePic: user.profilePic,
  authProvider: user.authProvider,
});

export const signup = async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });
    await redis.set(
      `pending_signup:${email}`,
      JSON.stringify({ name, email, password }),
      "EX",
      5 * 60
    );

    res.status(200).json({ message: "Proceed to OTP verification" });
  } catch (error) {
    console.error("signup error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    if (user.authProvider === "google") {
      return res.status(400).json({ message: "This account uses Google sign-in. Please use Google login." });
    }

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(400).json({ message: "Invalid email or password" });


    await redis.set(`login_verified:${email}`, "1", "EX", 5 * 60);

    res.json({ message: "Credentials verified. Proceed to OTP." });
  } catch (error) {
    console.error("login error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const completeLogin = async (userId, res) => {
  const { accessToken, refreshToken } = generateTokens(userId);
  await storeRefreshToken(userId, refreshToken);
  setCookies(res, accessToken, refreshToken);
};


export const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ message: "Google credential required" });

    const ticket = await googleClient.verifyIdToken({
      idToken:  credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { sub: googleId, email, name, picture } = ticket.getPayload();

    let user = await User.findOne({ email });

    if (user) {

      if (user.authProvider === "local") {
        user.authProvider = "google";
        user.googleId     = googleId;
        if (!user.profilePic) user.profilePic = picture;
        await user.save();
      }
    } else {
      user = await User.create({
        name,
        email,
        profilePic:   picture,
        authProvider: "google",
        googleId,
        password:     null,
      });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);
    await storeRefreshToken(user._id, refreshToken);
    setCookies(res, accessToken, refreshToken);

    res.json(userPayload(user));
  } catch (error) {
    console.error("googleAuth error:", error.message);
    res.status(500).json({ message: "Google authentication failed" });
  }
};


export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      await redis.del(`refresh_token:${decoded.userId}`);
    }
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("logout error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ message: "No refresh token provided" });

    const decoded     = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const storedToken = await redis.get(`refresh_token:${decoded.userId}`);

    if (storedToken !== refreshToken) return res.status(401).json({ message: "Invalid refresh token" });

    const accessToken = jwt.sign({ userId: decoded.userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge:   15 * 60 * 1000,
    });

    res.json({ message: "Token refreshed successfully" });
  } catch (error) {
    console.error("refreshToken error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const getProfile = async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
