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
    { name: 'Departments', path: '/departments', icon: Building2 },
    { name: 'Doctors', path: '/doctors', icon: UserRound },
    { name: 'Patients', path: '/patients', icon: Users },
    { name: 'Appointments', path: '/appointments', icon: Calendar },
    { name: 'Admissions & Beds', path: '/admissions', icon: Bed },
    { name: 'Pharmacy', path: '/pharmacy', icon: Pill },
    { name: 'Billing', path: '/billing', icon: ReceiptText },
  ];

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-teal-800 text-white flex flex-col">
        <div className="p-4 text-xl font-bold border-b border-teal-700 flex items-center gap-2">
          <Building2 /> HMS Portal
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className="flex items-center gap-3 px-4 py-2 mx-2 rounded-md hover:bg-teal-700 transition-colors"
                >
                  <item.icon size={20} />
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-teal-700">
          <button 
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-2 w-full text-left rounded-md hover:bg-teal-700 transition-colors"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm h-16 flex items-center px-6">
          <h1 className="text-xl font-semibold">Hospital Management System</h1>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
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
