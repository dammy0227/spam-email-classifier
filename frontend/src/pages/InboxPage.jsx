// InboxPage.jsx
import React, { useContext, useEffect, useState } from 'react';
import { getInbox, moveToTrash, markRead } from '../api/emailApi';
import { checkSpam } from '../api/spamApi';
import { AuthContext } from '../context/AuthContextInstance';
import './page/InboxPage.css';

const InboxPage = () => {
  const { token } = useContext(AuthContext);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Function to speak an email
  const speakEmail = (email) => {
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(
      `New email from ${email.from}. Subject: ${email.subject || 'No subject'}. Body: ${email.body}`
    );
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (!token) return;

    const fetchInbox = async () => {
      try {
        setLoading(true);
        const data = await getInbox(token);
        const inboxEmails = Array.isArray(data.emails) ? data.emails : [];

        // Check spam for each email
        const checkedEmails = await Promise.all(
          inboxEmails.map(async (email) => {
            try {
              const spamInfo = await checkSpam(token, email.body);
              return { ...email, spamInfo };
            } catch {
              return { ...email, spamInfo: null };
            }
          })
        );

        setEmails(checkedEmails);

        // Automatically speak unread emails
        checkedEmails.forEach(email => {
          if (!email.isRead) {
            speakEmail(email);
          }
        });

      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to load inbox.');
      } finally {
        setLoading(false);
      }
    };

    fetchInbox();
  }, [token]);

  const handleMoveToTrash = async (emailId) => {
    if (!window.confirm('Move this email to trash?')) return;
    try {
      await moveToTrash(token, emailId);
      setEmails(prev => prev.filter(email => email._id !== emailId));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleMarkRead = async (emailId) => {
    try {
      await markRead(token, emailId);
      setEmails(prev =>
        prev.map(email =>
          email._id === emailId ? { ...email, isRead: true } : email
        )
      );
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to mark email as read.');
    }
  };

  if (!token) return <p>Please login to see your inbox.</p>;
  if (loading) return <p>Loading inbox...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div className="inbox-page">
      <h2>📬 Inbox</h2>
      {emails.length === 0 ? (
        <p>No emails found.</p>
      ) : (
        <ul>
          {emails.map(email => (
            <li key={email._id}>
              <strong style={{ fontWeight: email.isRead ? 'normal' : 'bold' }}>
                {email.subject || '(No subject)'}
              </strong> — {email.from || 'Unknown'}
              <p>{email.body}</p>

              {email.spamInfo && (
                <span className={`spam-badge ${email.spamInfo.label}`}>
                  {email.spamInfo.label.toUpperCase()} — Confidence: {(email.spamInfo.confidence * 100).toFixed(2)}%
                </span>
              )}

              <div className="email-actions">
                <button onClick={() => {
                  handleMarkRead(email._id);
                  speakEmail(email); // Speak email when marked as read
                }}>
                  {email.isRead ? 'Read' : 'Mark as Read & Speak'}
                </button>
                <button onClick={() => handleMoveToTrash(email._id)}>
                  Move to Trash
                </button>
                <button onClick={() => speakEmail(email)}>
                  🔊 Replay
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default InboxPage;
