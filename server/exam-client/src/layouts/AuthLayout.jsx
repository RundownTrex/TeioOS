import React from 'react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { MainContentWrapper } from '../components/layout/MainContentWrapper';

export const AuthLayout = ({ children, onOpenAccessibility }) => {
  return (
    <div className="min-h-screen flex flex-col bg-canvas text-text-main">
      <Header
        title="TEIOOS EXAM SYSTEM"
        onOpenAccessibility={onOpenAccessibility}
      />

      <MainContentWrapper maxWidth="login" className="flex items-center justify-center py-8">
        <div className="w-full max-w-login space-y-6">
          {children}
        </div>
      </MainContentWrapper>

      <Footer statusText="Ready" />
    </div>
  );
};

export default AuthLayout;
