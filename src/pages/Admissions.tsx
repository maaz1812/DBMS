import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import type { Database } from '../types/database.types';

type Admission = Database['public']['Tables']['admissions']['Row'];
type Patient = Database['public']['Tables']['patients']['Row'];
type Doctor = Database['public']['Tables']['doctors']['Row'];
type Bed = Database['public']['Tables']['rooms_beds']['Row'];

export default function Admissions() {
  const [admissions, setAdmissions] = useState<(Admission & { patients: Patient, doctors: Doctor, rooms_beds: Bed })[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newAdmission, setNewAdmission] = useState({
    patient_id: '', bed_id: '', doctor_id: '', notes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    const [admRes, patRes, docRes, bedRes] = await Promise.all([
      supabase.from('admissions').select(`
        *,
        patients (*),
        doctors (*),
        rooms_beds (*)
      `).order('admission_date', { ascending: false }),
      supabase.from('patients').select('*'),
      supabase.from('doctors').select('*'),
      supabase.from('rooms_beds').select('*').eq('status', 'Vacant')
    ]);
    
    if (admRes.error) toast.error('Failed to load admissions');
    else setAdmissions(admRes.data as any || []);
    
    if (patRes.error) toast.error('Failed to load patients');
    else setPatients(patRes.data || []);
    
    if (docRes.error) toast.error('Failed to load doctors');
    else setDoctors(docRes.data || []);
    
    if (bedRes.error) toast.error('Failed to load beds');
    else setBeds(bedRes.data || []);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdmission.patient_id || !newAdmission.bed_id || !newAdmission.doctor_id) return;
    
    const { error } = await supabase.from('admissions').insert([{ 
      patient_id: parseInt(newAdmission.patient_id),
      bed_id: parseInt(newAdmission.bed_id),
      doctor_id: parseInt(newAdmission.doctor_id),
      notes: newAdmission.notes
    }]);

    if (error) {
      toast.error('Error admitting patient: ' + error.message);
    } else {
      toast.success('Patient admitted');
      setNewAdmission({ patient_id: '', bed_id: '', doctor_id: '', notes: '' });
      fetchData();
    }
  };

  const handleDischarge = async (admission_id: number) => {
    if (!confirm('Are you sure you want to discharge this patient? This will generate their final invoice.')) return;
    
    // Call the Postgres RPC function we created in schema.sql
    const { error } = await supabase.rpc('discharge_patient', { p_admission_id: admission_id });
    
    if (error) {
      toast.error('Discharge failed: ' + error.message);
    } else {
      toast.success('Patient discharged and invoice generated.');
      fetchData();
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Admissions & Beds</h2>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <h3 className="font-semibold mb-4">Admit Patient</h3>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Patient</label>
            <select className="border p-2 rounded w-full" value={newAdmission.patient_id} onChange={e => setNewAdmission({...newAdmission, patient_id: e.target.value})} required>
              <option value="">Select...</option>
              {patients.map(p => <option key={p.patient_id} value={p.patient_id}>{p.first_name} {p.last_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Attending Doctor</label>
            <select className="border p-2 rounded w-full" value={newAdmission.doctor_id} onChange={e => setNewAdmission({...newAdmission, doctor_id: e.target.value})} required>
              <option value="">Select...</option>
              {doctors.map(d => <option key={d.doctor_id} value={d.doctor_id}>Dr. {d.first_name} {d.last_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Available Bed</label>
            <select className="border p-2 rounded w-full" value={newAdmission.bed_id} onChange={e => setNewAdmission({...newAdmission, bed_id: e.target.value})} required>
              <option value="">Select...</option>
              {beds.map(b => <option key={b.bed_id} value={b.bed_id}>Room {b.room_no} ({b.ward_type}) - ${b.daily_rate}/day</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Notes (Optional)</label>
            <input type="text" className="border p-2 rounded w-full" value={newAdmission.notes} onChange={e => setNewAdmission({...newAdmission, notes: e.target.value})} />
          </div>
          <div className="md:col-span-4 flex justify-end mt-2">
            <button type="submit" className="bg-teal-700 text-white px-6 py-2 rounded hover:bg-teal-800">
              Admit Patient
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Patient</th>
              <th className="p-4">Room/Bed</th>
              <th className="p-4">Admitted On</th>
              <th className="p-4">Status</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-4 text-center">Loading...</td></tr>
            ) : admissions.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-center">No admissions found.</td></tr>
            ) : (
              admissions.map(adm => (
                <tr key={adm.admission_id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-4">{adm.admission_id}</td>
                  <td className="p-4 font-medium">{adm.patients?.first_name} {adm.patients?.last_name}</td>
                  <td className="p-4">Room {adm.rooms_beds?.room_no}</td>
                  <td className="p-4">{new Date(adm.admission_date).toLocaleString()}</td>
                  <td className="p-4">
                    {adm.discharge_date ? (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold">Discharged</span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">Active</span>
                    )}
                  </td>
                  <td className="p-4">
                    {!adm.discharge_date && (
                      <button onClick={() => handleDischarge(adm.admission_id)} className="text-red-600 hover:text-red-800 text-sm font-medium">
                        Discharge
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
