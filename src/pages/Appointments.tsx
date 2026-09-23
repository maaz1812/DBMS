import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import type { Database } from '../types/database.types';

type Appointment = Database['public']['Tables']['appointments']['Row'];
type Doctor = Database['public']['Tables']['doctors']['Row'];
type Patient = Database['public']['Tables']['patients']['Row'];

export default function Appointments() {
  const [appointments, setAppointments] = useState<(Appointment & { doctors: Doctor, patients: Patient })[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newAppt, setNewAppt] = useState({
    patient_id: '', doctor_id: '', appt_date: '', time_slot: ''
  });

  const fetchData = async () => {
    setLoading(true);
    const [appRes, docRes, patRes] = await Promise.all([
      supabase.from('appointments').select(`
        *,
        doctors (*),
        patients (*)
      `).order('appt_date', { ascending: false }),
      supabase.from('doctors').select('*'),
      supabase.from('patients').select('*')
    ]);
    
    if (appRes.error) toast.error('Failed to load appointments');
    else setAppointments(appRes.data as any || []);
    
    if (docRes.error) toast.error('Failed to load doctors');
    else setDoctors(docRes.data || []);
    
    if (patRes.error) toast.error('Failed to load patients');
    else setPatients(patRes.data || []);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppt.patient_id || !newAppt.doctor_id || !newAppt.appt_date || !newAppt.time_slot) return;
    
    const { error } = await supabase.from('appointments').insert([{ 
      patient_id: parseInt(newAppt.patient_id),
      doctor_id: parseInt(newAppt.doctor_id),
      appt_date: newAppt.appt_date,
      time_slot: newAppt.time_slot
    }]);

    if (error) {
      if (error.code === '23505' || error.message.includes('uq_doctor_slot')) {
        toast.error('This doctor is already booked for this date and time slot.');
      } else {
        toast.error('Error booking appointment: ' + error.message);
      }
    } else {
      toast.success('Appointment booked successfully');
      setNewAppt({ ...newAppt, time_slot: '' });
      fetchData();
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Appointments</h2>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <h3 className="font-semibold mb-4">Book Appointment</h3>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Patient</label>
            <select className="border p-2 rounded w-full" value={newAppt.patient_id} onChange={e => setNewAppt({...newAppt, patient_id: e.target.value})} required>
              <option value="">Select...</option>
              {patients.map(p => <option key={p.patient_id} value={p.patient_id}>{p.first_name} {p.last_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Doctor</label>
            <select className="border p-2 rounded w-full" value={newAppt.doctor_id} onChange={e => setNewAppt({...newAppt, doctor_id: e.target.value})} required>
              <option value="">Select...</option>
              {doctors.map(d => <option key={d.doctor_id} value={d.doctor_id}>Dr. {d.first_name} {d.last_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Date</label>
            <input type="date" className="border p-2 rounded w-full" value={newAppt.appt_date} onChange={e => setNewAppt({...newAppt, appt_date: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Time Slot</label>
            <select className="border p-2 rounded w-full" value={newAppt.time_slot} onChange={e => setNewAppt({...newAppt, time_slot: e.target.value})} required>
              <option value="">Select...</option>
              <option value="09:00 AM">09:00 AM</option>
              <option value="10:00 AM">10:00 AM</option>
              <option value="11:00 AM">11:00 AM</option>
              <option value="12:00 PM">12:00 PM</option>
              <option value="02:00 PM">02:00 PM</option>
              <option value="03:00 PM">03:00 PM</option>
              <option value="04:00 PM">04:00 PM</option>
            </select>
          </div>
          <div className="md:col-span-4 flex justify-end mt-2">
            <button type="submit" className="bg-teal-700 text-white px-6 py-2 rounded hover:bg-teal-800">
              Book Appointment
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
              <th className="p-4">Doctor</th>
              <th className="p-4">Date</th>
              <th className="p-4">Time Slot</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-4 text-center">Loading...</td></tr>
            ) : appointments.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-center">No appointments found.</td></tr>
            ) : (
              appointments.map(app => (
                <tr key={app.appointment_id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-4">{app.appointment_id}</td>
                  <td className="p-4 font-medium">{app.patients?.first_name} {app.patients?.last_name}</td>
                  <td className="p-4">Dr. {app.doctors?.first_name} {app.doctors?.last_name}</td>
                  <td className="p-4">{app.appt_date}</td>
                  <td className="p-4">{app.time_slot}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      app.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                      app.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {app.status}
                    </span>
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
