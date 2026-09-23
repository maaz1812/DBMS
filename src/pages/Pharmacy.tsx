import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import type { Database } from '../types/database.types';

type Medication = Database['public']['Tables']['medications']['Row'];
type Admission = Database['public']['Tables']['admissions']['Row'];
type Patient = Database['public']['Tables']['patients']['Row'];

export default function Pharmacy() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [admissions, setAdmissions] = useState<(Admission & { patients: Patient })[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newMed, setNewMed] = useState({ med_name: '', unit_price: '', stock_qty: '' });
  const [prescription, setPrescription] = useState({ admission_id: '', med_id: '', quantity: '', dosage_instructions: '' });

  const fetchData = async () => {
    setLoading(true);
    const [medRes, admRes] = await Promise.all([
      supabase.from('medications').select('*').order('med_name'),
      supabase.from('admissions').select('*, patients(*)').is('discharge_date', null)
    ]);
    
    if (medRes.error) toast.error('Failed to load medications');
    else setMedications(medRes.data || []);
    
    if (admRes.error) toast.error('Failed to load admissions');
    else setAdmissions(admRes.data as any || []);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddMed = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('medications').insert([{ 
      med_name: newMed.med_name,
      unit_price: parseFloat(newMed.unit_price),
      stock_qty: parseInt(newMed.stock_qty, 10)
    }]);

    if (error) toast.error('Error adding medication');
    else {
      toast.success('Medication added');
      setNewMed({ med_name: '', unit_price: '', stock_qty: '' });
      fetchData();
    }
  };

  const handlePrescribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('prescription_items').insert([{ 
      admission_id: parseInt(prescription.admission_id),
      med_id: parseInt(prescription.med_id),
      quantity: parseInt(prescription.quantity, 10),
      dosage_instructions: prescription.dosage_instructions
    }]);

    if (error) {
      if (error.message.includes('stock_qty')) {
        toast.error('Insufficient stock to fulfill prescription');
      } else {
        toast.error('Error prescribing medication: ' + error.message);
      }
    } else {
      toast.success('Medication prescribed');
      setPrescription({ admission_id: '', med_id: '', quantity: '', dosage_instructions: '' });
      fetchData(); // Refresh to show updated stock due to the trigger
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">Inventory</h2>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <h3 className="font-semibold mb-4">Add Medication</h3>
          <form onSubmit={handleAddMed} className="flex flex-col gap-4">
            <input type="text" className="border p-2 rounded" placeholder="Medication Name" value={newMed.med_name} onChange={e => setNewMed({...newMed, med_name: e.target.value})} required />
            <div className="flex gap-4">
              <input type="number" step="0.01" className="border p-2 rounded w-1/2" placeholder="Unit Price ($)" value={newMed.unit_price} onChange={e => setNewMed({...newMed, unit_price: e.target.value})} required />
              <input type="number" className="border p-2 rounded w-1/2" placeholder="Stock Qty" value={newMed.stock_qty} onChange={e => setNewMed({...newMed, stock_qty: e.target.value})} required />
            </div>
            <button type="submit" className="bg-teal-700 text-white px-4 py-2 rounded hover:bg-teal-800 self-end">
              Add Inventory
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Price</th>
                <th className="p-4">Stock</th>
              </tr>
            </thead>
            <tbody>
              {medications.map(m => (
                <tr key={m.med_id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-4 font-medium">{m.med_name}</td>
                  <td className="p-4">${m.unit_price}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${m.stock_qty < m.min_threshold ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {m.stock_qty}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-6">Prescriptions</h2>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <h3 className="font-semibold mb-4">Issue Prescription</h3>
          <form onSubmit={handlePrescribe} className="flex flex-col gap-4">
            <select className="border p-2 rounded" value={prescription.admission_id} onChange={e => setPrescription({...prescription, admission_id: e.target.value})} required>
              <option value="">Select Active Patient Admission...</option>
              {admissions.map(a => <option key={a.admission_id} value={a.admission_id}>{a.patients?.first_name} {a.patients?.last_name} (ID: {a.admission_id})</option>)}
            </select>
            <select className="border p-2 rounded" value={prescription.med_id} onChange={e => setPrescription({...prescription, med_id: e.target.value})} required>
              <option value="">Select Medication...</option>
              {medications.map(m => <option key={m.med_id} value={m.med_id}>{m.med_name} (${m.unit_price} / {m.stock_qty} in stock)</option>)}
            </select>
            <input type="number" className="border p-2 rounded" placeholder="Quantity" value={prescription.quantity} onChange={e => setPrescription({...prescription, quantity: e.target.value})} required />
            <input type="text" className="border p-2 rounded" placeholder="Dosage Instructions" value={prescription.dosage_instructions} onChange={e => setPrescription({...prescription, dosage_instructions: e.target.value})} />
            
            <button type="submit" className="bg-teal-700 text-white px-4 py-2 rounded hover:bg-teal-800 self-end">
              Issue Prescription
            </button>
          </form>
          <p className="text-sm text-gray-500 mt-4">Note: Prescribing will automatically deduct from inventory.</p>
        </div>
      </div>
    </div>
  );
}
