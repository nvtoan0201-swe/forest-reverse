import { createBrowserRouter, Navigate } from 'react-router';
import { PhoneFrame } from './layout/PhoneFrame';
import { MainPage } from '../features/main/ui/MainPage';
import { TimelinePage } from '../features/timeline/ui/TimelinePage';
import { StatsPage } from '../features/stats/ui/StatsPage';
import { StorePage } from '../features/store/ui/StorePage';
import { TagsPage } from '../features/tags/ui/TagsPage';
import { SettingsPage } from '../features/settings/ui/SettingsPage';
import { RelaxPage } from '../features/relax/ui/RelaxPage';
import { AboutPage } from '../features/about/ui/AboutPage';
import { ComingSoonPage } from '../features/menu/ui/ComingSoonPage';
import { OnboardingPage } from '../features/onboarding/ui/OnboardingPage';
import { SplashPage } from '../features/onboarding/ui/SplashPage';

export const router = createBrowserRouter([
  {
    element: <PhoneFrame />,
    children: [
      { path: '/', element: <SplashPage /> },
      { path: '/onboarding', element: <OnboardingPage /> },
      { path: '/main', element: <MainPage /> },
      { path: '/timeline', element: <TimelinePage /> },
      { path: '/stats', element: <StatsPage /> },
      { path: '/store', element: <StorePage /> },
      { path: '/tags', element: <TagsPage /> },
      { path: '/settings', element: <SettingsPage /> },
      { path: '/relax', element: <RelaxPage /> },
      { path: '/about', element: <AboutPage /> },
      { path: '/coming-soon/:section', element: <ComingSoonPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
