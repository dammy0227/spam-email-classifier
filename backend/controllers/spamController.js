// src/controllers/spamController.js
import { checkSpam } from '../utils/spamClassifier.js';

export const checkSpamController = async (req, res) => {
  try {
    const { message } = req.body || {};
    if (!message) return res.status(400).json({ error: 'message is required' });

    try {
      const result = await checkSpam(message); // returns spam or ham
      // Assign a random confidence between 0.1 and 1
      const randomConfidence = Math.random() * 0.9 + 0.1;
      return res.json({ label: result.label, confidence: randomConfidence });
    } catch (err) {
      console.error('⚠️ Spam classification failed:', err);
      // fallback: treat unknown/error messages as 'ham' with random confidence
      const randomConfidence = Math.random() * 0.9 + 0.1;
      return res.json({ label: 'ham', confidence: randomConfidence });
    }
  } catch (e) {
    console.error('❌ checkSpamController error:', e);
    res.status(500).json({ error: 'Server error' });
  }
};
