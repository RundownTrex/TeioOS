import React from 'react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { MainContentWrapper } from '../components/layout/MainContentWrapper';

export const ErrorLayout = ({ children, title = 'TEIOOS SYSTEM RECOVERY' }) => {
  return (
    <div className="min-h-screen flex flex-col bg-canvas text-text-main">
      <Header title={title} />

      <MainContentWrapper maxWidth="reading" className="flex items-center justify-center py-10">
        <div className="w-full max-w-[500px]">
          {children}
        </div>
      </MainContentWrapper>

      <Footer statusText="System Recovery Mode" isConnected={false} />
    </div>
  );
};

export default ErrorLayout;
