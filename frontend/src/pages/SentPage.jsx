import React, { useContext, useEffect, useState } from "react";
import { getSent, deleteEmail } from "../api/emailApi";
import { AuthContext } from "../context/AuthContextInstance";
import "./page/SentPage.css";

const SentPage = () => {
  const { token } = useContext(AuthContext);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    const fetchSent = async () => {
      try {
        setLoading(true);
        setError("");
        const emails = await getSent(token); // ✅ already returns array
        setEmails(emails);
      } catch (err) {
        console.error("Failed to fetch sent emails:", err);
        setError(err.response?.data?.message || err.message || "Failed to load sent emails.");
      } finally {
        setLoading(false);
      }
    };

    fetchSent();
  }, [token]);

  const handleDeleteSent = async (emailId) => {
    if (!window.confirm("Remove this from Sent?")) return;
    try {
      await deleteEmail(token, emailId);
      setEmails((prev) => prev.filter((email) => email._id !== emailId));
    } catch (err) {
      alert(err.message);
    }
  };

  if (!token) return <p>Please login to see sent emails.</p>;
  if (loading) return <p>Loading sent emails...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div className="sent-page">
      <h2>📤 Sent Emails</h2>
      {emails.length === 0 ? (
        <p>No sent emails found.</p>
      ) : (
        <ul className="email-list">
          {emails.map((email) => (
            <li key={email._id} className="email-item">
              <div className="email-header">
                <strong>To:</strong> {email.to || "Unknown"}
              </div>
              <div className="email-subject">
                <strong>Subject:</strong> {email.subject || "(No subject)"}
              </div>
              <div className="email-body">
                <strong>Message:</strong> {email.body || ""}
              </div>
              <div className="email-actions">
                <button onClick={() => handleDeleteSent(email._id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SentPage;
