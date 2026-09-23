import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import type { Database } from '../types/database.types';

type Doctor = Database['public']['Tables']['doctors']['Row'];
type Department = Database['public']['Tables']['departments']['Row'];

export default function Doctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newDoctor, setNewDoctor] = useState({
    first_name: '', last_name: '', specialization: '', fee: '', phone: '', dept_id: ''
  });

  const fetchData = async () => {
    setLoading(true);
    const [docRes, depRes] = await Promise.all([
      supabase.from('doctors').select('*').order('doctor_id'),
      supabase.from('departments').select('*').order('dept_name')
    ]);
    
    if (docRes.error) toast.error('Failed to load doctors');
    else setDoctors(docRes.data || []);
    
    if (depRes.error) toast.error('Failed to load departments');
    else setDepartments(depRes.data || []);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoctor.first_name || !newDoctor.last_name || !newDoctor.fee) return;
    
    const { error } = await supabase.from('doctors').insert([{ 
      first_name: newDoctor.first_name,
      last_name: newDoctor.last_name,
      specialization: newDoctor.specialization,
      fee: parseFloat(newDoctor.fee),
      phone: newDoctor.phone,
      dept_id: newDoctor.dept_id ? parseInt(newDoctor.dept_id) : null
    }]);

    if (error) {
      toast.error('Error adding doctor');
    } else {
      toast.success('Doctor added');
      setNewDoctor({ first_name: '', last_name: '', specialization: '', fee: '', phone: '', dept_id: '' });
      fetchData();
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Doctors</h2>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <h3 className="font-semibold mb-4">Register Doctor</h3>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm text-gray-600 mb-1">First Name</label>
            <input type="text" className="border p-2 rounded w-full" value={newDoctor.first_name} onChange={e => setNewDoctor({...newDoctor, first_name: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Last Name</label>
            <input type="text" className="border p-2 rounded w-full" value={newDoctor.last_name} onChange={e => setNewDoctor({...newDoctor, last_name: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Specialization</label>
            <input type="text" className="border p-2 rounded w-full" value={newDoctor.specialization} onChange={e => setNewDoctor({...newDoctor, specialization: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Fee</label>
            <input type="number" step="0.01" className="border p-2 rounded w-full" value={newDoctor.fee} onChange={e => setNewDoctor({...newDoctor, fee: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Phone</label>
            <input type="text" className="border p-2 rounded w-full" value={newDoctor.phone} onChange={e => setNewDoctor({...newDoctor, phone: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Department</label>
            <select className="border p-2 rounded w-full" value={newDoctor.dept_id} onChange={e => setNewDoctor({...newDoctor, dept_id: e.target.value})}>
              <option value="">None</option>
              {departments.map(d => (
                <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-3 flex justify-end mt-2">
            <button type="submit" className="bg-teal-700 text-white px-6 py-2 rounded hover:bg-teal-800">
              Register Doctor
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
              <th className="p-4">Specialization</th>
              <th className="p-4">Position</th>
              <th className="p-4">Dept ID</th>
              <th className="p-4">Fee</th>
              <th className="p-4">Phone</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-4 text-center">Loading...</td></tr>
            ) : doctors.length === 0 ? (
              <tr><td colSpan={7} className="p-4 text-center">No doctors found.</td></tr>
            ) : (
              doctors.map(doc => {
                const isHead = departments.some(d => d.head_doctor_id === doc.doctor_id);
                return (
                  <tr key={doc.doctor_id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="p-4">{doc.doctor_id}</td>
                    <td className="p-4 font-medium">{doc.first_name} {doc.last_name}</td>
                    <td className="p-4">{doc.specialization}</td>
                    <td className="p-4">
                      {isHead ? (
                        <span className="px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded-full font-medium">Head of Department</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Attending Doctor</span>
                      )}
                    </td>
                    <td className="p-4">{doc.dept_id || '-'}</td>
                    <td className="p-4">${doc.fee?.toFixed(2)}</td>
                    <td className="p-4">{doc.phone}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
