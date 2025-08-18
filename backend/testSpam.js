// test.js

import spamDetector from "./utils/spamClassifier.js";

// Define test messages (SPAM + HAM)
const messages = [
  // SPAM examples
  `🎉 Congratulations! You’ve won a brand new iPhone 15. Click here to claim: http://fake-free-iphone.com`,
  
  `URGENT: Your PayPal account has been locked. Verify now or it will be permanently suspended: http://phish-paypal.com`,
  
  `Dear Friend, I am a Nigerian Prince with $10,000,000 inheritance for you. Please send your bank details.`,
  
  `💰 Limited time offer! Get 90% OFF your subscription if you act within 12 hours!`,
  
  `Winner Alert 🚨! You have been selected to receive $5,000 cash prize. Claim before midnight.`,

  // HAM (legitimate) examples
  `Hey, are we still meeting for lunch tomorrow at 1pm? Let me know what works.`,
  
  `Reminder: Your dentist appointment is scheduled for Tuesday at 10:30am.`,
  
  `Team update: Please review the attached project plan before Thursday’s meeting.`,
  
  `Mom: Don’t forget to buy groceries on your way home.`,
  
  `Invoice #45678 has been generated. Please review and submit payment by the due date.`
];

// Run test
(async () => {
  console.log("🔎 Running batch spam detection...\n");
  for (let i = 0; i < messages.length; i++) {
    const result = await spamDetector.detectSpam(messages[i]);
    console.log(`📩 Message ${i + 1}:`);
    console.log(messages[i].slice(0, 80) + "..."); // preview first 80 chars
    console.log("➡️ Result:", result.label, " (confidence:", result.confidence.toFixed(2), ")");
    console.log("---------------------------------------------------\n");
  }
})();
