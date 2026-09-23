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
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="bg-blue-100 p-4 rounded-full text-blue-600"><Users size={24} /></div>
          <div>
            <p className="text-gray-500 text-sm">Total Patients</p>
            <p className="text-2xl font-semibold">{stats.patients}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="bg-green-100 p-4 rounded-full text-green-600"><Bed size={24} /></div>
          <div>
            <p className="text-gray-500 text-sm">Active Admissions</p>
            <p className="text-2xl font-semibold">{stats.activeAdmissions}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="bg-purple-100 p-4 rounded-full text-purple-600"><Calendar size={24} /></div>
          <div>
            <p className="text-gray-500 text-sm">Appointments Today</p>
            <p className="text-2xl font-semibold">{stats.appointmentsToday}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
