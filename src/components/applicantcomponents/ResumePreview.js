import './ResumePreview.css';
import resumeBackButton from './resume-back-button.png';
import ATSUpdateComponent from './ATSUpdateComponent';
import { useNavigate } from 'react-router-dom';
import pdfUrl from './template1.png';
// import { useEffect } from "react";
import axios from "axios";
import { useResume } from './ResumeContext';
import { useEffect, useCallback, useState } from "react";
import { useUserContext } from "../common/UserProvider";

const ResumePreview = () => {
    const navigate = useNavigate();
    const { resumeState, updateResumeState } = useResume();
    const [showFullscreen, setShowFullscreen] = useState(false);
    const { user } = useUserContext();
const applicantId = user?.id;

    // const generatePdf = useCallback(async () => {

        
    //     try {
    //         if (!resumeState.templateId) return;

    //         const jwt = localStorage.getItem("jwtToken");

    //         const response = await axios.post(
    //             "http://localhost:8081/api/resume/download/resume",
    //             {
    //                 applicantId: applicantId,
    //                 resumeVersion: resumeState.templateId,
    //                 jd: resumeState.jobDescription,
    //                 profileData: resumeState.profileData
    //             },
    //             {
    //                 headers: { Authorization: `Bearer ${jwt}` },
    //                 responseType: "blob"
    //             }
    //         );

    //         const file = new Blob([response.data], { type: "application/pdf" });
    //         const url = URL.createObjectURL(file);

    //         updateResumeState("pdfUrl", url);

    //     } catch (error) {
    //         console.error("PDF generation failed:", error);
    //     }
    // }, [resumeState.templateId, resumeState.jobDescription, resumeState.profileData]);
const generatePdf = useCallback(async () => {
    try {
        if (!resumeState.templateId) return;

        const jwt = localStorage.getItem("jwtToken");

        const payload = {
            applicantId: localStorage.getItem("applicantId"),
            resumeVersion: resumeState.templateId,
            jd: resumeState.jobDescription,

            // resumeSummary: resumeState.profileData.resumeSummary,
            // personalDetails: resumeState.profileData.personalDetails,
            // educationDetails: resumeState.profileData.educationDetails,
            // projectDetails: resumeState.profileData.projectDetails,
            // keySkills: resumeState.profileData.keySkills
        };

        const response = await axios.post(
            "http://localhost:8081/api/resume/download/resume",
            payload,
            {
                headers: { Authorization: `Bearer ${jwt}` },
                responseType: "blob"
            }
        );

        const file = new Blob([response.data], { type: "application/pdf" });
        const url = URL.createObjectURL(file);

        updateResumeState("pdfUrl", url);

    } catch (error) {
        console.error("PDF generation failed:", error);
    }
}, [resumeState.templateId, resumeState.jobDescription, resumeState.profileData]);

    useEffect(() => {
        // if (!resumeState.pdfUrl) {
        //     generatePdf();
        // }
        console.log("Resume state in preview updated:", resumeState);
    },);

    console.log("PDF URL:", resumeState.pdfUrl);
    console.log("Template:", resumeState.templateId);
    console.log("Profile:", resumeState.profileData);

    const handleDownload = useCallback(() => {
        if (resumeState.pdfUrl) {
            const link = document.createElement('a');
            link.href = resumeState.pdfUrl;
            link.download = 'resume.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }, [resumeState.pdfUrl]);

    const handleFullscreenPreview = () => {
        setShowFullscreen(true);
    };

    const closeFullscreen = (e) => {
        // Close only when clicking on the overlay (outside the resume content)
        if (e.target.classList.contains('fullscreen-overlay')) {
            setShowFullscreen(false);
        }
    };
    useEffect(() => {
        console.log("Resume state updated:", resumeState);
    }, []);

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
                    <div className='left-side'>
                        <div className="resume-pdf">

                            <iframe
                                src={`${resumeState.pdfUrl}#toolbar=0`}
                                title="Resume Preview"
                                style={{ width: "100%", height: "100%", border: "none" }}
                            />


                        </div>
                        <div className="preview-buttons">
                            <button className="preview-btn" onClick={handleFullscreenPreview}>Preview</button>
                            <button className="download-btn" onClick={handleDownload}>Download</button>
                        </div>
                    </div>


                    <div className='right-side'>

                        <div className="resume-portfolio">
                            <ATSUpdateComponent />
                           
                        </div>
                      
                    </div>
                        


                </div>
              
                {showFullscreen && (
                    <div className="fullscreen-overlay" onClick={closeFullscreen}>
                        <div className="fullscreen-resume">
                            <iframe
                                src={`${resumeState.pdfUrl}#toolbar=0`}
                                title="Fullscreen Resume Preview"
                                style={{ width: "100%", height: "100%", border: "none" }}
                            />
                        </div>
                    </div>
                )}
            </div>


        </div>
    );
}
export default ResumePreview;