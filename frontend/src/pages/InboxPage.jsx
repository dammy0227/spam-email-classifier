import React, { useContext, useEffect, useState } from 'react';
import { getInbox, moveToTrash, markRead } from '../api/emailApi';
import { AuthContext } from '../context/AuthContextInstance';
import './page/InboxPage.css'

const InboxPage = () => {
  const { token } = useContext(AuthContext);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;

    const fetchInbox = async () => {
      try {
        setLoading(true);
        const data = await getInbox(token);
        setEmails(Array.isArray(data.emails) ? data.emails : []);
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
      console.error(err);
      alert(err.message || 'Failed to move email to trash.');
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
    <div>
      <h2>📬 Inbox</h2>
      {emails.length === 0 ? (
        <p>No emails found.</p>
      ) : (
        <ul>
          {emails.map(email => (
            <li key={email._id} style={{ marginBottom: '1em' }}>
              <strong style={{ fontWeight: email.isRead ? 'normal' : 'bold' }}>
                {email.subject || '(No subject)'}
              </strong> — {email.from || 'Unknown'}
              <p>{email.body}</p>
              <button onClick={() => handleMarkRead(email._id)}>
                {email.isRead ? 'Read' : 'Mark as Read'}
              </button>{' '}
              <button onClick={() => handleMoveToTrash(email._id)}>
                Move to Trash
              </button>
              <hr />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default InboxPage;
