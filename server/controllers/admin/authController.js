const User = require("../../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const JWT_KEY = process.env.JWT_KEY;
// const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

// Generate tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign({ userId: user._id, role: user.role }, JWT_KEY, {
    expiresIn: "30d",
  });

  // const refreshToken = jwt.sign(
  //     { userId: user._id },
  //     REFRESH_TOKEN_SECRET,
  //     { expiresIn: '30d' }
  // );

  return { accessToken };
};

const ADMIN_ACCESS_ROLES = ["admin", "staff", "technician"];

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!ADMIN_ACCESS_ROLES.includes(user.role)) {
      return res
        .status(403)
        .json({ error: "Access denied. Admin credentials required." });
    }

    const { accessToken } = generateTokens(user);

    res.json({
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ error: "Error logging in" });
  }
};

exports.logout = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Error logging out" });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ error: "Refresh token required" });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    // Generate new tokens
    const tokens = generateTokens(user);

    // Update refresh token in user document
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.json(tokens);
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(401).json({ error: "Invalid refresh token" });
  }
};
