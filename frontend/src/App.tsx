import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import MapPage from './pages/MapPage';
import NavPage from './pages/NavPage';
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
      </Routes>
    </LocationProvider>
  );
}
