import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import type { Database } from '../types/database.types';

type Patient = Database['public']['Tables']['patients']['Row'];

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newPatient, setNewPatient] = useState({
    first_name: '', last_name: '', dob: '', gender: '', blood_group: '', contact: ''
  });

  const fetchPatients = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('patients').select('*').order('patient_id', { ascending: false });
    if (error) toast.error('Failed to load patients');
    else setPatients(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatient.first_name || !newPatient.last_name) return;
    
    const { error } = await supabase.from('patients').insert([{ 
      first_name: newPatient.first_name,
      last_name: newPatient.last_name,
      dob: newPatient.dob || null,
      gender: newPatient.gender || null,
      blood_group: newPatient.blood_group || null,
      contact: newPatient.contact || null
    }]);

    if (error) {
      toast.error('Error registering patient');
    } else {
      toast.success('Patient registered');
      setNewPatient({ first_name: '', last_name: '', dob: '', gender: '', blood_group: '', contact: '' });
      fetchPatients();
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Patients</h2>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <h3 className="font-semibold mb-4">Register Patient</h3>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm text-gray-600 mb-1">First Name</label>
            <input type="text" className="border p-2 rounded w-full" value={newPatient.first_name} onChange={e => setNewPatient({...newPatient, first_name: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Last Name</label>
            <input type="text" className="border p-2 rounded w-full" value={newPatient.last_name} onChange={e => setNewPatient({...newPatient, last_name: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Date of Birth</label>
            <input type="date" className="border p-2 rounded w-full" value={newPatient.dob} onChange={e => setNewPatient({...newPatient, dob: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Gender</label>
            <select className="border p-2 rounded w-full" value={newPatient.gender} onChange={e => setNewPatient({...newPatient, gender: e.target.value})}>
              <option value="">Select...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Blood Group</label>
            <input type="text" className="border p-2 rounded w-full" placeholder="e.g. O+" value={newPatient.blood_group} onChange={e => setNewPatient({...newPatient, blood_group: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Contact</label>
            <input type="text" className="border p-2 rounded w-full" value={newPatient.contact} onChange={e => setNewPatient({...newPatient, contact: e.target.value})} />
          </div>
          <div className="md:col-span-3 flex justify-end mt-2">
            <button type="submit" className="bg-teal-700 text-white px-6 py-2 rounded hover:bg-teal-800">
              Register Patient
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Name</th>
              <th className="p-4">DOB</th>
              <th className="p-4">Gender</th>
              <th className="p-4">Blood Group</th>
              <th className="p-4">Contact</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-4 text-center">Loading...</td></tr>
            ) : patients.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-center">No patients found.</td></tr>
            ) : (
              patients.map(p => (
                <tr key={p.patient_id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-4">{p.patient_id}</td>
                  <td className="p-4 font-medium">{p.first_name} {p.last_name}</td>
                  <td className="p-4">{p.dob || '-'}</td>
                  <td className="p-4">{p.gender || '-'}</td>
                  <td className="p-4">{p.blood_group || '-'}</td>
                  <td className="p-4">{p.contact || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
