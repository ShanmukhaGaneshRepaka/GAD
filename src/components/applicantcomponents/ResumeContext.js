import React, { createContext, useContext, useState } from 'react';

const ResumeContext = createContext();

export const ResumeProvider = ({ children }) => {
  const [resumeState, setResumeState] = useState({
    profileData: {
      resumeSummary: null,
      personalDetails: null,
      educationDetails: null, // null helps check if data exists at all
      projectDetails: [],
      keySkills: [],
    },
    jobDescription: "",
    templateId: null,
    pdfUrl: null
  });

  // Updates top-level items: updateResumeState('templateId', 5)
  const updateResumeState = (key, value) => {
    setResumeState(prev => ({ ...prev, [key]: value }));
  };

  // Updates profileData: setProfileData({ ...prev, keySkills: ['React'] })
  const setProfileData = (updater) => {
    setResumeState(prevState => ({
      ...prevState,
      profileData: typeof updater === "function" 
        ? updater(prevState.profileData) 
        : updater
    }));
  };

  return (
    <ResumeContext.Provider value={{ resumeState, updateResumeState, setProfileData }}>
      {children}
    </ResumeContext.Provider>
  );
};

export const useResume = () => useContext(ResumeContext);