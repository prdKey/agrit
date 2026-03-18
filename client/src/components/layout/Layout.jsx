import { Outlet } from 'react-router-dom';
import Footer from './Footer';
import Header from './Header';


export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50">
      <Header/>
      <main className="w-full max-w-7xl ">
        <Outlet />
      </main>
      <Footer/>
    </div>
  );
}
