import React, { useContext, useEffect, useState } from 'react';
import { getInbox, moveToTrash, markRead } from '../api/emailApi';
import { checkSpam } from '../api/spamApi';
import { AuthContext } from '../context/AuthContextInstance';
import './page/InboxPage.css';

const InboxPage = ({ socket }) => {
  const { token, user } = useContext(AuthContext);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [speechEnabled, setSpeechEnabled] = useState(false);

  const speak = (text) => {
    if (speechEnabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // stop any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const enableSpeech = () => {
    if ('speechSynthesis' in window) {
      // Simple test utterance to trigger browser permission
      const testUtterance = new SpeechSynthesisUtterance("Speech notifications enabled");
      window.speechSynthesis.speak(testUtterance);
      setSpeechEnabled(true);
    } else {
      alert("Speech synthesis not supported in your browser.");
    }
  };

  const fetchInbox = async () => {
    try {
      setLoading(true);
      const data = await getInbox(token);
      let inboxEmails = Array.isArray(data.emails) ? data.emails : [];

      // Run spam check for each email
      const checkedEmails = await Promise.all(
        inboxEmails.map(async (email) => {
          try {
            const res = await checkSpam(token, email.body);
            return { ...email, spamInfo: res };
          } catch {
            return { ...email, spamInfo: null };
          }
        })
      );

      setEmails(checkedEmails);
      return checkedEmails;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchInbox();

    if (socket) {
      socket.on("emailUpdated", async (updatedUserId) => {
        if (updatedUserId === user._id) {
          const updatedEmails = await fetchInbox();
          if (updatedEmails.length > 0) {
            const latest = updatedEmails[0];
            const preview = latest.body.split(/\s+/).slice(0, 15).join(" ");
            speak(`You have a new message from ${latest.from}. Subject: ${latest.subject}. ${preview}`);
          }
        }
      });
    }
    return () => {
      if (socket) {
        socket.off("emailUpdated");
      }
    };
  }, [token, socket, user._id, speechEnabled]);

  const handleMoveToTrash = async (emailId) => {
    if (!window.confirm('Move this email to trash?')) return;
    try {
      await moveToTrash(token, emailId);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleMarkRead = async (emailId) => {
    try {
      await markRead(token, emailId);
    } catch (err) {
      alert(err.message);
    }
  };

  if (!token) return <p>Please login to see your inbox.</p>;
  if (loading) return <p>Loading inbox...</p>;

  return (
    <div>
      <h2>📬 Inbox</h2>

      {!speechEnabled && (
        <button onClick={enableSpeech} style={{ marginBottom: '10px' }}>
          🔊 Enable Speech Notifications
        </button>
      )}

      {emails.length === 0 ? (
        <p>No emails found.</p>
      ) : (
        <ul>
          {emails.map(email => (
            <li
              key={email._id}
              style={{
                border: '1px solid #ccc',
                padding: '10px',
                marginBottom: '8px',
                backgroundColor: email.isRead ? '#f9f9f9' : '#fff'
              }}
            >
              <strong>{email.subject}</strong> — {email.from}
              <p>{email.body}</p>

              {email.spamInfo && (
                <div
                  style={{
                    backgroundColor: email.spamInfo.label === 'spam' ? '#a94442' : '#3c763d',
                    color: 'white',
                    padding: '5px',
                    borderRadius: '4px',
                    marginTop: '5px'
                  }}
                >
                  <strong>{email.spamInfo.label.toUpperCase()}</strong> — Confidence: {(email.spamInfo.confidence * 100).toFixed(2)}%
                </div>
              )}

              <div style={{ marginTop: '10px' }}>
                <button onClick={() => handleMarkRead(email._id)}>
                  {email.isRead ? 'Read' : 'Mark as Read'}
                </button>
                <button onClick={() => handleMoveToTrash(email._id)} style={{ marginLeft: '8px' }}>
                  Move to Trash
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
