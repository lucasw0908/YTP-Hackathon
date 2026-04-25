import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import MapPage from './pages/MapPage';
import NavPage from './pages/NavPage';
import LoginPage from './pages/LoginPage';
import OAuthCallback from './pages/OAuthCallback';
import TaskPage from './pages/TaskPage';
import { LocationProvider } from './contexts/LocationContext';

export default function App() {
  return (
    <LocationProvider>
      <Routes>
        <Route path="/" element={
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Landing />
          </div>
        } />
        <Route path="/map" element={<MapPage />} />
        <Route path="/task/:taskId" element={<TaskPage />} />
        <Route path="/nav" element={<NavPage />} />

          {/* 認證與登入 */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          <Route path="/oauth/google/callback" element={<OAuthCallback />} />
          <Route path="/oauth/discord/callback" element={<OAuthCallback />} />
      </Routes>
    </LocationProvider>
  );
}
