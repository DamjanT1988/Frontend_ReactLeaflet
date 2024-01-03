import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
//import Header from './components/template/Header'; // Assume you have a Header component
//import Footer from './components/template/Footer'; // Assume you have a Footer component
import RegistrationView from './views/RegistrationView';
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import NewsView from './views/NewsView';
import SettingsView from './views/SettingsView';
import ProjectView from './views/ProjectView';
import ReportView from './views/ReportView';
import DataView from './views/DataView';
// ... any other imports you might need

const App = () => {
  return (
    <Router>
      <Routes>
        {/* For paths that should not display header or footer */}
        <Route path="/register" element={<RegistrationView />} />
        <Route path="/login" element={<LoginView />} />

        {/* For paths that should display header and footer */}
        <Route
          path="*"
          element={
            <Layout>
              <Routes>
                <Route path="/dashboard" element={<DashboardView />} />
                <Route path="/news" element={<NewsView />} />
                <Route path="/settings" element={<SettingsView />} />
                <Route path="/project" element={<ProjectView />} />
                <Route path="/data" element={<DataView />} />
                <Route path="/report" element={<ReportView />} />
                {/* Default path or 404 Not Found View */}
                <Route path="/" element={<DashboardView />} />
                {/* Add other routes as needed */}
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
