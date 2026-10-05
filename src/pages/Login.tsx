import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Building2 } from 'lucide-react';

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showLanding, setShowLanding] = useState(true);

  // Check if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) onLogin();
    });
  }, [onLogin]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Registration successful! Please log in.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Logged in successfully');
        onLogin();
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  if (showLanding) {
    return (
      <div 
        className="min-h-screen bg-cover bg-center relative"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80")' }}
      >
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/60"></div>

        {/* Top Navbar */}
        <nav className="relative z-10 flex justify-between items-center px-8 py-6">
          <div className="flex items-center gap-2 text-white font-bold text-2xl tracking-wide">
            HMS. <span className="text-teal-400 text-sm font-normal tracking-widest uppercase">| The Health Project</span>
          </div>
          <div className="flex gap-6 text-white text-sm font-semibold tracking-wider">
            <button onClick={() => { setIsSignUp(false); setShowLanding(false); }} className="hover:text-teal-400 transition-colors">LOGIN</button>
            <button onClick={() => { setIsSignUp(true); setShowLanding(false); }} className="hover:text-teal-400 transition-colors">REGISTER</button>
          </div>
        </nav>

        {/* Center Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-[calc(100vh-100px)] text-center px-4 animate-fade-in-up">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Avoid Hassles & Delays.
          </h1>
          <p className="text-gray-200 text-lg md:text-xl mb-2">
            How is health today, Sounds like not good!
          </p>
          <p className="text-gray-300 text-md md:text-lg mb-8 max-w-2xl">
            Don't worry. Find your doctor online Book as you wish with HMS. <br/>
            We offer you a free doctor channeling service, Make your appointment now.
          </p>
          <button 
            onClick={() => { setIsSignUp(false); setShowLanding(false); }}
            className="bg-teal-600 hover:bg-teal-500 text-white font-semibold py-3 px-8 rounded-md transition-all transform hover:scale-105 shadow-lg"
          >
            Make Appointment
          </button>
          
          <p className="absolute bottom-8 text-gray-400 text-xs">
            A Web Solution by You.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up">
        <div className="flex justify-center">
          <div className="bg-teal-800 p-4 rounded-2xl shadow-lg cursor-pointer" onClick={() => setShowLanding(true)}>
            <Building2 size={48} className="text-teal-100" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          HMS Portal
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isSignUp ? 'Create a new staff account' : 'Sign in to access your dashboard'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="bg-white py-8 px-4 shadow-xl border border-gray-100 sm:rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleAuth}>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
              >
                {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-teal-600 hover:text-teal-500 font-medium text-sm"
              >
                {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
              </button>
            </div>
            
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowLanding(true)}
                className="text-gray-400 hover:text-gray-600 font-medium text-xs underline"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
