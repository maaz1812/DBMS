import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import type { Database } from '../types/database.types';

type Invoice = Database['public']['Tables']['invoices']['Row'];
type Admission = Database['public']['Tables']['admissions']['Row'];
type Patient = Database['public']['Tables']['patients']['Row'];

export default function Billing() {
  const [invoices, setInvoices] = useState<(Invoice & { admissions: Admission & { patients: Patient } })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('invoices').select(`
      *,
      admissions (
        *,
        patients (*)
      )
    `).order('created_at', { ascending: false });
    
    if (error) toast.error('Failed to load invoices');
    else setInvoices(data as any || []);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleMarkPaid = async (invoice_id: number) => {
    const { error } = await supabase.from('invoices').update({ status: 'Paid' }).eq('invoice_id', invoice_id);
    if (error) {
      toast.error('Failed to update invoice');
    } else {
      toast.success('Invoice marked as Paid');
      fetchInvoices();
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Billing & Invoices</h2>
      <p className="text-gray-600 mb-6">Invoices are automatically generated when a patient is discharged.</p>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4">Inv ID</th>
              <th className="p-4">Patient</th>
              <th className="p-4">Date Generated</th>
              <th className="p-4">Breakdown</th>
              <th className="p-4">Total</th>
              <th className="p-4">Status</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-4 text-center">Loading...</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan={7} className="p-4 text-center">No invoices found.</td></tr>
            ) : (
              invoices.map(inv => (
                <tr key={inv.invoice_id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-4">#{inv.invoice_id}</td>
                  <td className="p-4 font-medium">
                    {inv.admissions?.patients?.first_name} {inv.admissions?.patients?.last_name}
                  </td>
                  <td className="p-4">{new Date(inv.created_at).toLocaleDateString()}</td>
                  <td className="p-4 text-sm text-gray-500">
                    Room: ${inv.room_charge}<br/>
                    Doctor: ${inv.doctor_charge}<br/>
                    Pharm: ${inv.pharmacy_charge}
                  </td>
                  <td className="p-4 font-bold text-teal-800">${inv.total_amount}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      inv.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-4">
                    {inv.status === 'Pending' && (
                      <button onClick={() => handleMarkPaid(inv.invoice_id)} className="text-teal-600 hover:text-teal-800 text-sm font-medium">
                        Mark Paid
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
