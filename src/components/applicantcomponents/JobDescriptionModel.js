import './JobDescriptionModel.css';

const JobDescriptionModal = ({ onClose }) => {
  return (
    <div className="jd-modal">
      <button className="jd-close" onClick={onClose}>✕</button>

      <h3 className="jd-title">Job Description</h3>
      <p className="jd-subtitle">
        Would you like to check the job description here?
      </p>

      <textarea
        className="jd-textarea"
        placeholder="Enter job description"
      />

      <div className="jd-footer">
        <button className="jd-skip" onClick={onClose}>Skip</button>
      </div>
    </div>
  );
};

export default JobDescriptionModal;
