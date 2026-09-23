import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import type { Database } from '../types/database.types';

type Department = Database['public']['Tables']['departments']['Row'];

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDept, setNewDept] = useState({ dept_name: '', floor: '' });

  const fetchDepartments = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('departments').select('*').order('dept_id');
    if (error) toast.error('Failed to load departments');
    else setDepartments(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDept.dept_name || !newDept.floor) return;
    
    const { error } = await supabase.from('departments').insert([{ 
      dept_name: newDept.dept_name, 
      floor: parseInt(newDept.floor, 10)
    }]);

    if (error) {
      toast.error('Error adding department');
    } else {
      toast.success('Department added');
      setNewDept({ dept_name: '', floor: '' });
      fetchDepartments();
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Departments</h2>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <h3 className="font-semibold mb-4">Add Department</h3>
        <form onSubmit={handleAdd} className="flex gap-4 items-end">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Department Name</label>
            <input 
              type="text" 
              className="border p-2 rounded w-64" 
              value={newDept.dept_name} 
              onChange={e => setNewDept({...newDept, dept_name: e.target.value})} 
              required 
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Floor</label>
            <input 
              type="number" 
              className="border p-2 rounded w-32" 
              value={newDept.floor} 
              onChange={e => setNewDept({...newDept, floor: e.target.value})} 
              required 
            />
          </div>
          <button type="submit" className="bg-teal-700 text-white px-4 py-2 rounded hover:bg-teal-800">
            Add
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Name</th>
              <th className="p-4">Floor</th>
              <th className="p-4">Head Doctor ID</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="p-4 text-center">Loading...</td></tr>
            ) : departments.length === 0 ? (
              <tr><td colSpan={4} className="p-4 text-center">No departments found.</td></tr>
            ) : (
              departments.map(dept => (
                <tr key={dept.dept_id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-4">{dept.dept_id}</td>
                  <td className="p-4 font-medium">{dept.dept_name}</td>
                  <td className="p-4">{dept.floor}</td>
                  <td className="p-4">{dept.head_doctor_id || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
