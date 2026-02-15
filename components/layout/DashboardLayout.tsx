import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface DashboardLayoutProps {
  children: ReactNode;
  username: string;
}

export default function DashboardLayout({ children, username }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header username={username} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
