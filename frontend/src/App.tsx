import { Routes, Route } from 'react-router-dom';
// 這裡假設你把 BasicSetup, HotelSetup, PreferenceQuiz 包裝成了這個頁面
import Landing from './pages/Landing';
// 地圖頁面的空殼
import MapPage from './pages/MapPage';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {/* 路由切換區域 */}
      <Routes>
        {/* 首頁：行程規劃精靈 */}
        <Route path="/" element={<Landing />} />

        {/* 地圖頁：展示規劃結果 */}
        <Route path="/map" element={<MapPage />} />
      </Routes>
    </div>
  );
}