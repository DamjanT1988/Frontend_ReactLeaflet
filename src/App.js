import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
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
        <Switch>
          <Route path="/register" component={RegistrationView} />
          <Route path="/login" component={LoginView} />
          <Route path="/dashboard" component={DashboardView} />
          <Route path="/news" component={NewsView} />
          <Route path="/settings" component={SettingsView} />
          <Route path="/project" component={ProjectView} />
          <Route path="/report" component={ReportView} />
          {/* Default path or 404 Not Found View */}
          <Route path="/" exact component={DashboardView} />
          {/* Add other routes as needed */}
        </Switch>
      </Layout>
    </Router>
  );
}

export default App;
