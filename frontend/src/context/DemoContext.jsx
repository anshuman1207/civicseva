import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const DemoContext = createContext(null);

// ─── Demo Presentation Flow ────────────────────────
// Defines the guided tour stops for a live demo/presentation
const DEMO_STEPS = [
  {
    id: 'welcome',
    route: '/',
    title: 'Welcome to CivicSeva',
    subtitle: 'AI-Powered Civic Intelligence Platform',
    description: 'A smart city platform connecting citizens with local authorities for real-time civic issue reporting and resolution.',
    duration: 8000,
    highlight: null,
  },
  {
    id: 'dashboard',
    route: '/',
    title: 'Live Dashboard',
    subtitle: 'Real-Time City Pulse',
    description: 'The dashboard provides a birds-eye view of all civic activity — trending complaints, resolution stats, and community engagement metrics.',
    duration: 10000,
    highlight: 'stats',
  },
  {
    id: 'map',
    route: '/map',
    title: 'Interactive Live Map',
    subtitle: 'Geospatial Issue Tracking',
    description: 'Citizens pin complaints on an interactive Google Maps interface with real-time Socket.io updates. Each marker color-codes by category and urgency.',
    duration: 12000,
    highlight: 'map',
  },
  {
    id: 'complaints',
    route: '/complaints',
    title: 'My Complaints',
    subtitle: 'Citizen Issue Tracker',
    description: 'Users can track their submitted complaints, see status updates from authorities, and manage their civic contributions.',
    duration: 10000,
    highlight: 'complaints',
  },
  {
    id: 'leaderboard',
    route: '/leaderboard',
    title: 'Civic Leaderboard',
    subtitle: 'Gamified Community Engagement',
    description: 'A gamification layer rewards active citizens with XP, badges, and streak bonuses — driving sustained engagement and community accountability.',
    duration: 10000,
    highlight: 'leaderboard',
  },
  {
    id: 'insights',
    route: '/insights',
    title: 'Smart City Analytics',
    subtitle: 'Data-Driven Governance',
    description: 'Deep analytics with area health scoring, category trends, heatmaps, and AI-powered strategic insights for better urban governance.',
    duration: 12000,
    highlight: 'analytics',
  },
  {
    id: 'closing',
    route: '/',
    title: 'Thank You',
    subtitle: 'CivicSeva — Building Smarter Cities Together',
    description: 'Built with React, Node.js, MongoDB, Socket.io, Google Maps API, and Framer Motion. Designed for real-world impact.',
    duration: 10000,
    highlight: null,
  },
];

export function DemoProvider({ children }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const currentStep = DEMO_STEPS[currentStepIndex];
  const totalSteps = DEMO_STEPS.length;
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  // Toggle demo mode
  const toggleDemoMode = useCallback(() => {
    setIsDemoMode(prev => {
      if (!prev) {
        setCurrentStepIndex(0);
        setShowOverlay(true);
      } else {
        setShowOverlay(false);
        setIsAutoPlaying(false);
      }
      return !prev;
    });
  }, []);

  // Toggle presentation mode (clean UI)
  const togglePresentationMode = useCallback(() => {
    setIsPresentationMode(prev => !prev);
  }, []);

  // Navigate to next step
  const nextStep = useCallback(() => {
    if (currentStepIndex < totalSteps - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      const nextRoute = DEMO_STEPS[nextIdx].route;
      if (location.pathname !== nextRoute) {
        navigate(nextRoute);
      }
    } else {
      // Loop back to start
      setCurrentStepIndex(0);
      setIsAutoPlaying(false);
      navigate(DEMO_STEPS[0].route);
    }
  }, [currentStepIndex, totalSteps, location.pathname, navigate]);

  // Navigate to previous step
  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      const prevRoute = DEMO_STEPS[prevIdx].route;
      if (location.pathname !== prevRoute) {
        navigate(prevRoute);
      }
    }
  }, [currentStepIndex, location.pathname, navigate]);

  // Jump to specific step
  const goToStep = useCallback((index) => {
    if (index >= 0 && index < totalSteps) {
      setCurrentStepIndex(index);
      const targetRoute = DEMO_STEPS[index].route;
      if (location.pathname !== targetRoute) {
        navigate(targetRoute);
      }
    }
  }, [totalSteps, location.pathname, navigate]);

  // Auto-play handler
  useEffect(() => {
    if (!isDemoMode || !isAutoPlaying) return;
    
    const timer = setTimeout(() => {
      nextStep();
    }, currentStep.duration);

    return () => clearTimeout(timer);
  }, [isDemoMode, isAutoPlaying, currentStepIndex, currentStep?.duration, nextStep]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isDemoMode) return;

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          nextStep();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          prevStep();
          break;
        case 'Escape':
          toggleDemoMode();
          break;
        case 'p':
        case 'P':
          setIsAutoPlaying(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDemoMode, nextStep, prevStep, toggleDemoMode]);

  const value = {
    isDemoMode,
    isPresentationMode,
    currentStep,
    currentStepIndex,
    totalSteps,
    progress,
    isAutoPlaying,
    showOverlay,
    steps: DEMO_STEPS,
    toggleDemoMode,
    togglePresentationMode,
    nextStep,
    prevStep,
    goToStep,
    setIsAutoPlaying,
    setShowOverlay,
  };

  return (
    <DemoContext.Provider value={value}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) {
    // Return safe defaults when outside DemoProvider
    return {
      isDemoMode: false,
      isPresentationMode: false,
      currentStep: null,
      currentStepIndex: 0,
      totalSteps: 0,
      progress: 0,
      isAutoPlaying: false,
      showOverlay: false,
      steps: [],
      toggleDemoMode: () => {},
      togglePresentationMode: () => {},
      nextStep: () => {},
      prevStep: () => {},
      goToStep: () => {},
      setIsAutoPlaying: () => {},
      setShowOverlay: () => {},
    };
  }
  return context;
}
