import React, { createContext, useContext, useState } from 'react';

const ResumeContext = createContext();

export const ResumeProvider = ({ children }) => {
  const [resumeState, setResumeState] = useState({
    profileData: {
      resumeSummary: null,
      personalDetails: null,
      educationDetails: [],
      projectDetails: [],
      keySkills: [],
    },
    jobDescription: "",
    templateId: null,
    pdfUrl: null
  });

  // Function to update any part of the state
  const updateResumeState = (key, value) => {
    setResumeState(prev => ({ ...prev, [key]: value }));
  };

  // Specific helper for full profile data updates
  const setProfileData = (data) => {
    setResumeState(prev => ({ ...prev, profileData: data }));
  };

  return (
    <ResumeContext.Provider value={{ resumeState, updateResumeState, setProfileData }}>
      {children}
    </ResumeContext.Provider>
  );
};

export const useResume = () => useContext(ResumeContext);