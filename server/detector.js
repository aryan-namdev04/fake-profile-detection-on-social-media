

function analyzeProfile(profile) {
  const checks = [];

  // 1. Account age
  const ageDays = profile.accountAgeDays || 0;
  checks.push({
    label: "Account Age",
    detail: `${ageDays} days old`,
    flagged: ageDays < 30,
    score: ageDays < 7 ? 90 : ageDays < 30 ? 60 : ageDays < 90 ? 20 : 0,
    weight: 2,
  });

  // 2. Profile picture
  checks.push({
    label: "Profile Picture",
    detail: profile.hasProfilePicture ? "Has profile picture" : "No profile picture",
    flagged: !profile.hasProfilePicture,
    score: !profile.hasProfilePicture ? 80 : 0,
    weight: 2,
  });

  // 3. Follower / following ratio
  const followers = profile.followers || 0;
  const following = profile.following || 0;
  const ratio = following > 0 ? followers / following : followers > 0 ? 10 : 0;
  const ratioFlagged = following > 500 && ratio < 0.1;
  checks.push({
    label: "Follower/Following Ratio",
    detail: `${followers} followers / ${following} following (ratio: ${ratio.toFixed(2)})`,
    flagged: ratioFlagged,
    score: ratioFlagged ? 75 : following > 1000 && ratio < 0.2 ? 40 : 0,
    weight: 3,
  });

  // 4. Post count
  const posts = profile.postCount || 0;
  checks.push({
    label: "Post Count",
    detail: `${posts} posts`,
    flagged: posts < 5,
    score: posts === 0 ? 85 : posts < 5 ? 55 : posts < 10 ? 20 : 0,
    weight: 2,
  });

  // 5. Bio completeness
  const bioLength = (profile.bio || "").trim().length;
  checks.push({
    label: "Bio Completeness",
    detail: bioLength === 0 ? "No bio" : `${bioLength} characters`,
    flagged: bioLength < 10,
    score: bioLength === 0 ? 70 : bioLength < 10 ? 40 : 0,
    weight: 1,
  });

  // 6. Username pattern (numbers/random chars)
  const username = profile.username || "";
  const numericRatio = (username.match(/\d/g) || []).length / (username.length || 1);
  const usernameFlagged = numericRatio > 0.4 || /[_]{2,}/.test(username);
  checks.push({
    label: "Username Pattern",
    detail: `"${username}" — ${(numericRatio * 100).toFixed(0)}% numeric`,
    flagged: usernameFlagged,
    score: numericRatio > 0.5 ? 65 : numericRatio > 0.4 ? 40 : 0,
    weight: 1,
  });

  // 7. Engagement rate (likes+comments per post)
  const engagement = profile.avgEngagement || 0;
  const engagementFlagged = followers > 1000 && engagement < 0.5;
  checks.push({
    label: "Engagement Rate",
    detail: `${engagement.toFixed(1)} avg interactions/post`,
    flagged: engagementFlagged,
    score: engagementFlagged ? 70 : followers > 500 && engagement < 1 ? 30 : 0,
    weight: 3,
  });

  // 8. External link
  checks.push({
    label: "External Link",
    detail: profile.hasExternalLink ? "Has external link" : "No external link",
    flagged: false, // neutral signal on its own
    score: 0,
    weight: 0,
  });

  // Weighted score
  const totalWeight = checks.reduce((s, c) => s + c.weight, 0);
  const weightedScore = checks.reduce((s, c) => s + c.score * c.weight, 0) / totalWeight;
  const riskScore = Math.min(100, Math.round(weightedScore));

  let verdict, verdictClass;
  if (riskScore >= 70) {
    verdict = "Likely Fake";
    verdictClass = "danger";
  } else if (riskScore >= 40) {
    verdict = "Suspicious";
    verdictClass = "warning";
  } else {
    verdict = "Likely Genuine";
    verdictClass = "success";
  }

  return { riskScore, verdict, verdictClass, checks };
}

module.exports = { analyzeProfile };
