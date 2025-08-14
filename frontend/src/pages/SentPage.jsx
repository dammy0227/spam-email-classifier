import React, { useContext, useEffect, useState } from 'react';
import { getSent } from '../api/emailApi';
import { AuthContext } from '../context/AuthContextInstance';
import './page/SentPage.css'

const SentPage = () => {
  const { token } = useContext(AuthContext);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;

    const fetchSent = async () => {
      try {
        setLoading(true);
        const data = await getSent(token);
        setEmails(Array.isArray(data.emails) ? data.emails : []);
      } catch (err) {
        console.error('Failed to fetch sent emails:', err);
        setError(err.message || 'Failed to load sent emails.');
      } finally {
        setLoading(false);
      }
    };

    fetchSent();
  }, [token]);

  if (!token) return <p>Please login to see sent emails.</p>;
  if (loading) return <p>Loading sent emails...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div className='sent-page'>
      <h2>Sent Emails</h2>
      {emails.length === 0 ? (
        <p>No sent emails found.</p>
      ) : (
        <ul>
          {emails.map(email => (
            <li key={email._id} style={{ marginBottom: '1em' }}>
              <strong>To:</strong> {email.to || 'Unknown'} <br />
              <strong>Subject:</strong> {email.subject || '(No subject)'} <br />
              <strong>Message:</strong> {email.body || ''} <br />
              <hr />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SentPage;
