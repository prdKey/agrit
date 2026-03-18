import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css'
import Home from './pages/Home'
import Layout from "./components/layout/Layout"
import Market from "./pages/Market"
import ProtectedRoute from "./components/common/ProtectedRoutes.jsx"
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Account from "./pages/Account.jsx";
import Profile from "./pages/user/Profile.jsx";
import Checkout from "./pages/user/Checkout.jsx";
import Notifications from "./pages/user/Notifications.jsx";
import Dispute from "./pages/user/Dispute.jsx"
import Address from "./pages/user/Address.jsx";
import AddressForm from "./pages/user/AddressForm";
import PageNotFound from "./pages/PageNotFound.jsx"
import Dashboard from "./pages/user/Dashboard.jsx";
import SellerPanel from "./pages/seller/SellerPanel.jsx";
import SellerDashboard from "./pages/seller/SellerDashboard.jsx"
import SellerProducts from "./pages/seller/SellerProduct.jsx";
import SellerAppeal from "./pages/seller/SellerAppeal.jsx"
import SellerDispute from "./pages/seller/SellerDispute.jsx";
import SellerOrders from "./pages/seller/SellerOrders.jsx"
import SellerNotifications from "./pages/seller/SellerNotifications";
import Product from "./pages/user/Product.jsx";
import Cart from "./pages/user/Cart.jsx";
import Orders from "./pages/user/Orders.jsx"
import LogisticPanel from "./pages/logistic/LogisticPanel.jsx"
import LogisticDashboard from "./pages/logistic/LogisticDashboard.jsx";
import LogisticOrders from "./pages/logistic/LogisticOrder.jsx";
import LogisticsNotifications from "./pages/logistic/LogisticNotifications";
import TrackOrder from "./pages/TrackOrder";
import AdminPanel from "./pages/admin/AdminPanel.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import UserManagement from "./pages/admin/UserManagement";
import AdminApplications from "./pages/admin/AdminApplications";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders.jsx"
import AdminReports from "./pages/admin/AdminReports";
import AdminDisputes from "./pages/admin/AdminDisputes";
import AdminWallet from "./pages/admin/AdminWallet.jsx";
import TokenManagement from "./pages/admin/TokenManagement";

import Wallet from "./pages/Wallet.jsx";

import Unauthorized from "./pages/Unauthorized";

import Application from "./pages/Application.jsx"

import TransactionHistory from "./pages/TransactionHistory.jsx";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/seller" element={<ProtectedRoute roles={["SELLER"]}><SellerPanel/></ProtectedRoute>}>
          <Route index element={<SellerDashboard/>}/>
          <Route path="dashboard" element={<SellerDashboard/>}/>
          <Route path="products" element={<SellerProducts />}/>
          <Route path="appeal" element={<SellerAppeal/>}/>
          <Route path="dispute" element={<SellerDispute/>}/>
          <Route path="notifications" element={<SellerNotifications/>}/>
          <Route path="orders" element={<SellerOrders />}/>
          <Route path="*" element={<div>Page Not Found</div>}/>
        </Route>

        <Route path="/admin" element={<ProtectedRoute roles={["ADMIN"]}><AdminPanel/></ProtectedRoute>}>
          <Route index element={<AdminDashboard/>}/>
          <Route path="dashboard" element={<AdminDashboard/>}/>
          <Route path="users" element={<UserManagement/>}/>
          <Route path="applications" element={<AdminApplications/>}/>
          <Route path="products" element={<AdminProducts />}/>
          <Route path="wallet" element={<AdminWallet />} />
          <Route path="token-management" element={<TokenManagement/>}/>
          <Route path="orders" element={<AdminOrders/>}/>
          <Route path="disputes" element={<AdminDisputes />}/>
          <Route path="reports" element={<AdminReports />}/>
          <Route path="*" element={<div>Page Not Found</div>}/>
        </Route>

        <Route path="/track-order/:orderId" element={<TrackOrder/>}/>

        <Route path="/logistic" element={<ProtectedRoute roles={["LOGISTICS"]} ><LogisticPanel/></ProtectedRoute>}>
          <Route index element={<LogisticDashboard/>}/>
          <Route path="dashboard" element={<LogisticDashboard/>}/>
          <Route path="notifications" element={<LogisticsNotifications/>}/>
          <Route path="orders" element={<LogisticOrders/>}/>
          <Route path="*" element={<div>Page Not Found</div>}/>
        </Route>

        <Route path="/about" element={<Home />} />
        <Route path="/applications" element={<Application/>}/>
        <Route path="/" element={<Market />} >
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register/>}/>
        </Route>
        
        <Route path="/search" element={<Market />} />

        <Route path="/products/:id" element={<Product/>}/>

        <Route path="/user" element={<ProtectedRoute ><Account/></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />}/>
          <Route path="profile" element={<Profile/>}/>
          <Route path="address" element={<Address/>}/>
          <Route path="dispute" element={<Dispute/>}/>
          <Route path="notifications" element={<Notifications/>}/>
          <Route path="profile" element={<div>profile</div>}/>
          <Route path="purchase" element={<Orders/>}/>
          <Route path="*" element={<div>Page Not Found</div>}/>
        </Route> 
        <Route path="/address" element={<ProtectedRoute roles={["USER", "SELLER", "LOGISTICS", "ADMIN"]}><AddressForm/></ProtectedRoute>}>
          <Route path="new" element={<AddressForm/>}/>
          <Route path="edit/:id" element={<AddressForm/>}/>
        </Route>
        <Route path="/cart" element={<ProtectedRoute roles={["USER", "SELLER", "LOGISTICS", "ADMIN"]}><Cart/></ProtectedRoute>}/>
        <Route path="/checkout" element={<ProtectedRoute roles={["USER", "SELLER", "LOGISTICS", "ADMIN"]}><Checkout/></ProtectedRoute>}/>
        <Route path="/wallet" element={<ProtectedRoute roles={["USER", "SELLER", "LOGISTICS", "ADMIN"]}><Wallet/></ProtectedRoute>}/>
        <Route path="/transaction-history" element={<TransactionHistory/>}/>
        <Route path="/unauthorized" element={<Unauthorized/>}/>
        <Route path="/*" element={<PageNotFound/>} />
      </Route>
    </Routes>
  );
}

export default App;
