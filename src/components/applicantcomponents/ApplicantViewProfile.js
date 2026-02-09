import React from "react";
import { useUserContext } from "../common/UserProvider";
import ApplicantHeaderComponent from "./ApplicantHeaderComponent";
import ResumeSummaryCard from "./ResumeSummaryCard"; // ← add this
import PersonalDetailsCard from "./PersonalDetailsCard";
import EducationDetailsCard from "./EducationDetailsCard";
import ProjectDetailsCard from "./ProjectDetailsCard";
import KeySkillsCard from "./KeySkillsCard";
import SkillBadgesGrid from "./SkillBadgesGrid";
import "./modalpopup.css";
import "./Portfolio.css";
import ApplicantAtsResume from "./ApplicantAtsResume";
import { useState } from "react";
import { useEffect } from "react";
const ApplicantViewProfile = () => {
  const { user } = useUserContext();
  const applicantId = user?.id;
  // const EducationDetailsCard = ({ applicantId, onChange }) => { ... }


  // 🔥 CENTRAL AGGREGATED STATE
  const [profileData, setProfileData] = useState({
    resumeSummary: null,
    personalDetails: null,
    educationDetails: [],
    projectDetails: [],
    keySkills: [],
  });
  useEffect(() => {
    console.log("PROFILE DATA UPDATED:", profileData);
  }, [profileData]);



  return (
    <div className="border-style">
      <div className="blur-border-style"></div>
      <div className="dashboard__content">
        {/* Title */}
        <div className="row mr-0 ml-10 extraSpace">
          <div className="col-lg-12 col-md-12">
            <section className="page-title-dashboard">
              <div className="themes-container">
                <div className="row">
                  <div className="col-lg-12 col-md-12">
                    <div
                      className="title-dashboard"
                      style={{ margin: "0 0 -15px -40px" }}
                    >
                      <div className="title-dash flex2 common_style">
                        My portfolio
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
        {applicantId ? (
          <>
            <ApplicantHeaderComponent
              applicantId={applicantId}
              setProfileData={setProfileData}
            />
            <ResumeSummaryCard
              applicantId={applicantId}
              onChange={(data) =>
                setProfileData((prev) => ({
                  ...prev,
                  resumeSummary: data,
                }))
              }
            />
            <PersonalDetailsCard
              applicantId={applicantId}
              onChange={
                (data) =>
                  setProfileData((prev) => ({
                    ...prev,
                    personalDetails: data,
                  }))
              }
            />
            <EducationDetailsCard
              applicantId={applicantId}
              onChange={(data) =>
                setProfileData((prev) => ({
                  ...prev,
                  educationDetails: data,
                }))
              }
            />
            <ProjectDetailsCard
              applicantId={applicantId}
              onChange={(data) =>
                setProfileData((prev) => ({
                  ...prev,
                  projectDetails: data,
                }))
              }
            />
            <KeySkillsCard
              applicantId={applicantId}
              onChange={
                (data) =>
                  setProfileData((prev) => ({
                    ...prev,
                    keySkills: data,
                  }))
              }
            />
            <ApplicantAtsResume applicantId={applicantId} />
            {/* ===================== Skill Badges (NEW CARD) ===================== */}
            <div className="card-base soft-shadow">
              <div className="card-title-row">
                <h3 className="card-title common_style">Skill badges</h3>
              </div>
              <SkillBadgesGrid />
            </div>
            {/* =================== /Skill Badges (NEW CARD) =================== */}
          </>
        ) : (
          <div>Unable to identify applicant.</div>
        )}
      </div>
    </div>
  );
};

export default ApplicantViewProfile;
