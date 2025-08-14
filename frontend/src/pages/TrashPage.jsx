import React, { useContext, useEffect, useState } from 'react';
import { getTrash, deleteEmail } from '../api/emailApi';
import { AuthContext } from '../context/AuthContextInstance';

const TrashPage = ({ socket }) => {
  const { token, user } = useContext(AuthContext);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchTrash = async () => {
      try {
        setLoading(true);
        const data = await getTrash(token);
        setEmails(Array.isArray(data.emails) ? data.emails : []);
      } finally {
        setLoading(false);
      }
    };

    fetchTrash();

    if (socket) {
      socket.on("emailUpdated", (updatedUserId) => {
        if (updatedUserId === user._id) {
          fetchTrash();
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
    if (!window.confirm('Permanently delete this email?')) return;
    try {
      await deleteEmail(token, emailId);
    } catch (err) {
      alert(err.message);
    }
  };

  if (!token) return <p>Please login to see your trash.</p>;
  if (loading) return <p>Loading trash...</p>;

  return (
    <div>
      <h2>🗑 Trash</h2>
      {emails.length === 0 ? (
        <p>No emails in trash.</p>
      ) : (
        <ul>
          {emails.map(email => (
            <li key={email._id}>
              <strong>{email.subject}</strong> — {email.from}
              <p>{email.body}</p>
              <button onClick={() => handleDelete(email._id)}>Delete Permanently</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TrashPage;
