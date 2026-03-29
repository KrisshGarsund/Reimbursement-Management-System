import Navbar from './Navbar.jsx';
import Sidebar from './Sidebar.jsx';
import { Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <Navbar />
      <div className="flex flex-1 pt-[64px]">
        <Sidebar />
        <main className="flex-1 w-full md:ml-[260px] p-6 lg:p-10 animate-slide-up pb-24">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
