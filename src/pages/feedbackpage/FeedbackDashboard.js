// src/components/feedback/FeedbackDashboard.jsx
import React, { useEffect, useState } from "react";
import apiClient from "../../services/apiClient";
import { useNavigate } from "react-router-dom";
import "./FeedbackDashboard.css";

const FeedbackDashboard = () => {
  const [forms, setForms] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    apiClient
      .get(`/mentorfeedback/forms`)
      .then((res) => setForms(Array.isArray(res.data) ? res.data : []))
      .catch((err) => {
        console.error("Error loading forms", err);
        setForms([]);
      });
  }, []);

  const shareUrl = (id) => `${window.location.origin}/feedback/${id}`;

  return (
    <div className="feedback-dashboard">
      <h1 className="dashboard-title">Feedback Form Builder</h1>

      <div className="dashboard-actions">
        <button className="new-form-btn" onClick={() => navigate("/feedback-builder/new")}>
          ➕ Blank Form
        </button>
      </div>

      <h2 className="dashboard-subtitle">Your Forms</h2>

      <div className="forms-grid">
        {forms.length === 0 ? (
          <p className="no-forms">No forms created yet.</p>
        ) : (
          forms.map((f) => {
            const count = Array.isArray(f.fields) ? f.fields.length : 0;
            const title =
              (f.sessionTitle && f.sessionTitle.trim()) ||
              (count > 0 ? f.fields[0].label || "Untitled Form" : "Untitled Form");

            return (
              <div
                key={f.id}
                className="form-card"
                onClick={() => navigate(`/feedback-builder/edit/${f.id}`)}
                role="button"
              >
                <p><strong>Questions:</strong> {count}</p>
                <p className="muted"><strong>Form ID:</strong> {f.id}</p>
                <p className="muted small">Open: {shareUrl(f.id)}</p>

                <div className="card-actions">
    <button onClick={() => navigate(`/feedback-builder/edit/${f.id}`)}>✏ Edit</button>
   <button
      type="button"
      onClick={(e) => {
        e.stopPropagation(); // ← prevent parent onClick
        navigate(`/feedback-responses/${f.id}`);
      }}
    >
      📊 View Responses
    </button>
  </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default FeedbackDashboard;
