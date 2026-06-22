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
    key: 'manager',
    label: 'Manager',
    color: 'bg-blue-600 text-white',
    badge: 'bg-blue-50 text-blue-700',
    icon: Shield,
    description: 'Operational access — can create and manage records',
    permissions: [
      'Create invoices, quotations & receipts',
      'Manage customers and billing items',
      'View all reports',
      'Send SMS to customers',
      'Cannot approve invoices or receipts',
    ],
  },
  {
    key: 'staff',
    label: 'Staff',
    color: 'bg-slate-600 text-white',
    badge: 'bg-slate-100 text-slate-600',
    icon: UserCheck,
    description: 'Limited access — day-to-day operations only',
    permissions: [
      'View dashboard and metrics',
      'Manage customer listings',
      'View customer list',
      'Send SMS messages',
      'Cannot create invoices or approve anything',
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

      {/* Role hierarchy cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ROLES.map((role, idx) => {
          const count = users.filter((u) => u.role === role.key).length;
          const isExpanded = expandedRole === role.key;
          const Icon = role.icon;
          return (
            <Card key={role.key} className="border border-slate-100 shadow-none overflow-hidden">
              <CardContent className="p-0">
                <div className={cn('px-5 py-4', role.color)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Icon size={18} />
                      <div>
                        <p className="font-black text-base">{role.label}</p>
                        <p className="text-[10px] opacity-75 font-semibold uppercase tracking-widest">
                          {idx === 0
                            ? 'Highest Access'
                            : idx === 1
                              ? 'Operational'
                              : 'Limited Access'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black">{count}</p>
                      <p className="text-[10px] opacity-75 font-semibold">
                        {count === 1 ? 'user' : 'users'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="px-5 py-3 bg-white">
                  <p className="text-xs text-slate-500 font-medium mb-2">{role.description}</p>
                  <button
                    onClick={() => setExpandedRole(isExpanded ? null : role.key)}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp size={12} /> Hide permissions
                      </>
                    ) : (
                      <>
                        <ChevronDown size={12} /> View permissions
                      </>
                    )}
                  </button>
                  {isExpanded && (
                    <ul className="mt-3 space-y-1.5">
                      {role.permissions.map((p) => (
                        <li
                          key={p}
                          className="flex items-start gap-2 text-xs text-slate-600 font-medium"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0 mt-1" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Users Table */}
      <Card className="border border-slate-100 shadow-none overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#001F3F]">All Staff Members</h2>
          <p className="text-xs font-medium text-slate-400">
            {activeCount} active · {users.length - activeCount} inactive
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
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
                        <Badge
                          className={cn(
                            'border-none text-[10px] font-bold',
                            user.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-600'
                          )}
                        >
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(user)}
                            className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() =>
                              toggleMutation.mutate({
                                id: user.id,
                                is_active: !user.is_active,
                                name: user.name,
                              })
                            }
                            className={cn(
                              'p-1.5 rounded-lg transition-colors',
                              user.is_active
                                ? 'hover:bg-red-50 text-slate-400 hover:text-red-500'
                                : 'hover:bg-green-50 text-slate-400 hover:text-green-600'
                            )}
                            title={user.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {user.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
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
      </Card>

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
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
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                  placeholder="kofi@thinkkre8tive.com"
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
                    <option value="manager">Manager</option>
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

              <div className="flex gap-3 pt-2">
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
