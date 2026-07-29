import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { MainContentWrapper } from '../components/layout/MainContentWrapper';
import { useAuth } from '../hooks/useAuth';

export const DashboardLayout = ({ children, onOpenAccessibility }) => {
  const { userProfile } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-text-main">
      <Header
        title="TEIOOS EXAM PLATFORM"
        subtitle={userProfile?.roll_number ? `Candidate: ${userProfile.roll_number}` : undefined}
        onOpenAccessibility={onOpenAccessibility}
      />

      <MainContentWrapper maxWidth="dashboard">
        {children || <Outlet />}
      </MainContentWrapper>

      <Footer statusText="Session Active" />
    </div>
  );
};

export default DashboardLayout;
