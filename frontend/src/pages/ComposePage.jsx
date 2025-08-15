import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendEmail } from '../api/emailApi';
import EmailForm from '../components/EmailForm';
import { AuthContext } from '../context/AuthContextInstance';
import './page/Compose.css';

const ComposePage = () => {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  const speak = (message) => {
    if (!('speechSynthesis' in window)) return;
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

      await sendEmail(token, emailData);
      alert('Email sent successfully!');
      speak(`Email sent to ${emailData.to}`); // Voice alert
      navigate('/inbox'); // redirect to inbox after sending
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
