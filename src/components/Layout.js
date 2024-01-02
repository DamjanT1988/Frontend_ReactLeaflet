import React from 'react';
import './Layout.css'; // Importing CSS for layout
import Header from './template/Header'; // Importing Header component
import Footer from './template/Footer';
//import { Link } from 'react-router-dom'; // Importing Link component for navigation

const Layout = ({ children }) => {
  return (
    <div className="layout">
        <Header />
      <main>{children}</main>
        <Footer />
    </div>
  );
};

export default Layout;
