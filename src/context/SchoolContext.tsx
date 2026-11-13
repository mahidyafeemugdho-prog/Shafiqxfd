import React, { createContext, useContext, useState, useEffect } from 'react';
import { SchoolProfile } from '../types';
import { StorageService } from '../services/storage';

interface SchoolContextType {
  schoolProfile: SchoolProfile;
  updateSchoolProfile: (profile: SchoolProfile) => void;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(() => {
    return StorageService.getSchoolProfile();
  });

  // Sync document title with active institutional name
  useEffect(() => {
    if (schoolProfile?.nameEn) {
      document.title = `${schoolProfile.nameBn ? schoolProfile.nameBn + ' - ' : ''}${schoolProfile.nameEn} • AmarSchool ERP`;
    }
  }, [schoolProfile]);


  // Listen for storage / custom events to sync instantly across all views
  useEffect(() => {
    const handleProfileUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<any>;
      if (customEvent.detail && customEvent.detail.id && (customEvent.detail.nameEn || customEvent.detail.nameBn)) {
        setSchoolProfile(customEvent.detail);
      } else {
        setSchoolProfile(StorageService.getSchoolProfile());
      }
    };

    window.addEventListener('school_profile_updated', handleProfileUpdate);
    window.addEventListener('school_cloud_data_synced', handleProfileUpdate);
    window.addEventListener('storage', handleProfileUpdate);

    return () => {
      window.removeEventListener('school_profile_updated', handleProfileUpdate);
      window.removeEventListener('school_cloud_data_synced', handleProfileUpdate);
      window.removeEventListener('storage', handleProfileUpdate);
    };
  }, []);

  const updateSchoolProfile = (newProfile: SchoolProfile) => {
    StorageService.saveSchoolProfile(newProfile);
    setSchoolProfile(newProfile);
  };

  return (
    <SchoolContext.Provider value={{ schoolProfile, updateSchoolProfile }}>
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchool = (): SchoolContextType => {
  const context = useContext(SchoolContext);
  if (!context) {
    // Graceful fallback if used outside provider
    return {
      schoolProfile: StorageService.getSchoolProfile(),
      updateSchoolProfile: (p) => StorageService.saveSchoolProfile(p),
    };
  }
  return context;
};
