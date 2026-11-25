
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});


function createFallbackExplanation(result) {
  const flaggedSignals = result.checks
    .filter((check) => check.flagged)
    .map((check) => check.label);

  if (flaggedSignals.length === 0) {
    return `The profile has a risk score of ${result.riskScore}/100. No signals were flagged by the current rules. This does not prove that the account is genuine.`;
  }

  
return `The profile has a risk score of ${result.riskScore}/100 and is classified as "${result.verdict}". ${
  flaggedSignals.length > 0
    ? `The following signals were flagged: ${flaggedSignals.join(", ")}.`
    : "No signals were flagged by the current rules."
} ${
  result.riskScore < 40
    ? "Although some signals were flagged, the overall calculated risk is low."
    : result.riskScore < 70
      ? "The overall risk is moderate, so further review is recommended."
      : "The overall risk is high, so this profile should be reviewed carefully."
} These signals are indicators, not proof that the account is fake or genuine.`;

}



async function generateExplanation(result) {
  try {
    
const prompt = `
Explain this profile analysis in exactly 2 short sentences.

Risk score: ${result.riskScore}/100
Verdict: ${result.verdict}
Flagged signals: ${result.checks.filter(c => c.flagged).map(c => c.label).join(", ") || "None"}

Sentence 1: Explain the risk score and verdict.
Sentence 2: Explain that the signals are not proof of a fake account.

Return only these 2 sentences. Do not repeat the instructions.
`;


    
let response;

for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        maxOutputTokens: 1000,
      },
    });

    break;
  } catch (error) {
    console.error(`Gemini attempt ${attempt} failed:`, error.message);

    if (attempt === 3) {
      throw error;
    }

    await new Promise((resolve) =>
      setTimeout(resolve, attempt * 2000)
    );
  }
}

    const explanation = response.text;
    console.log("FULL AI EXPLANATION:", JSON.stringify(explanation));
    console.log("FINISH REASON:", response.candidates?.[0]?.finishReason);

    if (explanation && explanation.trim().length > 20) {
      return explanation.trim();
    }

    return createFallbackExplanation(result);
  } catch (error) {
    console.error("Gemini unavailable; using fallback:", error.message);
    return createFallbackExplanation(result);
  }
}


module.exports = { generateExplanation };
