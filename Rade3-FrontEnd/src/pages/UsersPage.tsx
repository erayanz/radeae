import { useState, useEffect, useCallback } from 'react';
import { UserPlus, UserCheck, UserX } from 'lucide-react';
import Container from '../components/Container';
import { usersApi, AssignableUser } from '../api/usersApi';
import { sitesApi } from '../api/sitesApi';
import { Site } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const UsersPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'admin';

  const [users, setUsers] = useState<AssignableUser[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'operator' | 'admin'>('operator');
  const [newSiteIds, setNewSiteIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const data = await usersApi.getUsers();
      setUsers(data);
    } catch {
      toast.error('فشل جلب المستخدمين');
    }
  }, [toast]);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([usersApi.getUsers(), sitesApi.getSites()])
      .then(([usersData, sitesData]) => {
        setUsers(usersData);
        setSites(sitesData);
      })
      .catch(() => toast.error('فشل جلب البيانات'))
      .finally(() => setLoading(false));
  }, [isAdmin, toast]);

  const toggleSite = (siteId: string) => {
    setNewSiteIds(prev => prev.includes(siteId) ? prev.filter(id => id !== siteId) : [...prev, siteId]);
  };

  const handleCreate = async () => {
    if (!newUsername.trim() || !newPassword.trim()) {
      toast.error('اسم المستخدم وكلمة المرور مطلوبان');
      return;
    }
    setCreating(true);
    try {
      await usersApi.createUser(newUsername.trim(), newPassword, newRole, newSiteIds);
      toast.success('تم إنشاء المستخدم بنجاح');
      setNewUsername('');
      setNewPassword('');
      setNewRole('operator');
      setNewSiteIds([]);
      await loadUsers();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'فشل إنشاء المستخدم');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (target: AssignableUser) => {
    if (pendingIds.has(target.id)) return;
    setPendingIds(prev => new Set(prev).add(target.id));
    try {
      await usersApi.setUserActive(target.id, !target.active);
      toast.success(target.active ? 'تم تعطيل المستخدم' : 'تم تفعيل المستخدم');
      await loadUsers();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'فشل تحديث حالة المستخدم');
    } finally {
      setPendingIds(prev => {
        const next = new Set(prev);
        next.delete(target.id);
        return next;
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-center text-white/50 py-20">
        هذا القسم متاح للمدير فقط
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">إدارة المستخدمين</h1>

      <Container>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-brand-goldLight" />
          إضافة مستخدم جديد
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-white/50 text-xs">اسم المستخدم</label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="bg-brand-navyLight text-white px-3 py-2 rounded-lg border border-brand-graphite focus:border-brand-gold focus:outline-none text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-white/50 text-xs">كلمة المرور</label>
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-brand-navyLight text-white px-3 py-2 rounded-lg border border-brand-graphite focus:border-brand-gold focus:outline-none text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-white/50 text-xs">الصلاحية</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as 'operator' | 'admin')}
              className="bg-brand-navyLight text-white px-3 py-2 rounded-lg border border-brand-graphite focus:border-brand-gold focus:outline-none text-sm"
            >
              <option value="operator">مشغّل (operator)</option>
              <option value="admin">مدير (admin)</option>
            </select>
          </div>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex items-center justify-center gap-2 bg-brand-gold hover:bg-brand-goldLight disabled:opacity-50 text-brand-deepNavy font-semibold px-4 py-2 rounded-lg transition-all text-sm"
          >
            <UserPlus className="w-4 h-4" />
            {creating ? 'جاري الإنشاء...' : 'إنشاء'}
          </button>
        </div>

        {sites.length > 0 && (
          <div className="mt-4">
            <label className="text-white/50 text-xs block mb-2">المواقع المتاحة (اتركها فارغة لمدير عام بصلاحية كاملة)</label>
            <div className="flex flex-wrap gap-2">
              {sites.map(site => (
                <button
                  key={site.id}
                  type="button"
                  onClick={() => toggleSite(site.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                    newSiteIds.includes(site.id)
                      ? 'bg-brand-gold/20 border-brand-gold text-brand-goldLight'
                      : 'bg-brand-navyLight border-brand-graphite text-white/50 hover:text-white/80'
                  }`}
                >
                  {site.nameAr}
                </button>
              ))}
            </div>
          </div>
        )}
      </Container>

      <Container>
        <h2 className="text-lg font-bold text-white mb-4">المستخدمون ({users.length})</h2>
        {loading ? (
          <div className="text-center text-white/50 py-8">جاري التحميل...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b border-brand-gold/15">
                  <th className="px-4 py-3 text-brand-steel font-medium text-sm uppercase tracking-wide">اسم المستخدم</th>
                  <th className="px-4 py-3 text-brand-steel font-medium text-sm uppercase tracking-wide">الصلاحية</th>
                  <th className="px-4 py-3 text-brand-steel font-medium text-sm uppercase tracking-wide">الحالة</th>
                  <th className="px-4 py-3 text-brand-steel font-medium text-sm uppercase tracking-wide">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, index) => (
                  <tr key={u.id} className={index % 2 === 0 ? 'bg-brand-navyLight/40' : 'bg-transparent'}>
                    <td className="px-4 py-3 text-white/90 font-tactical">{u.username}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        u.role === 'admin'
                          ? 'bg-brand-gold/20 text-brand-goldLight border border-brand-gold/40'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      }`}>
                        {u.role === 'admin' ? 'مدير' : 'مشغّل'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        u.active
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-red-500/20 text-red-300 border border-red-500/40'
                      }`}>
                        {u.active ? 'نشط' : 'معطل'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleActive(u)}
                        disabled={pendingIds.has(u.id) || (user?.username === u.username && u.active)}
                        title={user?.username === u.username && u.active ? 'لا يمكنك تعطيل حسابك الخاص' : ''}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                          u.active
                            ? 'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                        }`}
                      >
                        {u.active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        {u.active ? 'تعطيل' : 'تفعيل'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Container>
    </div>
  );
};

export default UsersPage;
