'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  Search,
  Building2,
  Mail,
  FilePlus,
  MoreVertical,
  Edit2,
  Trash2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Client } from '@/types/database';
import { ClientModal } from '@/components/ClientModal';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured, getCurrencySymbol } from '@/lib/utils';

interface ClientsListProps {
  initialClients?: Client[];
  userId?: string | null;
}

export function ClientsList({ initialClients = [], userId }: ClientsListProps) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const supabaseConfigured = isSupabaseConfigured();

  // Load demo clients from localStorage if not configured
  useEffect(() => {
    if (!supabaseConfigured && typeof window !== 'undefined') {
      const stored = localStorage.getItem('duenudge_demo_clients');
      if (stored) {
        try {
          setClients(JSON.parse(stored));
        } catch {
          // ignore
        }
      } else {
        // Initialize default mock clients for instant interactive preview
        const defaultClients: Client[] = [
          {
            id: 'client_1',
            user_id: 'demo_user',
            name: 'Sarah Connor',
            email: 'sarah@skynet-solutions.com',
            company: 'Cyberdyne Systems Inc.',
            currency: 'USD',
            default_payment_terms: 14,
            address: '100 Industrial Parkway, Los Angeles, CA',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'client_2',
            user_id: 'demo_user',
            name: 'David Miller',
            email: 'david.miller@fintechlabs.io',
            company: 'Fintech Labs UK',
            currency: 'GBP',
            default_payment_terms: 30,
            address: '45 Cannon Street, London, UK',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'client_3',
            user_id: 'demo_user',
            name: 'Aarav Patel',
            email: 'aarav@cloudscale.tech',
            company: 'CloudScale Technologies',
            currency: 'USD',
            default_payment_terms: 7,
            address: 'Bengaluru Tech Park, India',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
        localStorage.setItem('duenudge_demo_clients', JSON.stringify(defaultClients));
        setClients(defaultClients);
      }
    }
  }, [supabaseConfigured]);

  const handleSaved = (savedClient: Client) => {
    setClients((prev) => {
      const exists = prev.some((c) => c.id === savedClient.id);
      if (exists) {
        return prev.map((c) => (c.id === savedClient.id ? savedClient : c));
      }
      return [savedClient, ...prev];
    });
  };

  const handleDelete = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return;

    if (!supabaseConfigured) {
      const updated = clients.filter((c) => c.id !== clientId);
      setClients(updated);
      localStorage.setItem('duenudge_demo_clients', JSON.stringify(updated));
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.from('clients').delete().eq('id', clientId);
      if (error) throw error;
      setClients((prev) => prev.filter((c) => c.id !== clientId));
    } catch (err) {
      console.error('Error deleting client:', err);
      alert('Failed to delete client.');
    }
  };

  const filteredClients = clients.filter((client) => {
    const q = searchQuery.toLowerCase();
    return (
      client.name.toLowerCase().includes(q) ||
      client.email.toLowerCase().includes(q) ||
      (client.company && client.company.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              Phase 2
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {clients.length} {clients.length === 1 ? 'Client' : 'Clients'} Registered
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1.5">
            Client Directory
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage your clients, their default payment terms, billing emails, and currency settings.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setClientToEdit(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm shadow-indigo-100 hover:shadow-indigo-200 transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Add New Client</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, company, or email..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
          />
        </div>

        {clients.length > 0 && (
          <div className="text-xs text-slate-500 self-end sm:self-center">
            Showing {filteredClients.length} of {clients.length} clients
          </div>
        )}
      </div>

      {/* Clients Table / Cards */}
      <div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredClients.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {searchQuery ? 'No matching clients found' : 'No clients added yet'}
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? 'Try adjusting your search query or clear the filter.'
                : 'Add your first client to start creating professional invoices with automated due-date reminders.'}
            </p>
            <div className="mt-5">
              <button
                type="button"
                onClick={() => {
                  setClientToEdit(null);
                  setModalOpen(true);
                }}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Your First Client
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <tr>
                  <th className="py-3.5 px-6">Client / Company</th>
                  <th className="py-3.5 px-6">Billing Email</th>
                  <th className="py-3.5 px-6">Currency</th>
                  <th className="py-3.5 px-6">Payment Terms</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClients.map((client) => {
                  const initials = client.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <tr key={client.id} className="hover:bg-slate-50/60 transition group">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white font-bold text-xs flex items-center justify-center shadow-xs flex-shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition">
                              {client.name}
                            </div>
                            {client.company && (
                              <div className="text-xs text-slate-500 flex items-center mt-0.5">
                                <Building2 className="w-3 h-3 mr-1 text-slate-400" />
                                <span>{client.company}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-slate-600">
                        <div className="flex items-center text-xs">
                          <Mail className="w-3.5 h-3.5 mr-1.5 text-slate-400 flex-shrink-0" />
                          <span className="font-mono">{client.email}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {client.currency || 'USD'} ({getCurrencySymbol(client.currency || 'USD')})
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <Clock className="w-3 h-3 mr-1 text-emerald-600" />
                          Net {client.default_payment_terms || 14} Days
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            href={`/invoices/new?clientId=${client.id}`}
                            className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition"
                            title="Create invoice for this client"
                          >
                            <FilePlus className="w-3.5 h-3.5 mr-1" />
                            <span>Invoice</span>
                          </Link>

                          <button
                            type="button"
                            onClick={() => {
                              setClientToEdit(client);
                              setModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                            title="Edit Client"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(client.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                            title="Delete Client"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <ClientModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        clientToEdit={clientToEdit}
        userId={userId}
      />
    </div>
  );
}
