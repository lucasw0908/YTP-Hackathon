import { Routes, Route } from 'react-router-dom';
// 這裡假設你把 BasicSetup, HotelSetup, PreferenceQuiz 包裝成了這個頁面
import Landing from './pages/Landing';
// 地圖頁面的空殼
import MapPage from './pages/MapPage';
import NavPage from './pages/NavPage';
import LoginPage from './pages/LoginPage';
import OAuthCallback from './pages/OAuthCallback';

import { LocationProvider } from './contexts/LocationContext';


export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <LocationProvider>
        <Routes>
          {/* 首頁：行程規劃精靈 */}
          <Route path="/" element={<Landing />} />

          {/* 地圖頁：展示規劃結果 */}
          <Route path="/map" element={<MapPage />} />
          <Route path="/nav" element={<NavPage />} />

          {/* 認證與登入 */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          <Route path="/oauth/google/callback" element={<OAuthCallback />} />
          <Route path="/oauth/discord/callback" element={<OAuthCallback />} />
        </Routes>
      </LocationProvider>
    </div>
  );
}