import { useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import TableCard from '../components/TableCard';
import DashboardAdmin from '../components/DashboardAdmin';
import DataAdmin from '../components/DataAdmin';

export default function Dashboard({ onSignOut }) {
  const [page, setPage] = useState('dashboard');

  return (
    <MainLayout onSignOut={onSignOut} activePage={page} onNavigate={setPage}>
      <div className="space-y-6">
        {page === 'dashboard' && <DashboardAdmin />}
        {page === 'data-pegawai' && <TableCard />}
        {page === 'tambah-pegawai' && (
          <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100">Tambah Pegawai (placeholder)</div>
        )}
        {page === 'data-admin' && <DataAdmin />}
        {page === 'unit-kerja' && (
          <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100">Unit Kerja (placeholder)</div>
        )}
      </div>
    </MainLayout>
  );
}
