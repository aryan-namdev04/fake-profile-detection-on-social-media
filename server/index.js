const express = require("express");
const cors = require("cors");
const path = require("path");
const { analyzeProfile } = require("./detector");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// POST /api/analyze — analyze a profile
app.post("/api/analyze", (req, res) => {
  const profile = req.body;

  if (!profile || !profile.username) {
    return res.status(400).json({ error: "Username is required." });
  }

  const result = analyzeProfile(profile);
  res.json(result);
});

// GET /api/demo — returns a set of demo profiles for quick testing
app.get("/api/demo", (req, res) => {
  res.json([
    {
      label: "Suspicious Bot",
      username: "user8823749",
      accountAgeDays: 5,
      hasProfilePicture: false,
      followers: 12,
      following: 980,
      postCount: 1,
      bio: "",
      avgEngagement: 0.1,
      hasExternalLink: false,
    },
    {
      label: "Normal User",
      username: "jane_doe",
      accountAgeDays: 730,
      hasProfilePicture: true,
      followers: 540,
      following: 310,
      postCount: 87,
      bio: "Coffee lover. Traveler. Dog mom.",
      avgEngagement: 18.4,
      hasExternalLink: true,
    },
    {
      label: "Borderline Account",
      username: "promo_deals99",
      accountAgeDays: 45,
      hasProfilePicture: true,
      followers: 200,
      following: 1800,
      postCount: 12,
      bio: "Deals & offers",
      avgEngagement: 0.8,
      hasExternalLink: true,
    },
  ]);
});

app.listen(PORT, () => {
  console.log(`Fake Profile Detector running at http://localhost:${PORT}`);
});
