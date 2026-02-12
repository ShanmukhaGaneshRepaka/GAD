import './JobDescriptionModel.css';
import { useState } from 'react';

const JobDescriptionModal = ({ onClose,onFinish }) => {

  const [text, setText] = useState("");

  const handleContinue = () => {
    // This calls the function we defined in ApplicantAtsResume
    onFinish(text); 
  };

  const handleSkip = () => {
    // This sends an empty string and still moves the user forward
    onFinish(""); 
  };
  return (

    <>
     <div className="jd-modal">
      <button className="jd-close" onClick={onClose}>✕</button>

      <h3 className="jd-title">Job Description</h3>
      <p className="jd-subtitle">
        Would you like to check the job description here?
      </p>

      <textarea
        className="jd-textarea"
        placeholder="Paste your job description here..."
        value={text}
  onChange={(e) => setText(e.target.value)}
      />

<div className="modal-buttons">
        <button onClick={handleSkip}>Skip & Continue</button>
        
        {/* Only show continue if there is text, or just leave it always on */}
        <button onClick={handleContinue} className="continue">
          Continue
        </button>
      </div>
      {/* <div className="jd-footer">
        <button className="jd-skip" onClick={onClose}>Skip</button>
      </div> */}
    </div>
    
    </>
   
  );
};

export default JobDescriptionModal;
