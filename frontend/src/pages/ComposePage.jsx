import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendEmail } from '../api/emailApi';
import { checkSpam } from '../api/spamApi';
import EmailForm from '../components/EmailForm';
import { AuthContext } from '../context/AuthContextInstance';
import './page/Compose.css';

const ComposePage = () => {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  const speak = (message) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // Cancel any ongoing speech
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (emailData) => {
    try {
      if (!token) {
        alert('You must be logged in to send emails.');
        return;
      }

      // Check for spam before sending
      const spamCheck = await checkSpam(token, emailData.body);
      if (spamCheck.isSpam) {
        const confirmSend = window.confirm(
          `Warning: This message appears to be spam (${Math.round(spamCheck.confidence * 100)}% confidence).\nAre you sure you want to send it?`
        );
        if (!confirmSend) return;
      }

      await sendEmail(token, emailData);
      speak(`Email sent to ${emailData.to}`); // Only announce recipient
      navigate('/inbox');
    } catch (err) {
      console.error('Error sending email:', err);
      alert(err.message || 'Failed to send email. Check recipient and try again.');
    }
  };

  return (
    <div className="compose-page">
      <h2>Compose New Email</h2>
      <EmailForm onSend={handleSend} />
    </div>
  );
};

export default ComposePage;