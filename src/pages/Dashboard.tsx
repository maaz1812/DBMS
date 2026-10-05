import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Bed, Calendar } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({ patients: 0, activeAdmissions: 0, appointmentsToday: 0 });

  useEffect(() => {
    async function fetchStats() {
      try {
        const { count: patientsCount } = await supabase.from('patients').select('*', { count: 'exact', head: true });
        const { count: admissionsCount } = await supabase.from('admissions').select('*', { count: 'exact', head: true }).is('discharge_date', null);
        const today = new Date().toISOString().split('T')[0];
        const { count: appointmentsCount } = await supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('appt_date', today);
        
        setStats({
          patients: patientsCount || 0,
          activeAdmissions: admissionsCount || 0,
          appointmentsToday: appointmentsCount || 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    }
    fetchStats();
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Overview</h2>
        <p className="text-sm text-gray-500 mt-1">Welcome back. Here is what is happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Stat Card 1 */}
        <div className="surface-card p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-500">Total Patients</p>
            <Users size={20} className="text-teal-700" />
          </div>
          <p className="text-3xl font-semibold text-gray-900">{stats.patients}</p>
        </div>
        
        {/* Stat Card 2 */}
        <div className="surface-card p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-500">Active Admissions</p>
            <Bed size={20} className="text-teal-700" />
          </div>
          <p className="text-3xl font-semibold text-gray-900">{stats.activeAdmissions}</p>
        </div>

        {/* Stat Card 3 */}
        <div className="surface-card p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-500">Appointments Today</p>
            <Calendar size={20} className="text-teal-700" />
          </div>
          <p className="text-3xl font-semibold text-gray-900">{stats.appointmentsToday}</p>
        </div>

        {/* Stat Card 4 (Placeholder for Doctors) */}
        <div className="surface-card p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-500">System Status</p>
            <div className="w-2 h-2 rounded-full bg-teal-500"></div>
          </div>
          <p className="text-3xl font-semibold text-gray-900">Online</p>
        </div>
      </div>
      
      {/* Example Empty State for Lists below */}
      <div className="surface-card p-8 text-center text-gray-500">
        <p className="text-sm font-medium">Select a module from the sidebar to manage hospital records.</p>
      </div>
    </div>
  );
}
