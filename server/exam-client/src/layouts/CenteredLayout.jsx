import React from 'react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { MainContentWrapper } from '../components/layout/MainContentWrapper';

export const CenteredLayout = ({ children, title = 'TEIOOS EXAM PLATFORM', onOpenAccessibility }) => {
  return (
    <div className="min-h-screen flex flex-col bg-canvas text-text-main">
      <Header title={title} onOpenAccessibility={onOpenAccessibility} />

      <MainContentWrapper maxWidth="reading" className="flex items-center justify-center py-8">
        <div className="w-full max-w-[540px]">
          {children}
        </div>
      </MainContentWrapper>

      <Footer statusText="Session Active" />
    </div>
  );
};

export default CenteredLayout;
