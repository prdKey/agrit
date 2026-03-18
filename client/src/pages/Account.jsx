// AccountPage.jsx
import Sidebar  from "../components/common/Sidebar.jsx";
import { Outlet } from "react-router-dom";
import { LayoutDashboard, Package, User ,Bell, Settings, MapPin, AlertTriangle} from "lucide-react";

function Account() {
  const menu = [
    { name: "Dashboard", icon: LayoutDashboard , path: "dashboard"},
    { name: "Profile", icon: User, path: "profile"},
    { name: "My Purchase", icon: Package, path: "purchase" },
    { name: "Dispute", icon:  AlertTriangle, path: "dispute"},
    { name: "Notifications", icon:  Bell, path: "notifications"},
    { name: "Address", icon: MapPin, path: "address"},
  ];
  return (
      <div className="w-full flex mt-0 md:mt-6 mx-auto ">
        <div className=" w-full flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <Sidebar menuItems={menu} title={"My Account"}/>

          {/* Main Content */}
          <main className="flex-1 pr-6 pl-6 md:p-0">
            <Outlet/>
          </main>
        </div>
      </div>
  );
}

export default Account;
