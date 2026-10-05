import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Building2, Users, UserRound, Calendar, Bed, Pill, ReceiptText, LayoutDashboard, LogOut } from 'lucide-react';
import { supabase } from './lib/supabase';

import Dashboard from './pages/Dashboard';
import Departments from './pages/Departments';
import Doctors from './pages/Doctors';
import Patients from './pages/Patients';
import Appointments from './pages/Appointments';
import Admissions from './pages/Admissions';
import Pharmacy from './pages/Pharmacy';
import Billing from './pages/Billing';
import Login from './pages/Login';

function Layout({ children, onLogout }: { children: React.ReactNode, onLogout: () => void }) {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Patients', path: '/patients', icon: Users },
    { name: 'Doctors', path: '/doctors', icon: UserRound },
    { name: 'Departments', path: '/departments', icon: Building2 },
    { name: 'Appointments', path: '/appointments', icon: Calendar },
    { name: 'Admissions & Beds', path: '/admissions', icon: Bed },
    { name: 'Pharmacy', path: '/pharmacy', icon: Pill },
    { name: 'Billing', path: '/billing', icon: ReceiptText },
  ];

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Sidebar (Fixed 250px) */}
      <aside className="w-[250px] bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        {/* Brand Area */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <div className="flex items-center gap-2 text-teal-700 font-bold text-lg tracking-tight">
            <Building2 size={24} />
            HMS Portal
          </div>
        </div>

        {/* Profile Area */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
              MA
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">Administrator</div>
              <div className="text-xs text-gray-500">System Admin</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-teal-50 hover:text-teal-700 transition-colors"
                >
                  <item.icon size={18} />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={onLogout}
            className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        {/* Page content wrapper handles scrolling */}
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;
  }

  if (!session) {
    return (
      <>
        <Login onLogin={() => {}} />
        <Toaster position="top-right" />
      </>
    );
  }

  return (
    <Router>
      <Layout onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/departments" element={<Departments />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/admissions" element={<Admissions />} />
          <Route path="/pharmacy" element={<Pharmacy />} />
          <Route path="/billing" element={<Billing />} />
        </Routes>
      </Layout>
      <Toaster position="top-right" />
    </Router>
  );
}

export default App;
