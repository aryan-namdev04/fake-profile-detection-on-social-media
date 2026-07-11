const express = require("express");
const cors = require("cors");
const path = require("path");
const { analyzeProfile } = require("./detector");
const mongoose = require("mongoose");
const User = require("./models/User");
const Analysis = require("./models/Analysis");
const bcrypt = require("bcrypt");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 3000;

const MONGO_URL = "mongodb://127.0.0.1:27017/fakeProfileDB";

main()
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
  // const newUser = new User({
  //     name: "Aryan",
  //     email: "aryan@gmail.com",
  //     username: "aryan123",
  //     password: "123456",
  // });

  // await newUser.save();

  // console.log("User Saved");
}

app.use(cors());
app.use(express.json());
app.use(session({
  secret: "fakeprofilesecret",
  resave: false,
  saveUninitialized: false,
}));
app.use(express.static(path.join(__dirname, "../public")));


function isLoggedIn(req, res, next) {

  if (req.session.userId) {

    return next();

  }

  return res.status(401).json({
    success: false,
    message: "Please login first",
  });

}

app.post("/api/signup", async (req, res) => {

  try {

    const { name, email, username, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      username,
      password: hashedPassword,
    });

    await user.save();
    req.session.userId = user._id;

    res.json({
      success: true,
      message: "Signup Successful",
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }

});


app.post("/api/login", async (req, res) => {

  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {

      return res.status(404).json({
        success: false,
        message: "User not found",
      });

    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {

      return res.status(401).json({
        success: false,
        message: "Invalid Password",
      });

    }
    req.session.userId = user._id;
    res.json({
      success: true,
      message: "Login Successful",
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }

});

app.get("/api/logout", (req, res) => {

  req.session.destroy((err) => {

    if (err) {

      return res.status(500).json({
        success: false,
        message: "Logout Failed",
      });

    }

    res.json({
      success: true,
      message: "Logout Successful",
    });

  });

});

app.get("/api/check-auth", (req, res) => {

    if (req.session.userId) {

        return res.json({
            authenticated: true,
        });

    }

    res.status(401).json({
        authenticated: false,
    });

});

app.get("/api/user", isLoggedIn, async (req, res) => {

    try {

        const user = await User.findById(req.session.userId);

        res.json({
            username: user.username,
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message,
        });

    }

});

// POST /api/analyze — analyze a profile
app.post("/api/analyze", isLoggedIn, async (req, res) => {
  const profile = req.body;

  if (!profile || !profile.username) {
    return res.status(400).json({ error: "Username is required." });
  }

  const result = analyzeProfile(profile);
  const analysis = new Analysis({

    userId: req.session.userId,

    username: profile.username,

    riskScore: result.riskScore,

    verdict: result.verdict,

  });

  await analysis.save();
  res.json(result);
});


app.get("/api/history", isLoggedIn, async (req, res) => {

    try {

        const history = await Analysis.find({
            userId: req.session.userId
        }).sort({ createdAt: -1 });

        res.json(history);

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message,
        });

    }

});

app.get("/api/dashboard", isLoggedIn, async (req, res) => {

    try {

        const totalAnalyses = await Analysis.countDocuments({
            userId: req.session.userId,
        });

        const genuineProfiles = await Analysis.countDocuments({
            userId: req.session.userId,
            verdict: "Likely Genuine",
        });

        const suspiciousProfiles = totalAnalyses - genuineProfiles;

        res.json({
            totalAnalyses,
            genuineProfiles,
            suspiciousProfiles,
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message,
        });

    }

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
