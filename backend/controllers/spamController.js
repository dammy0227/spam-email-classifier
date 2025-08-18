// src/controllers/spamController.js
import spamDetector from "../utils/spamClassifier.js";

export const checkSpamController = async (req, res) => {
  try {
    const { message } = req.body || {};
    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    const result = await spamDetector.detectSpam(message);
    
    return res.json({ 
      isSpam: result.label === 'spam',
      confidence: result.confidence,
      details: {
        methods: result.details,
        source: result.source
      }
    });
  } catch (e) {
    console.error("❌ checkSpamController error:", e);
    res.status(500).json({ 
      error: "Server error",
      fallback: true,
      isSpam: false
    });
  }
};