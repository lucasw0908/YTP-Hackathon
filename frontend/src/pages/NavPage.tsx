import NavigationMap from '../components/NavigationMap';

function NavPage() {
    return (
        <div className="h-screen w-full border-2 border-blue-500">
            <NavigationMap
                destinationName="測試任務點"
                routeCoords={[
                    { lat: 25.0478, lng: 121.5170 }, // 假設這是後端算好的轉彎點
                    { lat: 25.0485, lng: 121.5180 },
                    { lat: 25.0490, lng: 121.5195 }  // 終點
                ]}
            />
        </div>
    )
}

export default NavPage