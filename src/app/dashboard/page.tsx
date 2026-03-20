'use client';
import { useEffect, useState } from 'react';
import { MapPin, Calendar, Users, UserCheck, UserX, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { adminApi, amenitiesApi, eventsApi } from '@/lib/auth/api';

interface Stats { total: number; admins: number; unverified: number; inactive: number; }

export default function DashboardPage() {
  const { token } = useAuth();
  const [stats,       setStats]       = useState<Stats | null>(null);
  const [amenityCount, setAmenityCount] = useState<number | null>(null);
  const [eventCount,   setEventCount]   = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    adminApi.users.stats(token).then(setStats).catch(() => {});
    amenitiesApi.list({ limit: '1' }).then(r => setAmenityCount(r.total)).catch(() => {});
    eventsApi.list({ limit: '1', upcoming: 'true' }).then(r => setEventCount(r.total)).catch(() => {});
  }, [token]);

  const cards = [
    { label: 'Total Amenities',  value: amenityCount, icon: MapPin,      color: 'text-blue-600',  bg: 'bg-blue-50' },
    { label: 'Upcoming Events',  value: eventCount,   icon: Calendar,    color: 'text-violet-600',bg: 'bg-violet-50' },
    { label: 'Total Users',      value: stats?.total, icon: Users,       color: 'text-emerald-600',bg: 'bg-emerald-50' },
    { label: 'Admins',           value: stats?.admins,icon: ShieldCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Unverified',       value: stats?.unverified, icon: UserX,  color: 'text-orange-600',bg: 'bg-orange-50' },
    { label: 'Inactive Users',   value: stats?.inactive,   icon: UserCheck, color: 'text-zinc-600', bg: 'bg-zinc-100' },
  ];

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-xl font-semibold text-zinc-900 mb-1">Overview</h1>
      <p className="text-sm text-zinc-400 mb-6">Jewish Denver admin dashboard</p>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-zinc-100 p-5 flex items-start gap-4">
            <div className={`p-2.5 rounded-lg ${bg}`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900">
                {value === null || value === undefined ? <span className="text-zinc-300 text-lg">—</span> : value}
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
