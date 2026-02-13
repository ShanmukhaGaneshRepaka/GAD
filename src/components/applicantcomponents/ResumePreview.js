import './ResumePreview.css';
import resumeBackButton from './resume-back-button.png';
import ATSUpdateComponent from './ATSUpdateComponent';
import { useNavigate } from 'react-router-dom';
import pdfUrl from './template1.png';   
const ResumePreview = () => {

    const navigate = useNavigate();



    return (

        <div className="border-style">
            <div className="blur-border-style"></div>
            <div className="dashboard__content">


                <div className='header-section'>
                    <button className='back-button-templates'
                        onClick={() => navigate('/resume-templates')}>
                        <span className='back-button-to-templates'>
                            <img src={resumeBackButton} alt="Back" />
                        </span>
                    </button>
                    <span style={{ fontWeight: 600, fontSize: '22px' }}>Your resume preview</span>
                </div>

                <div className="resume-preview-wrapper">
                    <div className="resume-pdf">
                        {/* <ApplicantViewProfile/> */}
                        {/* <iframe
                            src="/sample-resume.pdf"
                            style={{ width: "100%", height: "100%" }}
                            title="Resume Preview"
                        /> */}
                        <img src={pdfUrl} alt="Resume Preview" />

                    </div>
                    <div className="resume-portfolio">
                        <ATSUpdateComponent />
                    </div>


                </div>
            </div>


        </div>
    );
}
export default ResumePreview;