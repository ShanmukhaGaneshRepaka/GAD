// src/components/feedback/FeedbackResponses.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../../services/apiClient";
import "./FeedbackResponses.css";

const FeedbackResponses = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiClient
      .get(`/mentorfeedback/form/${formId}/responses`)
      .then((res) => {
        setResponses(res.data || []);
      })
      .catch((err) => {
        console.error("Error fetching responses:", err);
        setError("Failed to load responses.");
      })
      .finally(() => setLoading(false));
  }, [formId]);

  if (loading) return <p className="loading">Loading responses...</p>;
  if (error) return <p className="error">{error}</p>;
  if (responses.length === 0)
    return (
      <div className="no-responses">
        <p>No responses submitted yet for this form.</p>
        <button onClick={() => navigate("/feedback-dashboard")}>⬅ Back</button>
      </div>
    );

  return (
    <div className="responses-container">
      <h1 className="responses-title">📋 Feedback Responses</h1>
      <p className="form-info">
        Form ID: <strong>{formId}</strong> | Total Responses:{" "}
        <strong>{responses.length}</strong>
      </p>

      {responses.map((r) => (
        <div key={r.id} className="response-card">
          <div className="response-header">
            <span>
              <strong>Submitted on:</strong>{" "}
              {new Date(r.createdAt).toLocaleString()}
            </span>
          </div>
          <div className="answers">
            {Object.entries(r.answers || {}).map(([q, a]) => (
              <div key={q} className="answer-row">
                <strong>{q}</strong>
                <p>{String(a)}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      <button className="back-btn" onClick={() => navigate("/feedback-dashboard")}>
        ⬅ Back to Dashboard
      </button>
    </div>
  );
};

export default FeedbackResponses;
