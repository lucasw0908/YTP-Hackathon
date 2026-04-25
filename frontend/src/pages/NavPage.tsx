import NavController from '../components/NavController';
import type { Route } from '../types/wayPoint';

// 暫用 mock route，待 directionsApi.ts 完成後替換
const MOCK_ROUTE: Route = {
    id: 'mock-1',
    waypoints: [
        {
            coord: [121.5734, 25.0476], mode: 'walk', role: 'transition',
            positioning: 'gps', instruction: '從南京復興站出發，開始步行'
        },
        { coord: [121.5720, 25.0480], mode: 'walk', role: 'waypoint', positioning: 'gps' },
        { coord: [121.5700, 25.0482], mode: 'walk', role: 'waypoint', positioning: 'gps' },
        {
            coord: [121.5686, 25.0485], mode: 'bike', role: 'transition',
            positioning: 'gps', instruction: '請在此取得 YouBike，切換騎車模式'
        },
        { coord: [121.5660, 25.0490], mode: 'bike', role: 'waypoint', positioning: 'gps' },
        { coord: [121.5630, 25.0495], mode: 'bike', role: 'waypoint', positioning: 'gps' },
        {
            coord: [121.5600, 25.0500], mode: 'metro', role: 'transition',
            positioning: 'beacon', instruction: '0進入大安站，開始搭捷運',
            station: '大安', stationCode: 'R07'
        },
        { coord: [121.5600, 25.0500], mode: 'metro', role: 'waypoint', positioning: 'beacon', station: '大安', stationCode: 'R07', line: 'R' },
        { coord: [121.5568, 25.0437], mode: 'metro', role: 'waypoint', positioning: 'beacon', station: '科技大樓', stationCode: 'BR09', line: 'BR' },
        { coord: [121.5499, 25.0418], mode: 'metro', role: 'waypoint', positioning: 'beacon', station: '六張犁', stationCode: 'BR10', line: 'BR' },
        {
            coord: [121.5440, 25.0394], mode: 'metro', role: 'destination',
            positioning: 'beacon', station: '麟光', stationCode: 'BR11',
            instruction: '🎉 已抵達麟光站！任務完成'
        },
    ],
};

function NavPage() {
    return (
        <div className="h-screen w-full">
            <NavController route={MOCK_ROUTE} />
        </div>
    );
}

export default NavPage;