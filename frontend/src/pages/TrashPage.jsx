import React, { useContext, useEffect, useState } from 'react';
import { getTrash, deleteEmail } from '../api/emailApi';
import { AuthContext } from '../context/AuthContextInstance';
import './page/TrashPage.css'

const TrashPage = () => {
  const { token } = useContext(AuthContext);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;

    const fetchTrash = async () => {
      try {
        setLoading(true);
        const data = await getTrash(token);
        setEmails(Array.isArray(data.emails) ? data.emails : []);
      } catch (err) {
        console.error(err);
        setError('Failed to load trash emails.');
      } finally {
        setLoading(false);
      }
    };

    fetchTrash();
  }, [token]);

  const handleDeleteEmail = async (emailId) => {
    if (!window.confirm('Are you sure you want to delete this email permanently?')) return;

    try {
      await deleteEmail(token, emailId);
      setEmails(prev => prev.filter(email => email._id !== emailId));
    } catch (err) {
      console.error('Failed to delete email:', err);
      alert('Failed to delete email. Try again.');
    }
  };

  if (!token) return <p>Please login to see trash.</p>;
  if (loading) return <p>Loading trash emails...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div className='trash-page'>
      <h2>🗑️ Trash</h2>
      {emails.length === 0 ? (
        <p>No emails in trash.</p>
      ) : (
        <ul>
          {emails.map(email => (
            <li key={email._id} style={{ marginBottom: '1rem' }}>
              <strong>{email.subject || '(No subject)'}</strong> — {email.from || 'Unknown'}
              <p>{email.body}</p>
              <button
                style={{
                  marginLeft: '1rem',
                  color: 'white',
                  backgroundColor: 'red',
                  border: 'none',
                  padding: '0.2rem 0.5rem',
                  cursor: 'pointer'
                }}
                onClick={() => handleDeleteEmail(email._id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TrashPage;
