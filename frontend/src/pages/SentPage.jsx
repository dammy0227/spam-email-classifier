import React, { useContext, useEffect, useState } from 'react';
import { getSent, deleteEmail } from '../api/emailApi';
import { AuthContext } from '../context/AuthContextInstance';

const SentPage = ({ socket }) => {
  const { token, user } = useContext(AuthContext);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchSent = async () => {
      try {
        setLoading(true);
        const data = await getSent(token);
        setEmails(Array.isArray(data.emails) ? data.emails : []);
      } finally {
        setLoading(false);
      }
    };

    fetchSent();

    if (socket) {
      socket.on("emailUpdated", (updatedUserId) => {
        if (updatedUserId === user._id) {
          fetchSent();
        }
      });
    }

    return () => {
      if (socket) {
        socket.off("emailUpdated");
      }
    };
  }, [token, socket, user._id]);

  const handleDelete = async (emailId) => {
    if (!window.confirm('Delete this email from sent items?')) return;
    try {
      await deleteEmail(token, emailId);
    } catch (err) {
      alert(err.message);
    }
  };

  if (!token) return <p>Please login to see your sent emails.</p>;
  if (loading) return <p>Loading sent emails...</p>;

  return (
    <div>
      <h2>📤 Sent</h2>
      {emails.length === 0 ? (
        <p>No sent emails found.</p>
      ) : (
        <ul>
          {emails.map(email => (
            <li key={email._id}>
              <strong>{email.subject}</strong> — To: {email.to}
              <p>{email.body}</p>
              <button onClick={() => handleDelete(email._id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SentPage;
