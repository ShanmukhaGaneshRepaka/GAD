import './ResumePreview.css';
import ApplicantViewProfile from './ApplicantViewProfile';
const ResumePreview = () => {




    return (

        <div className="border-style">
            <div className="blur-border-style"></div>
            <div className="dashboard__content">


 <div className='header-section'>
                     <button><span className='back-button-to-templates'>Back</span>    </button>  <span style={{fontWeight:600,fontSize:'16px'}}>Check your resume preview</span>
                    </div>

                <div className="resume-preview-wrapper">
                      <div className="resume-pdf">
                         {/* <ApplicantViewProfile/> */}
                      </div>
                      <div className="resume-portfolio">
                        <ApplicantViewProfile/>
                      </div>
                   

                </div>
            </div>


        </div>
    );
}
export default ResumePreview;