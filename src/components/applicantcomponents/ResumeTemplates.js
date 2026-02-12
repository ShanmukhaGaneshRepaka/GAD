import React from 'react';
import "../../../src/stylesheets/dashboard.css";
import  template1 from './template1.png';
import './ResumeTemplates.css';
import { useState } from 'react';
import ProcessingLoader from './ProcessingLoader';

const ResumeTemplates = () => {

    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const[isOpen, setIsOpen] = useState(false);

    const handleGenerate = (e) => {
      e.stopPropagation();
        setIsOpen(true);
    }

 return(

  <div className="border-style">
      <div className="blur-border-style"></div>
      <div className="dashboard__content">




          <div className="resume-wrapper">
      <h2 className="title">AI Resume Template</h2>

      <div className="template-container">
        {[1, 2, 3, 4,5,6,7,8].map((id) => (
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
              <button onClick={handleGenerate }>Generate Now</button>
            )}
          </div>
        ))}
      </div>
    </div>
      </div>

      {isOpen && <ProcessingLoader isOpen={isOpen} />}
      </div>
 );
};

export default ResumeTemplates;