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
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      {/* Top Header/Nav */}
      <header className="bg-teal-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3 font-bold text-xl tracking-wide">
              <div className="bg-white p-1.5 rounded-lg">
                <Building2 className="text-teal-800" size={24} />
              </div>
              Hospital Management System
            </div>
            <div className="flex items-center gap-2">
               <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 bg-teal-700 hover:bg-teal-600 rounded-lg transition-colors text-sm font-medium shadow-sm">
                 <LogOut size={16} /> Sign Out
               </button>
            </div>
          </div>
        </div>
        {/* Navigation Links */}
        <div className="bg-teal-900 border-t border-teal-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-2 overflow-x-auto py-2 scrollbar-hide">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-teal-100 hover:bg-teal-700 hover:text-white transition-all whitespace-nowrap"
                >
                  <item.icon size={18} />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="animate-fade-in-up">
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
