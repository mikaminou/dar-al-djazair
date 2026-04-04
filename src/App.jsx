import React, { Suspense } from 'react';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import PostProject from './pages/PostProject';
import ClientManagement from './pages/ClientManagement';
import MyWaitlists from './pages/MyWaitlists';
import UpgradeTier from './pages/UpgradeTier';
import MyProjects from './pages/MyProjects';
import { ThemeProvider } from '@/lib/ThemeContext';
import { motion } from 'framer-motion';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { TabNavigationProvider } from '@/components/TabNavigationContext';
import PushNotificationManager from '@/components/PushNotificationManager';
import PushAlertManager from '@/components/PushAlertManager';
import AuthGuard from '@/components/AuthGuard';
import { Navigate } from 'react-router-dom';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

// Lazy load all page components for code splitting
const LazyPages = Object.entries(Pages).reduce((acc, [key, Component]) => {
  acc[key] = React.lazy(() => Promise.resolve({ default: Component }));
  return acc;
}, {});

const LazyMainPage = React.lazy(() => Promise.resolve({ default: MainPage }));

const PageLoadingFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const PageTransition = ({ children }) => {
  const location = useLocation();
  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <>
      <PushNotificationManager />
      <PushAlertManager />
      <Routes>
        <Route path="/" element={
          <PageTransition>
            <LayoutWrapper currentPageName={mainPageKey}>
              <Suspense fallback={<PageLoadingFallback />}>
                <LazyMainPage />
              </Suspense>
            </LayoutWrapper>
          </PageTransition>
        } />
        {Object.entries(LazyPages).map(([path, LazyPage]) => {
          // Pages that are publicly accessible without login
          const publicPages = ['Home', 'Listings', 'ListingDetail', 'AgentAvailability', 'Compare', 'Profile'];
          const isPublic = publicPages.includes(path);
          return (
            <Route
              key={path}
              path={`/${path}`}
              element={
                <PageTransition>
                  <LayoutWrapper currentPageName={path}>
                    <Suspense fallback={<PageLoadingFallback />}>
                      {isPublic ? <LazyPage /> : (
                        <AuthGuard>
                          <LazyPage />
                        </AuthGuard>
                      )}
                    </Suspense>
                  </LayoutWrapper>
                </PageTransition>
              }
            />
          );
        })}
        <Route path="/Projects" element={<PageTransition><LayoutWrapper currentPageName="Projects"><Suspense fallback={<PageLoadingFallback />}><Projects /></Suspense></LayoutWrapper></PageTransition>} />
        <Route path="/ProjectDetail" element={<PageTransition><LayoutWrapper currentPageName="ProjectDetail"><Suspense fallback={<PageLoadingFallback />}><ProjectDetail /></Suspense></LayoutWrapper></PageTransition>} />
        <Route path="/PostProject" element={<PageTransition><LayoutWrapper currentPageName="PostProject"><Suspense fallback={<PageLoadingFallback />}><PostProject /></Suspense></LayoutWrapper></PageTransition>} />
        <Route path="/ClientManagement" element={<PageTransition><LayoutWrapper currentPageName="ClientManagement"><Suspense fallback={<PageLoadingFallback />}><ClientManagement /></Suspense></LayoutWrapper></PageTransition>} />
        <Route path="/MyProjects" element={<PageTransition><LayoutWrapper currentPageName="MyProjects"><Suspense fallback={<PageLoadingFallback />}><MyProjects /></Suspense></LayoutWrapper></PageTransition>} />
        <Route path="/MyWaitlists" element={<PageTransition><LayoutWrapper currentPageName="MyWaitlists"><Suspense fallback={<PageLoadingFallback />}><MyWaitlists /></Suspense></LayoutWrapper></PageTransition>} />
        <Route path="/UpgradeTier" element={<PageTransition><LayoutWrapper currentPageName="UpgradeTier"><Suspense fallback={<PageLoadingFallback />}><UpgradeTier /></Suspense></LayoutWrapper></PageTransition>} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </>
  );
};


function App() {
  React.useEffect(() => {
    // Load PushAlert script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = 'https://cdn.pushalert.co/unified_184a83a152fc56a7d267677aabe26150.js';
    document.head.appendChild(script);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <TabNavigationProvider>
              <AuthenticatedApp />
            </TabNavigationProvider>
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App