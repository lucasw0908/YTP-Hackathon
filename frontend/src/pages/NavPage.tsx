import NavController from '../components/NavController';
import { MOCK_ROUTE } from '../api/directionsApi'

function NavPage() {
    return (
        <div className="h-screen w-full">
            <NavController route={MOCK_ROUTE} />
        </div>
    );
}

export default NavPage;