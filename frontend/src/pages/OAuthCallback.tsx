import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const isFetching = useRef(false);

  useEffect(() => {
    // 取得當前 URL 中的 query 參數
    const params = new URLSearchParams(location.search);
    const code = params.get('code');

    // 判斷是 Google 還是 Discord
    const pathname = location.pathname;
    let provider = '';
    if (pathname.includes('google')) provider = 'google';
    else if (pathname.includes('discord')) provider = 'discord';

    if (!code) {
      setError('遺失授權碼 (Missing authorization code)');
      return;
    }

    if (isFetching.current) return;
    isFetching.current = true;

    // 向後端請求交換 Token
    const fetchToken = async () => {
      try {
        const url = `/api/oauth/${provider}/callback${location.search}`;
        const res = await fetch(url);
        
        if (!res.ok) {
          throw new Error('Authentication failed');
        }

        const data = await res.json();
        
        if (data.access_token) {
          Cookies.set('access_token', data.access_token, { expires: 7 }); // 7 天過期
        }
        if (data.user) {
          Cookies.set('user_data', JSON.stringify(data.user), { expires: 7 });
        }

        navigate('/');
      } catch (err) {
        console.error(err);
        setError('登入失敗，請稍後再試。');
        isFetching.current = false;
      }
    };

    fetchToken();
  }, [location, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 px-4 flex flex-col justify-center">
        <main className="w-full">
          <div className="max-w-md mx-auto p-8 bg-white rounded-xl shadow-md text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">認證發生錯誤</h2>
            <p className="text-gray-500 mb-6">{error}</p>
            <button 
              onClick={() => navigate('/login')}
              className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
            >
              返回登入頁面
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 flex flex-col justify-center">
      <main className="w-full">
        <div className="max-w-md mx-auto p-8 bg-white rounded-xl shadow-md text-center flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <h2 className="text-xl font-bold text-gray-800">正在驗證您的身分...</h2>
          <p className="text-gray-500 mt-2">請稍候，即將帶您進入系統</p>
        </div>
      </main>
    </div>
  );
}
