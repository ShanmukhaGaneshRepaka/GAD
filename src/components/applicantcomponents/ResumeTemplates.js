import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import "../../../src/stylesheets/dashboard.css";
import template1 from "./template1.png";
import "./ResumeTemplates.css";
import ProcessingLoader from "./ProcessingLoader";
// import useResume from "./ResumeContext";
import { useResume } from "./ResumeContext";


const ResumeTemplates = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  // const { resumeState, setProfileData } = useResume();
  const { resumeState, updateResumeState } = useResume();

  const navigate = useNavigate();

  const handleGenerate = async (e) => {
    e.stopPropagation();

    if (!selectedTemplate) {
      alert("Please select a template");
      return;
    }

    try {
      // 🔥 open loader
      setIsOpen(true);

      const jwt = localStorage.getItem("jwtToken");

      // 🔥 actual API call
      const response = await axios.post(
        "http://localhost:8081/api/resume/download/resume",
        {
          applicantId: 17493,
          resumeVersion: selectedTemplate,
          jd: "Experienced Java developer with knowledge in Spring Boot, microservices, and REST APIs.",
        },
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
          responseType: "blob", // ⚠️ IMPORTANT for PDF
        }
      );

      // 👉 convert blob to URL
      const file = new Blob([response.data], { type: "application/pdf" });
      const fileURL = window.URL.createObjectURL(file);
      updateResumeState("pdfUrl", fileURL);
updateResumeState("templateId", selectedTemplate);


      // 👉 close loader
      setIsOpen(false);

      // 👉 navigate with pdf url
      navigate("/resume-preview", {
        state: { pdfUrl: fileURL },
       
      });

    } catch (error) {
      console.error("Generate resume failed:", error);

      setIsOpen(false);

      alert("Failed to generate resume. Please try again.");
    }
  };

  return (
    <div className="border-style">
      <div className="blur-border-style"></div>

      <div className="dashboard__content resume-template">
        <div className="resume-wrapper">
          <h2 className="title">AI Resume Template</h2>

          <div className="template-container">
            {[1, 2, 3, 4].map((id) => (
              <div
                key={id}
                className={`template-card ${
                  selectedTemplate === id ? "active" : ""
                }`}
                onClick={() => setSelectedTemplate(id)}
              >
                <img src={template1} alt={`template${id}`} />
                <p>Resume Template {id}</p>

                {selectedTemplate === id && (
                  <button onClick={handleGenerate}>
                    Generate Now
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 🔄 loader */}
      {isOpen && <ProcessingLoader isOpen={isOpen} />}
    </div>
  );
};

export default ResumeTemplates;
