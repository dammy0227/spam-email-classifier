import React, { useContext, useEffect, useState } from "react";
import { getTrash, deleteEmail } from "../api/emailApi";
import { AuthContext } from "../context/AuthContextInstance";
import "./page/TrashPage.css"; // keep your CSS import

const TrashPage = () => {
  const { token } = useContext(AuthContext);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    const fetchTrash = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getTrash(token);

        // ✅ if backend returns { emails: [...] }, handle it gracefully
        setEmails(Array.isArray(data?.emails) ? data.emails : data || []);
      } catch (err) {
        console.error("Failed to fetch trash emails:", err);
        setError(err.response?.data?.message || err.message || "Failed to load trash emails.");
      } finally {
        setLoading(false);
      }
    };

    fetchTrash();
  }, [token]);

  const handleDeleteEmail = async (emailId) => {
    if (!window.confirm("Are you sure you want to permanently delete this email?")) return;

    try {
      await deleteEmail(token, emailId);
      setEmails((prev) => prev.filter((email) => email._id !== emailId));
    } catch (err) {
      console.error("Failed to delete email:", err);
      alert(err.message || "Failed to delete email. Try again.");
    }
  };

  if (!token) return <p>Please login to see your trash.</p>;
  if (loading) return <p>Loading trash emails...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div className="trash-page">
      <h2>🗑️ Trash</h2>
      {emails.length === 0 ? (
        <p>No emails in trash.</p>
      ) : (
        <ul className="trash-list">
          {emails.map((email) => (
            <li key={email._id} className="trash-item">
              <strong>{email.subject || "(No subject)"}</strong>
              <span>From: {email.from || "Unknown"}</span>
              <p>{email.body}</p>
              <button onClick={() => handleDeleteEmail(email._id)}>Delete Permanently</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TrashPage;
