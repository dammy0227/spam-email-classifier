import React, { useContext, useEffect, useState, useRef } from 'react';
import { 
  getInbox, 
  moveToTrash, 
  markRead,
  markAsSpam,
  markAsNotSpam
} from '../api/emailApi';
import { AuthContext } from '../context/AuthContextInstance';
import './page/InboxPage.css';

const InboxPage = () => {
  const { token } = useContext(AuthContext);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const announcedEmails = useRef(new Set());

  const speakNotification = (from) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      `You received an email from ${from}`
    );
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  // ✅ Fetch inbox (trust backend spam classification)
  const fetchInbox = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError('');

      const inboxEmails = await getInbox(token);

      // Backend already provides spamLabel + spamConfidence
      setEmails(inboxEmails);

      // Find newest unread
      const newestUnread = inboxEmails
        .filter(email => !email.isRead && !announcedEmails.current.has(email._id))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

      if (newestUnread) {
        speakNotification(newestUnread.from);
        announcedEmails.current.add(newestUnread._id);
      }
    } catch (err) {
      console.error('Failed to fetch inbox:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load inbox');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInbox();
    return () => window.speechSynthesis.cancel();
  }, [token]);

  const handleSpamAction = async (emailId, markAsSpamFlag) => {
    try {
      if (markAsSpamFlag) {
        await markAsSpam(token, emailId);
      } else {
        await markAsNotSpam(token, emailId);
      }
      setEmails(prev => prev.filter(email => email._id !== emailId));
    } catch (err) {
      alert(err.message);
    }
  };

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

  const handleSpeakEmail = (email) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      `From ${email.from}. Subject: ${email.subject || 'No subject'}. ${email.body}`
    );
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  if (!token) return <p>Please login to see your inbox.</p>;
  if (loading) return <p>Loading inbox...</p>;

  return (
    <div className="inbox-page">
      <h2>📬 Inbox</h2>

      {error ? (
        <div className="error-message">
          <p style={{ color: 'red' }}>{error}</p>
          <button onClick={fetchInbox}>Retry</button>
        </div>
      ) : emails.length === 0 ? (
        <p>No emails found.</p>
      ) : (
        <ul className="email-list">
          {emails.map(email => (
            <li 
              key={email._id} 
              className={`email-item ${email.spamLabel === 'spam' ? 'spam' : ''}`}
            >
              <div className="email-header">
                <strong style={{ fontWeight: email.isRead ? 'normal' : 'bold' }}>
                  {email.subject || '(No subject)'}
                </strong>
                <span>From: {email.from}</span>
                {email.spamLabel && (
                  <span className="spam-tag">
                    {email.spamLabel.toUpperCase()}
                    {email.spamConfidence &&
                      ` (${Math.round(email.spamConfidence * 100)}%)`}
                  </span>
                )}
              </div>
              <div className="email-body">
                {email.body}
              </div>
              <div className="email-actions">
                <button onClick={() => handleMarkRead(email._id)}>
                  {email.isRead ? 'Read' : 'Mark as Read'}
                </button>
                {email.spamLabel === 'spam' ? (
                  <button onClick={() => handleSpamAction(email._id, false)}>
                    Not Spam
                  </button>
                ) : (
                  <button onClick={() => handleSpamAction(email._id, true)}>
                    Mark as Spam
                  </button>
                )}
                <button onClick={() => handleMoveToTrash(email._id)}>
                  Trash
                </button>
                <button onClick={() => handleSpeakEmail(email)}>
                  🔊 Speak
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
