import React from 'react';
import '../styles/emailList.css';

const EmailList = ({ emails, onSelect }) => {
  if (!emails.length) {
    return <p>No emails found.</p>;
  }

  return (
    <div className="email-list">
      {emails.map(email => (
        <div
          key={email._id}
          className={`email-item ${email.read ? 'read' : 'unread'}`}
          onClick={() => onSelect(email)}
        >
          <p className="email-subject">{email.subject}</p>
          <p className="email-sender">From: {email.sender}</p>
          <p className="email-date">{new Date(email.createdAt).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
};

export default EmailList;
