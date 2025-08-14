import React, { useContext, useState } from 'react';
import { checkSpam } from '../api/spamApi';
import { AuthContext } from '../context/AuthContextInstance';
import './page/SpamPage.css'

const SpamPage = () => {
  const { token } = useContext(AuthContext);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);

  const handleCheck = async () => {
    if (!token) return alert('Please login to use the spam checker.');
    if (!message.trim()) return alert('Enter a message first!');

    try {
      const res = await checkSpam(token, message);
      setResult(res);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to check spam.');
    }
  };

  return (
    <div className="spam-page">
      <h2>Spam Checker</h2>
      <textarea
        placeholder="Paste message here..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        style={{ width: '100%', minHeight: '100px' }}
      />
      <button onClick={handleCheck} style={{ marginTop: '10px' }}>Check</button>

      {result && (
        <div className={`spam-result ${result.label}`} style={{ marginTop: '10px' }}>
          <p><strong>Label:</strong> {result.label}</p>
          <p><strong>Confidence:</strong> {(result.confidence * 100).toFixed(2)}%</p>
        </div>
      )}
    </div>
  );
};

export default SpamPage;
