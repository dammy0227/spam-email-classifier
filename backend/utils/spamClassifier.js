import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// Initialize detection system
class SpamDetectionSystem {
  constructor() {
    this.HF_TOKEN = process.env.HF_API_TOKEN;
    this.HF_MODEL = "mrm8488/bert-tiny-finetuned-sms-spam-detection";
  }

  // ====================== Regex Detection ======================
  normalizeText(text) {
    const leetMap = {
      '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's',
      '7': 't', '9': 'g', '$': 's', '!': 'i', '@': 'a',
      'fr33': 'free', 'go0gle': 'google', 'paypa1': 'paypal',
      'c1ick': 'click', 'won': 'win', 'w0n': 'win',
      'pr1nce': 'prince', 'n1gerian': 'nigerian', '0ffer': 'offer'
    };

    let normalized = text.toLowerCase();
    for (const [key, value] of Object.entries(leetMap)) {
      normalized = normalized.replace(new RegExp(key, 'gi'), value);
    }
    normalized = normalized.replace(/\b(\d+)\b/g, match => {
      const numberWords = { '1000': 'thousand', '50': 'fifty', '1': 'one', '100': 'hundred', '1000000': 'million' };
      return numberWords[match] || match;
    });
    normalized = normalized.replace(/[.!?]{2,}/g, ' ');
    return normalized;
  }

  regexDetect(text) {
    const SPAM_PATTERNS = [
      { pattern: /(win(ners?|ning)|prize|reward|bonus)/i, weight: 0.95 },
      { pattern: /(\$|€|£|₹)\s*\d+/i, weight: 0.9 },
      { pattern: /(free|discount|offer|deal)\s*(entry|gift|money|trial|shipping)?/i, weight: 0.85 },
      { pattern: /(urgent|immediate|action required|quick|last chance)/i, weight: 0.9 },
      { pattern: /(limited time|offer expires|only today)/i, weight: 0.8 },
      { pattern: /(account (verif|susp|locked|limit)|security alert)/i, weight: 0.95 },
      { pattern: /(verify|confirm|update)\s*(your|my|account|details)/i, weight: 0.9 },
      { pattern: /(google|paypal|amazon|ebay|bank|apple)\s*(alert|notice|warning)/i, weight: 0.92 },
      { pattern: /(click|tap|press)\s*(here|below|link|button)/i, weight: 0.85 },
      { pattern: /http[s]?:\/\/[^\s]+|bit\.ly|goo\.gl|tinyurl/i, weight: 0.8 },
      { pattern: /(congratulations|you have been selected|exclusive offer)/i, weight: 0.8 },
      { pattern: /(claim your|don't miss|special for you)/i, weight: 0.75 },
      { pattern: /(nigeria|prince|royalty|inheritance)/i, weight: 0.95 },
      { pattern: /fr[3e]{2}/i, weight: 0.85 },
      { pattern: /you (won|have won)/i, weight: 0.9 },
      { pattern: /(million|thousand|hundred)\s*(dollars|pounds|euros)/i, weight: 0.85 },
      { pattern: /g[o0]{2}gle|paypa[l1]/i, weight: 0.85 },
      { pattern: /urgent/i, weight: 0.85 },
    ];

    let spamScore = 0;
    const matchedPatterns = [];

    SPAM_PATTERNS.forEach(({ pattern, weight }) => {
      if (pattern.test(text)) {
        spamScore += weight;
        matchedPatterns.push(pattern.source);
      }
    });

    if (matchedPatterns.length > 2) spamScore *= 1.3;

    return {
      label: spamScore >= 0.8 ? "spam" : "ham",
      confidence: Math.min(0.99, spamScore),
      matched: matchedPatterns.slice(0, 3)
    };
  }

  // ====================== Hugging Face API ======================
  async hfDetect(text) {
    if (!this.HF_TOKEN) return null;

    try {
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${this.HF_MODEL}`,
        { inputs: text },
        {
          headers: {
            Authorization: `Bearer ${this.HF_TOKEN}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );

      const results = Array.isArray(response.data) ? response.data[0] : response.data;
      const spam = results.find(r => r.label === "LABEL_1" || r.label === "spam");
      const ham = results.find(r => r.label === "LABEL_0" || r.label === "ham");

      if (!spam || !ham) return null;

      return {
        label: spam.score > ham.score ? "spam" : "ham",
        confidence: Math.max(spam.score, ham.score)
      };
    } catch (error) {
      console.warn(`⚠️ HF API error: ${error.message}`);
      return null;
    }
  }

  // ====================== Post Processing ======================
  applyPostProcessing(result, rawText) {
    const absoluteSpamPatterns = [
      /nigeria.*prince/i, /fr[3e]{2}.*offer/i, /you (won|have won)/i,
      /(million|thousand).*(dollar|pound|euro)/i, /account.*verif/i, /click.*here/i
    ];

    if (absoluteSpamPatterns.some(p => p.test(rawText))) {
      return { ...result, label: 'spam', confidence: Math.max(0.95, result.confidence), overridden: true };
    }
    return result;
  }

  // ====================== Unified Detection ======================
  async detectSpam(rawText) {
    // Step 1: Normalize text
    const text = this.normalizeText(rawText);

    // Step 2: Run both detectors
    const [regexResult, hfResult] = await Promise.all([
      this.regexDetect(text),
      this.hfDetect(text)
    ]);

    // Step 3: Calculate weighted scores
    const regexWeight = regexResult.label === "spam" ? Math.min(1.5, regexResult.confidence * 1.5) : 0;
    const hfWeight = hfResult?.label === "spam" ? hfResult.confidence * 0.8 : 0;

    // Step 4: Blend scores
    const blendedScore = (regexWeight * 0.7) + (hfWeight * 0.3);
    const threshold = 0.65;

    // Step 5: Create final result
    let finalResult = {
      label: blendedScore >= threshold ? "spam" : "ham",
      confidence: Math.max(regexResult.confidence, hfResult?.confidence || 0),
      source: `Hybrid (Regex=${regexWeight.toFixed(2)}, HF=${hfWeight.toFixed(2)})`,
      details: {
        regex: regexResult,
        huggingFace: hfResult
      }
    };

    // Step 6: Apply post-processing rules
    return this.applyPostProcessing(finalResult, rawText);
  }
}

// Create singleton instance
const spamDetector = new SpamDetectionSystem();
export default spamDetector;
