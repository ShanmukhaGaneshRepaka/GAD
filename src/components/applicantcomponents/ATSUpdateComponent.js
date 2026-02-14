import React from "react";
import { useUserContext } from "../common/UserProvider";
import ApplicantHeaderComponent from "./ApplicantHeaderComponent";
import ResumeSummaryCard from "./ResumeSummaryCard";
import PersonalDetailsCard from "./PersonalDetailsCard";
import EducationDetailsCard from "./EducationDetailsCard";
import ProjectDetailsCard from "./ProjectDetailsCard";
import KeySkillsCard from "./KeySkillsCard";
import SkillBadgesGrid from "./SkillBadgesGrid";

const ATSUpdateComponent = () => {   // ✅ ADD const here
    const { user } = useUserContext();
    const applicantId = user?.id;

    return (
        <>
             <ApplicantHeaderComponent applicantId={applicantId} />
            <ResumeSummaryCard applicantId={applicantId} />
            <PersonalDetailsCard applicantId={applicantId} />
            <EducationDetailsCard applicantId={applicantId} />
            <ProjectDetailsCard applicantId={applicantId} />
            <KeySkillsCard applicantId={applicantId} />
            <SkillBadgesGrid applicantId={applicantId} />
        </>
    );
};

export default ATSUpdateComponent;
