import React, { useState } from 'react';
import '../styles/emailForm.css';

const EmailForm = ({ onSend, initialValues = {} }) => {
  const [to, setTo] = useState(initialValues.to || '');
  const [subject, setSubject] = useState(initialValues.subject || '');
  const [message, setMessage] = useState(initialValues.message || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Map 'message' to 'body' for backend
    onSend({ to, subject, body: message });
  };

  return (
    <form className="email-form" onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Recipient email"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        required
      />
      <textarea
        placeholder="Message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
      />
      <button type="submit">Send</button>
    </form>
  );
};

export default EmailForm;
