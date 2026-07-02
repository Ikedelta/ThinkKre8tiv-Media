'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { User, Lock, Phone, Briefcase, Save, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

const roleConfig: Record<string, { label: string; color: string }> = {
  super_admin: { label: 'Super Admin', color: 'bg-purple-100 text-purple-700' },
  admin: { label: 'Admin', color: 'bg-blue-100 text-blue-700' },
  manager: { label: 'Manager', color: 'bg-teal-100 text-teal-700' },
  staff: { label: 'Staff', color: 'bg-slate-100 text-slate-600' },
};

export default function ProfilePage() {
  const { data: session } = authClient.useSession();
  const [form, setForm] = useState({ name: '', phone: '', position: '' });
  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loaded, setLoaded] = useState(false);
  const [joinDate, setJoinDate] = useState('—');

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await fetch('/api/profile');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  useEffect(() => {
    if (profile && !loaded) {
      setForm({
        name: profile.name || '',
        phone: profile.phone || '',
        position: profile.position || '',
      });
      if (profile.created_at) {
        setJoinDate(
          new Date(profile.created_at).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        );
      }
      setLoaded(true);
    }
  }, [profile, loaded]);

  const updateMutation = useMutation({
    mutationFn: async (data: object) => {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => toast.success('Profile updated successfully!'),
    onError: () => toast.error('Failed to update profile'),
  });

  const passwordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const result = await authClient.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      if (result.error) throw new Error(result.error.message);
      return result;
    },
    onSuccess: () => {
      toast.success('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to change password'),
  });

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  const handlePasswordSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (pwForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    passwordMutation.mutate({
      currentPassword: pwForm.currentPassword,
      newPassword: pwForm.newPassword,
    });
  };

  const role = profile?.role || 'staff';
  const roleCfg = roleConfig[role] || roleConfig.staff;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-montserrat font-black text-[#001F3F]">
          My Profile
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Manage your personal information and password</p>
      </div>

      {/* Profile Card */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-5 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-2xl flex-shrink-0">
              {session?.user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div>
              <h2 className="font-montserrat font-black text-xl text-[#001F3F]">
                {profile?.name || session?.user?.name}
              </h2>
              <p className="text-slate-500 text-sm">{profile?.email || session?.user?.email}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge
                  className={cn(
                    'border-none font-bold text-[10px] uppercase tracking-wider',
                    roleCfg.color
                  )}
                >
                  {roleCfg.label}
                </Badge>
                {profile?.position && (
                  <span className="text-xs text-slate-400">· {profile.position}</span>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">
                Joined
              </p>
              <p className="text-sm font-bold text-slate-700">{joinDate}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">
                Role
              </p>
              <p className="text-sm font-bold text-slate-700">{roleCfg.label}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">
                Status
              </p>
              <p className="text-sm font-bold text-green-600">Active</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center gap-2 text-base font-montserrat font-bold text-[#001F3F]">
            <User size={16} className="text-blue-600" /> Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div>
              <label className="text-xs font-black text-slate-600 uppercase tracking-wider block mb-1.5">
                Full Name
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="text-xs font-black text-slate-600 uppercase tracking-wider block mb-1.5">
                <span className="flex items-center gap-1">
                  <Mail size={11} /> Email Address (read-only)
                </span>
              </label>
              <input
                value={profile?.email || session?.user?.email || ''}
                disabled
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 text-slate-400"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider block mb-1.5">
                  <span className="flex items-center gap-1">
                    <Phone size={11} /> Phone
                  </span>
                </label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="+233 20 000 0000"
                />
              </div>
              <div>
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider block mb-1.5">
                  <span className="flex items-center gap-1">
                    <Briefcase size={11} /> Position
                  </span>
                </label>
                <input
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Designer"
                />
              </div>
            </div>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 font-bold"
              disabled={updateMutation.isPending}
            >
              <Save size={16} className="mr-2" />
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center gap-2 text-base font-montserrat font-bold text-[#001F3F]">
            <Lock size={16} className="text-blue-600" /> Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handlePasswordSave} className="space-y-4">
            <div>
              <label className="text-xs font-black text-slate-600 uppercase tracking-wider block mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                required
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="••••••••"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider block mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Min 8 chars"
                />
              </div>
              <div>
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider block mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Repeat password"
                />
              </div>
            </div>
            <Button
              type="submit"
              variant="outline"
              className="font-bold border-2"
              disabled={passwordMutation.isPending}
            >
              <Lock size={16} className="mr-2" />
              {passwordMutation.isPending ? 'Changing...' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
