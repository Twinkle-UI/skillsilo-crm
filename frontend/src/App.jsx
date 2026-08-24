import { useState, useEffect } from "react";
import TopNav from "./components/TopNav";
import PurpleNav from "./components/PurpleNav";
import Footer from "./components/Footer";
import DashboardPage from "./pages/DashboardPage";
import LeadsPage from "./pages/LeadsPage";
import LeadDetailsPage from "./pages/LeadDetailsPage";
import FollowUpsPage from "./pages/FollowUpsPage";
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import { isAuthenticated, getUser, logout } from "./utils/auth";
import { PermissionsProvider } from "./contexts/PermissionsContext";
import { UniversityProvider } from "./contexts/UniversityContext";

export default function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");

  // Lead Details page ke liye
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [pendingEditLead, setPendingEditLead] = useState(null);

  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(isAuthenticated());
  const [user, setUser] = useState(getUser());

  // Unauthenticated page routing (login | forgot-password | reset-password)
  const [authPage, setAuthPage] = useState('login');

  // On mount: check if URL has reset token → go to reset page
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('token') && window.location.pathname.includes('reset-password')) {
      setAuthPage('reset-password');
    }
  }, []);

  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
    setUser(null);
    setCurrentPage("dashboard");
    setAuthPage('login');
  };

  // Unauthenticated routing
  if (!isLoggedIn) {
    if (authPage === 'forgot-password') {
      return <ForgotPasswordPage onBackToLogin={() => setAuthPage('login')} />;
    }
    if (authPage === 'reset-password') {
      return <ResetPasswordPage onBackToLogin={() => setAuthPage('login')} />;
    }
    return <LoginPage onForgotPassword={() => setAuthPage('forgot-password')} />;
  }

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setIsMobileMenuOpen(false);
    if (page !== "lead-details") {
      setSelectedLeadId(null);
    }
  };

  const handleViewLead = (lead) => {
    setSelectedLeadId(lead._id);
    setCurrentPage("lead-details");
  };

  const handleBackFromDetails = () => {
    setSelectedLeadId(null);
    setCurrentPage("leads");
  };

  const handleEditFromDetails = (lead) => {
    setPendingEditLead(lead);
    setSelectedLeadId(null);
    setCurrentPage("leads");
  };

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardPage />;
      case "leads":
        return (
          <LeadsPage
            onViewLead={handleViewLead}
            pendingEditLead={pendingEditLead}
            onPendingEditConsumed={() => setPendingEditLead(null)}
          />
        );
      case "lead-details":
        return (
          <LeadDetailsPage
            leadId={selectedLeadId}
            onBack={handleBackFromDetails}
            onEdit={handleEditFromDetails}
          />
        );
      case "followups":
        return <FollowUpsPage onViewLead={handleViewLead} />;
      case "settings":
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };
  return (
    <PermissionsProvider>
      <UniversityProvider>
        <TopNav
          onMenuToggle={() => setIsMobileMenuOpen((prev) => !prev)}
          user={user}
          onLogout={handleLogout}
          onSettingsClick={() => setCurrentPage("settings")}
        />
        <PurpleNav
          isMobileOpen={isMobileMenuOpen}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />

        {renderPage()}

        <Footer />
      </UniversityProvider>
    </PermissionsProvider>
  );
}
