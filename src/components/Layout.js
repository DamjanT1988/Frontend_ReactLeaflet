import React from 'react';
import Header from './template/Header';
import Footer from './template/Footer';

const Layout = ({ children }) => {
  return (
    <div>
      <Header />
      {children}  {/* This is where your view content will be rendered */}
      <Footer />
    </div>
  );
};

export default Layout;
