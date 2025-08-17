// src/controllers/spamController.js
import { checkSpam } from '../utils/spamClassifier.js';

export const checkSpamController = async (req, res) => {
  try {
    const { message } = req.body || {};
    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    try {
      // Run classification
      const result = await checkSpam(message); // { label, score }
      
      return res.json({
        label: result.label,
        confidence: result.score ?? 0.5 // use classifier score, fallback 0.5 if missing
      });
    } catch (err) {
      console.error('⚠️ Spam classification failed:', err);
      // fallback: treat unknown/error messages as 'ham' with low confidence
      return res.json({ label: 'ham', confidence: 0.3 });
    }
  } catch (e) {
    console.error('❌ checkSpamController error:', e);
    res.status(500).json({ error: 'Server error' });
  }
};
