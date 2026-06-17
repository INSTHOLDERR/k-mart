import { redis } from "../lib/redis.js";
import User from "../models/user.model.js";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";



const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const getTransporter = () =>
  nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

const OTP_TTL      = 3 * 60; 
const COOLDOWN_TTL = 60;     

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

const generateTokens = (userId) => ({
  accessToken:  jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET,  { expiresIn: "15m" }),
  refreshToken: jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d"  }),
});

const storeRefreshToken = async (userId, token) =>
  redis.set(`refresh_token:${userId}`, token, "EX", 7 * 24 * 60 * 60);

const sendEmail = async (to, subject, otp, purpose) => {
  const label = purpose === "reset" ? "Reset your password" : "Verify your email";
  const desc  = purpose === "reset" ? "reset your password" : "verify your email address";
  const html = `
    <div style="font-family:'Inter',Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f9fafb;border-radius:16px;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-block;width:40px;height:40px;background:#2563eb;border-radius:10px;line-height:40px;text-align:center;color:#fff;font-weight:900;font-size:20px;">K</div>
        <span style="font-weight:900;font-size:18px;color:#0d1117;vertical-align:middle;margin-left:8px;">K Mart</span>
      </div>
      <div style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:32px 24px;">
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0d1117;">${label}</h2>
        <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
          Use the OTP below to ${desc}. It expires in <strong>3 minutes</strong>.
        </p>
        <div style="text-align:center;margin:28px 0;">
          <span style="display:inline-block;letter-spacing:10px;font-size:36px;font-weight:900;color:#2563eb;background:#eff6ff;padding:16px 28px;border-radius:12px;">${otp}</span>
        </div>
        <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
      <p style="text-align:center;font-size:12px;color:#9ca3af;margin-top:20px;">© 2025 K Mart · Kerala's freshest grocery store</p>
    </div>`;
  await getTransporter().sendMail({ from: `"K Mart" <${process.env.EMAIL_USER}>`, to, subject, html });
};



export const sendOTP = async (req, res) => {
  try {
    const { email, purpose = "login" } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    if (purpose === "reset") {
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: "No account found with this email" });
    }

    if (purpose === "login") {
      const verified = await redis.get(`login_verified:${email}`);
      if (!verified) return res.status(400).json({ message: "Please enter your credentials first" });
    }

    if (purpose === "signup") {
      const pending = await redis.get(`pending_signup:${email}`);
      if (!pending) return res.status(400).json({ message: "Signup session expired. Please try again." });
    }


    const cooldownKey = `otp_cooldown:${purpose}:${email}`;
    const cooldown    = await redis.get(cooldownKey);
    if (cooldown) {
      const ttl = await redis.ttl(cooldownKey);
      return res.status(429).json({ message: `Please wait ${ttl}s before requesting a new OTP` });
    }

    const otp    = generateOTP();
    const otpKey = `otp:${purpose}:${email}`;
    await redis.set(otpKey, otp, "EX", OTP_TTL);
    await redis.set(cooldownKey, "1", "EX", COOLDOWN_TTL);

    const subject = purpose === "reset"
      ? "K Mart — Reset Your Password"
      : purpose === "signup"
        ? "K Mart — Verify Your Email"
        : "K Mart — Login Verification";

    await sendEmail(email, subject, otp, purpose);

    res.json({ message: "OTP sent successfully", expiresIn: OTP_TTL });
  } catch (error) {
    console.error("sendOTP error:", error.message);
    res.status(500).json({ message: "Failed to send OTP. Please check email configuration." });
  }
};



export const verifyOTP = async (req, res) => {
  try {
    const { email, otp, purpose = "login" } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

    const otpKey = `otp:${purpose}:${email}`;
    const stored = await redis.get(otpKey);

    if (!stored)                    return res.status(400).json({ message: "OTP expired. Please request a new one." });
    if (stored !== otp.toString())  return res.status(400).json({ message: "Invalid OTP. Please try again." });

    await redis.del(otpKey);

    
    if (purpose === "login") {
      await redis.del(`login_verified:${email}`);
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: "User not found" });

      const { accessToken, refreshToken } = generateTokens(user._id);
      await storeRefreshToken(user._id, refreshToken);
      setCookies(res, accessToken, refreshToken);

      return res.json({
        _id:          user._id,
        name:         user.name,
        email:        user.email,
        role:         user.role,
        profilePic:   user.profilePic,
        authProvider: user.authProvider,
      });
    }

    if (purpose === "signup") {
      const pendingRaw = await redis.get(`pending_signup:${email}`);
      if (!pendingRaw) return res.status(400).json({ message: "Signup session expired. Please start again." });

      const { name, password } = JSON.parse(pendingRaw);
      await redis.del(`pending_signup:${email}`);

      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ message: "User already exists" });

      const user = await User.create({ name, email, password, authProvider: "local" });
      const { accessToken, refreshToken } = generateTokens(user._id);
      await storeRefreshToken(user._id, refreshToken);
      setCookies(res, accessToken, refreshToken);

      return res.status(201).json({
        _id:          user._id,
        name:         user.name,
        email:        user.email,
        role:         user.role,
        profilePic:   user.profilePic,
        authProvider: user.authProvider,
      });
    }

  
    if (purpose === "reset") {
      const resetToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
      await redis.set(`reset_verified:${email}`, resetToken, "EX", 15 * 60);
      return res.json({ message: "OTP verified", resetToken });
    }

    res.json({ message: "OTP verified" });
  } catch (error) {
    console.error("verifyOTP error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};



export const resetPassword = async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;
    if (!email || !resetToken || !newPassword)
      return res.status(400).json({ message: "All fields are required" });
    if (newPassword.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters" });

    const storedToken = await redis.get(`reset_verified:${email}`);
    if (!storedToken || storedToken !== resetToken)
      return res.status(400).json({ message: "Reset session expired. Please start again." });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password     = newPassword;
    user.authProvider = "local";
    await user.save();

    await redis.del(`reset_verified:${email}`);
    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("resetPassword error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
