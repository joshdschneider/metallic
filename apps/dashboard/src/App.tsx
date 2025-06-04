import '@radix-ui/themes/styles.css';

import { Theme } from '@radix-ui/themes';
import { ThemeProvider } from 'next-themes';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { SyntaxSchemeProvider } from './components/code-block/pre';
import { ProtectedRoute } from './components/protected-route';
import { AcceptInvitePage } from './pages/accept-invite-page';
import APIKeysPage from './pages/api-keys-page';
import BillingPage from './pages/billing-page';
import ComputersPage from './pages/computers-page';
import { HomePage } from './pages/home-page';
import { NotFoundPage } from './pages/not-found-page';
import { ProfilePage } from './pages/profile-page';
import ProjectPage from './pages/project-page';
import { SignInPage } from './pages/sign-in-page';
import TeamPage from './pages/team-page';
import TemplatesPage from './pages/templates-page';
import { VerifyCodePage } from './pages/verify-code-page';
import { AuthProvider } from './providers/auth-provider';
import { OrganizationProvider } from './providers/organization-provider';
import { ProjectProvider } from './providers/project-provider';
import { ToastProvider } from './providers/toast-provider';

function App() {
  return (
    <ToastProvider>
      <ThemeProvider attribute="class" defaultTheme="dark">
        <Theme accentColor="blue" grayColor="sand">
          <BrowserRouter>
            <AuthProvider>
              <OrganizationProvider>
                <ProjectProvider>
                  <SyntaxSchemeProvider scheme="blue">
                    <Routes location={location} key={location.pathname}>
                      <Route path="/sign-in" element={<SignInPage />} />
                      <Route path="/verify-code" element={<VerifyCodePage />} />
                      <Route path="/accept-invite" element={<AcceptInvitePage />} />
                      <Route element={<ProtectedRoute />}>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/computers" element={<ComputersPage />} />
                        <Route path="/templates" element={<TemplatesPage />} />
                        <Route path="/api-keys" element={<APIKeysPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/project" element={<ProjectPage />} />
                        <Route path="/team" element={<TeamPage />} />
                        <Route path="/billing" element={<BillingPage />} />
                      </Route>
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </SyntaxSchemeProvider>
                </ProjectProvider>
              </OrganizationProvider>
            </AuthProvider>
          </BrowserRouter>
        </Theme>
      </ThemeProvider>
    </ToastProvider>
  );
}

export default App;
