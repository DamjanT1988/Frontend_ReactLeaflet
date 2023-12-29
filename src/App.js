import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import RegistrationView from './views/RegistrationView';
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import NewsView from './views/NewsView';
import SettingsView from './views/SettingsView';
import ProjectView from './views/ProjectView';
import ReportView from './views/ReportView';
// ... any other imports you might need

function App() {
  return (
    <Router>
      <Layout>
        <Routes> {/* Switch is replaced with Routes */}
          <Route path="/register" element={<RegistrationView />} />
          <Route path="/login" element={<LoginView />} />
          <Route path="/dashboard" element={<DashboardView />} />
          <Route path="/news" element={<NewsView />} />
          <Route path="/settings" element={<SettingsView />} />
          <Route path="/project" element={<ProjectView />} />
          <Route path="/report" element={<ReportView />} />
          {/* Default path or 404 Not Found View */}
          <Route path="/" element={<DashboardView />} />
          {/* Add other routes as needed */}
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
