import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useState, lazy, Suspense, useCallback } from 'react';
import ErrorBoundary from './components/common/ErrorBoundary';
import ComponentErrorBoundary from './components/common/ComponentErrorBoundary';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import BottomNav from './components/layout/BottomNav';
import MapContainer from './components/map/MapContainer';
import ReportModal from './components/layout/ReportModal';
import ConnectivityBanner from './components/layout/ConnectivityBanner';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import VoiceAssistant from './components/accessibility/VoiceAssistant';
import ToastContainer from './components/common/ToastContainer';
import { useToast } from './context/ToastContext';
import PageLoader from './components/common/PageLoader';
import { DemoProvider, useDemo } from './context/DemoContext';
import PresentationController from './components/demo/PresentationController';

// ─── Lazy Loaded Pages ──────────────────────────
const Dashboard = lazy(() => import('./pages/Dashboard'));
const MyComplaints = lazy(() => import('./pages/MyComplaints'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Insights = lazy(() => import('./pages/Insights'));
const Settings = lazy(() => import('./pages/Settings'));
const Profile = lazy(() => import('./pages/Profile'));
const Challenges = lazy(() => import('./pages/Challenges'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));

const MapPage = lazy(() => import('./pages/MapPage'));

function AppContent() {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isPresentationMode, isDemoMode } = useDemo();

  // Check if current route is auth route
  const isAuthRoute = ['/login', '/register'].includes(location.pathname);

  const { showToast } = useToast();

  const handleLocationSelect = useCallback((latlng) => {
    setSelectedLocation(latlng);
  }, []);

  const handleReportClick = useCallback(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }
    
    if (!selectedLocation) {
      showToast("Please click anywhere on the map first to select the issue location.", "warning");
      return;
    }
    setIsReportModalOpen(true);
  }, [isAuthenticated, location, navigate, selectedLocation, showToast]);

  const handleCloseReportModal = useCallback(() => {
    setIsReportModalOpen(false);
  }, []);

  // For auth routes, render without shell
  if (isAuthRoute) {
    return (
      <div className="h-[100dvh] bg-[var(--color-background)] text-[var(--color-on-background)] font-sans">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </Suspense>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="h-[100dvh] bg-[var(--color-background)] text-[var(--color-on-background)] font-sans flex flex-col overflow-hidden">
        <ConnectivityBanner />
        <Navbar onReportClick={handleReportClick} />
      
      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-[var(--spacing-container-max)] mx-auto flex overflow-hidden p-4 gap-6">
        <Sidebar />
        
        {/* Main map/routes area */}
        <main className="flex-1 relative h-full rounded-[var(--radius-xl)] overflow-hidden">
          <ComponentErrorBoundary name="Main Content Area">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/map" element={
                  <MapPage 
                    selectedLocation={selectedLocation} 
                    onLocationSelect={handleLocationSelect} 
                  />
                } />
                
                {/* Protected Civic Operations */}
                <Route path="/complaints" element={
                  <ProtectedRoute>
                    <MyComplaints />
                  </ProtectedRoute>
                } />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/challenges" element={
                  <ProtectedRoute>
                    <Challenges />
                  </ProtectedRoute>
                } />
                <Route path="/insights" element={<Insights />} />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
              </Routes>
            </Suspense>
          </ComponentErrorBoundary>
        </main>
      </div>
      
      {!isPresentationMode && <BottomNav />}
      
      <ReportModal 
        isOpen={isReportModalOpen}
        onClose={handleCloseReportModal}
        location={selectedLocation}
      />

      <VoiceAssistant onReportClick={handleReportClick} />
      <ToastContainer />
      <PresentationController />
      </div>
    </ErrorBoundary>
  );
}

// ─── App Wrapper with DemoProvider ──────────────────
function App() {
  return (
    <DemoProvider>
      <AppContent />
    </DemoProvider>
  );
}

export default App;
