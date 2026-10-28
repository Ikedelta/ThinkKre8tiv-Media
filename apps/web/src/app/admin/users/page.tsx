'use client';

import { useConfirm } from '@/components/providers/ConfirmProvider';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authClient } from '@/lib/auth-client';
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

const defaultForm = { name: '', email: '', password: '', role: 'staff', phone: '', position: '', is_active: true };

export default function UsersPage() {
  const { confirm } = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<StaffUser | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [showPassword, setShowPassword] = useState(false);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: session } = authClient.useSession();
  const currentUserId = (session?.user as any)?.id;
  const isAdmin = (session?.user as any)?.role === 'admin';

  if (session && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <Shield size={64} className="text-slate-300 mb-4" />
        <h1 className="text-2xl font-bold text-slate-800">Access Denied</h1>
        <p className="text-slate-500 mt-2">Only administrators can manage users and roles.</p>
      </div>
    );
  }

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
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      if (data?.emailStatus?.sent) {
        toast.success('User added and invitation email sent!');
      } else {
        toast.success('User added successfully! (SMTP not configured or email pending)');
      }
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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      if (variables.is_active) {
        toast.success(`${variables.name}'s account has been reactivated`);
      } else {
        toast.info(`${variables.name}'s account has been deactivated. Their active sessions were ended.`);
      }
    },
    onError: () => toast.error('Failed to update user status'),
  });

  const handleToggleStatus = async (user: StaffUser) => {
    if (user.id === currentUserId) {
      toast.error('You cannot deactivate your own account.');
      return;
    }

    const action = user.is_active ? 'deactivate' : 'reactivate';
    const confirmed = await confirm({
      title: `${user.is_active ? 'Deactivate' : 'Reactivate'} Account`,
      message: user.is_active
        ? `Are you sure you want to soft deactivate ${user.name}'s account? They will be signed out immediately and blocked from logging in until reactivated.`
        : `Reactivate ${user.name}'s account? They will be allowed to log into the portal again.`,
      variant: user.is_active ? 'destructive' : 'default',
    });

    if (confirmed) {
      toggleMutation.mutate({
        id: user.id,
        is_active: !user.is_active,
        name: user.name,
      });
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/users?id=${userId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully');
    },
    onError: () => toast.error('Failed to delete user'),
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
      is_active: user.is_active,
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
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-none overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">All Staff Members</h2>
          <p className="text-xs font-medium text-slate-400">
            {activeCount} active · {users.length - activeCount} inactive
          </p>
        </div>
        <div className="overflow-hidden">
          <table className="w-full min-w-full hidden md:table">
            <thead className="bg-slate-50 dark:bg-slate-800/60">
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
                    <tr key={user.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
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
                          <p className="font-bold text-slate-900 dark:text-white text-sm">{user.name}</p>
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(user);
                          }}
                          disabled={toggleMutation.isPending || user.id === currentUserId}
                          title={user.id === currentUserId ? 'You cannot deactivate your own account' : user.is_active ? 'Click to deactivate account' : 'Click to reactivate account'}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all',
                            user.is_active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:border-rose-300',
                            user.id === currentUserId && 'opacity-60 cursor-not-allowed'
                          )}
                        >
                          <span
                            className={cn(
                              'w-1.5 h-1.5 rounded-full',
                              user.is_active ? 'bg-emerald-500' : 'bg-rose-500'
                            )}
                          />
                          {user.is_active ? 'Active' : 'Deactivated'}
                        </button>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStatus(user);
                            }}
                            disabled={toggleMutation.isPending || user.id === currentUserId}
                            title={user.id === currentUserId ? 'You cannot deactivate your own account' : user.is_active ? 'Soft Deactivate Account' : 'Reactivate Account'}
                            className={cn(
                              'p-2 rounded-md transition-colors shadow-sm font-medium',
                              user.is_active
                                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
                              user.id === currentUserId && 'opacity-40 cursor-not-allowed'
                            )}
                          >
                            {user.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                          </button>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (await confirm({ title: 'Confirmation', message: `Send a password reset SMS to ${user.name}?`, variant: 'destructive' })) {
                                resetPasswordMutation.mutate(user.id);
                              }
                            }}
                            className="p-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-md transition-colors shadow-sm font-medium"
                            title="Reset Password via SMS"
                            disabled={resetPasswordMutation.isPending}
                          >
                            <Key size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(user);
                            }}
                            className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors shadow-sm font-medium"
                            title="Edit User"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (await confirm({ title: 'Confirmation', message: `Are you sure you want to completely delete ${user.name}? This action cannot be undone. Consider deactivating instead if you want to keep their records intact.`, variant: 'destructive' })) {
                                deleteMutation.mutate(user.id);
                              }
                            }}
                            disabled={deleteMutation.isPending || user.id === currentUserId}
                            className={cn(
                              "p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-md transition-colors shadow-sm font-medium",
                              user.id === currentUserId && "opacity-40 cursor-not-allowed"
                            )}
                            title={user.id === currentUserId ? "Cannot delete own account" : "Hard Delete User"}
                          >
                            <X size={14} />
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
                <div key={user.id} className="p-4 space-y-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
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
                        <p className="font-bold text-slate-900 dark:text-white">{user.name}</p>
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(user);
                        }}
                        className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors shadow-sm font-medium"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (await confirm({ title: 'Confirmation', message: `Are you sure you want to completely delete ${user.name}? This action cannot be undone.`, variant: 'destructive' })) {
                            deleteMutation.mutate(user.id);
                          }
                        }}
                        className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-md transition-colors shadow-sm font-medium"
                        disabled={deleteMutation.isPending}
                      >
                        <UserX size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
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
                        onClick={() => handleToggleStatus(user)}
                        disabled={toggleMutation.isPending || user.id === currentUserId}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border transition-colors',
                          user.is_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200',
                          user.id === currentUserId && 'opacity-60 cursor-not-allowed'
                        )}
                      >
                        <span
                          className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            user.is_active ? 'bg-emerald-500' : 'bg-rose-500'
                          )}
                        />
                        {user.is_active ? 'Active' : 'Deactivated'}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              {/* Account Status / Soft Deactivation Toggle */}
              {editUser && (
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Account Status</p>
                    <p className="text-[11px] text-slate-500">
                      {form.is_active
                        ? 'Account is active. Staff can log in.'
                        : 'Soft deactivated. Staff cannot log in.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={editUser.id === currentUserId}
                    onClick={() => {
                      if (editUser.id === currentUserId) return;
                      setForm({ ...form, is_active: !form.is_active });
                    }}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-sm',
                      form.is_active
                        ? 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600'
                        : 'bg-rose-500 text-white border-rose-600 hover:bg-rose-600',
                      editUser.id === currentUserId && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {form.is_active ? 'Active' : 'Deactivated'}
                  </button>
                </div>
              )}

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
