'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  UserCheck,
  UserX,
  Shield,
  Edit2,
  Mail,
  Phone,
  Crown,
  ChevronDown,
  ChevronUp,
  X,
  Eye,
  EyeOff,
  Key,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface StaffUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  position: string | null;
  is_active: boolean;
  created_at: string;
}

const ROLES = [
  {
    key: 'admin',
    label: 'Admin',
    color: 'bg-[#001F3F] text-white',
    badge: 'bg-[#001F3F]/10 text-[#001F3F]',
    icon: Crown,
    description: 'Full system access — highest privilege level',
    permissions: [
      'Approve & reject invoices and receipts',
      'Add and manage all system users',
      'Configure system settings',
      'Access all billing & financial data',
      'Manage website CMS',
      'Delete any record',
    ],
  },
  {
    key: 'staff',
    label: 'Staff',
    color: 'bg-blue-600 text-white',
    badge: 'bg-blue-50 text-blue-700',
    icon: UserCheck,
    description: 'Operational access — can create records but requires approval',
    permissions: [
      'Create invoices and receipts',
      'Cannot approve invoices or receipts',
      'Manage customers and billing items',
      'View dashboard and metrics',
      'Send SMS to customers',
    ],
  },
];

const roleMap = Object.fromEntries(ROLES.map((r) => [r.key, r]));

const defaultForm = { name: '', email: '', password: '', role: 'staff', phone: '', position: '' };

export default function UsersPage() {
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<StaffUser | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [showPassword, setShowPassword] = useState(false);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery<StaffUser[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: object) => {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User added successfully!');
      closeForm();
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to create user'),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: object) => {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated!');
      closeForm();
    },
    onError: () => toast.error('Failed to update'),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({
      id,
      is_active,
      name,
    }: {
      id: string;
      is_active: boolean;
      name: string;
    }) => {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active, name }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User status updated');
    },
    onError: () => toast.error('Failed'),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send reset link');
      return data;
    },
    onSuccess: () => {
      toast.success('Password reset link sent via SMS!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send reset link');
    },
  });

  const closeForm = () => {
    setShowForm(false);
    setEditUser(null);
    setForm(defaultForm);
    setShowPassword(false);
  };
  const openEdit = (user: StaffUser) => {
    setEditUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      phone: user.phone || '',
      position: user.position || '',
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser && form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (editUser) {
      updateMutation.mutate({ id: editUser.id, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  const activeCount = users.filter((u) => u.is_active).length;

  const labelClass = 'block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2';
  const inputClass =
    'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#001F3F] tracking-tight">Users & Roles</h1>
          <p className="text-slate-500 mt-0.5 text-sm font-medium">
            Manage staff accounts and their access levels
          </p>
        </div>
        <Button
          onClick={() => {
            setEditUser(null);
            setForm(defaultForm);
            setShowForm(true);
          }}
          className="bg-[#001F3F] hover:bg-[#002a52] font-bold w-full sm:w-auto"
        >
          <Plus size={16} className="mr-2" /> Add User
        </Button>
      </div>



      {/* Users Table */}
      <Card className="border border-slate-100 shadow-none overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#001F3F]">All Staff Members</h2>
          <p className="text-xs font-medium text-slate-400">
            {activeCount} active · {users.length - activeCount} inactive
          </p>
        </div>
        <div className="overflow-hidden">
          <table className="w-full min-w-full hidden md:table">
            <thead className="bg-slate-50">
              <tr>
                {['Name', 'Email / Phone', 'Role', 'Position', 'Status', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                Array(4)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-5 py-4">
                        <div className="h-4 bg-slate-100 rounded" />
                      </td>
                    </tr>
                  ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <p className="text-sm font-semibold text-slate-400">No users yet</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Click "Add User" to create the first staff member
                    </p>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const roleCfg = roleMap[user.role];
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0',
                              roleCfg ? roleCfg.color : 'bg-slate-500 text-white'
                            )}
                          >
                            {user.name?.[0]?.toUpperCase()}
                          </div>
                          <p className="font-bold text-[#001F3F] text-sm">{user.name}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium mb-0.5">
                          <Mail size={11} className="text-slate-400" /> {user.email}
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                            <Phone size={11} className="text-slate-400" /> {user.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {roleCfg ? (
                          <Badge
                            className={cn(
                              'border-none text-[10px] font-bold uppercase tracking-wider',
                              roleCfg.badge
                            )}
                          >
                            {roleCfg.label}
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-400">{user.role}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-500 font-medium">
                        {user.position || '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() =>
                            toggleMutation.mutate({
                              id: user.id,
                              is_active: !user.is_active,
                              name: user.name,
                            })
                          }
                          className={cn(
                            'px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-colors',
                            user.is_active
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                          )}
                        >
                          {user.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (confirm(`Send a password reset SMS to ${user.name}?`)) {
                                resetPasswordMutation.mutate(user.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Reset Password via SMS"
                            disabled={resetPasswordMutation.isPending}
                          >
                            <Key size={14} />
                          </button>
                          <button
                            onClick={() => openEdit(user)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit User"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Remove User"
                          >
                            <UserX size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile view - Cards */}
        <div className="md:hidden divide-y divide-slate-100">
          {isLoading ? (
            <div className="p-5 text-center text-slate-500">Loading...</div>
          ) : users.length === 0 ? (
            <div className="p-5 text-center text-slate-500">No users found</div>
          ) : (
            users.map((user) => {
              const roleCfg = roleMap[user.role];
              return (
                <div key={user.id} className="p-4 space-y-4 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg flex-shrink-0',
                          roleCfg ? roleCfg.color : 'bg-slate-500 text-white'
                        )}
                      >
                        {user.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-[#001F3F]">{user.name}</p>
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-0.5">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => openEdit(user)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-slate-400 font-medium uppercase tracking-wider text-[9px] mb-1">Role</p>
                      {roleCfg ? (
                        <Badge
                          className={cn(
                            'border-none text-[9px] font-bold uppercase tracking-wider',
                            roleCfg.badge
                          )}
                        >
                          {roleCfg.label}
                        </Badge>
                      ) : (
                        <span className="text-slate-500">{user.role}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium uppercase tracking-wider text-[9px] mb-1">Status</p>
                      <button
                        onClick={() =>
                          toggleMutation.mutate({
                            id: user.id,
                            is_active: !user.is_active,
                            name: user.name,
                          })
                        }
                        className={cn(
                          'px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border transition-colors',
                          user.is_active
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        )}
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                    <div className="col-span-2 mt-1">
                      <p className="text-slate-400 font-medium uppercase tracking-wider text-[9px] mb-1">Position / Phone</p>
                      <p className="text-slate-700">{user.position || 'No title'} • {user.phone || 'No phone'}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[95vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="font-black text-lg text-[#001F3F]">
                {editUser ? 'Edit User' : 'Add New User'}
              </h2>
              <button
                onClick={closeForm}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto overscroll-contain">
              <div>
                <label className={labelClass}>Full Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. Kofi Mensah"
                />
              </div>
              <div>
                <label className={labelClass}>Email *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  disabled={!!editUser}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={cn(inputClass, editUser && 'bg-slate-50 text-slate-400')}
                  placeholder="kofi@thinkkre8tivmedia.com"
                />
              </div>
              {!editUser && (
                <div>
                  <label className={labelClass}>Password *</label>
                  <div className="relative">
                    <input
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className={`${inputClass} pr-10`}
                      placeholder="Minimum 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Role *</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className={inputClass}
                  >
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Position</label>
                  <input
                    value={form.position}
                    onChange={(e) => setForm({ ...form, position: e.target.value })}
                    className={inputClass}
                    placeholder="e.g. Designer"
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={inputClass}
                  placeholder="+233 20 000 0000"
                />
              </div>

              {/* Role info */}
              {form.role && roleMap[form.role] && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs font-bold text-slate-600 mb-1">
                    {roleMap[form.role].description}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {form.role === 'admin'
                      ? 'This user will be able to approve invoices, receipts, and add other users.'
                      : form.role === 'manager'
                        ? 'This user can create billing records but cannot approve them.'
                        : 'Limited operational access. Cannot create or approve billing records.'}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-slate-100 mt-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeForm}
                  className="flex-1 font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#001F3F] hover:bg-[#002a52] font-bold"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editUser
                      ? 'Update User'
                      : 'Add User'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
