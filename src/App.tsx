import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  GraduationCap, 
  Users, 
  Search, 
  Calendar, 
  MapPin, 
  CreditCard,
  Info,
  CheckCircle2,
  Clock,
  CalendarDays,
  Edit3,
  Save,
  X,
  LogIn,
  LogOut,
  AlertCircle
} from 'lucide-react';
import { trainingClassesData } from './data';
import { TrainingClass, ClassCategory } from './types';
import { db, auth, loginWithGoogle, logout } from './firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  setDoc, 
  getDoc,
  Timestamp 
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<TrainingClass | null>(null);
  const [classes, setClasses] = useState<TrainingClass[]>(trainingClassesData);
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<TrainingClass>>({});
  const [error, setError] = useState<string | null>(null);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Sync
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'classes'), (snapshot) => {
      const dbClasses = snapshot.docs.reduce((acc, doc) => {
        acc[doc.id] = doc.data() as TrainingClass;
        return acc;
      }, {} as Record<string, TrainingClass>);

      const merged = trainingClassesData.map(c => ({
        ...c,
        ...(dbClasses[c.id] || {})
      }));
      setClasses(merged);
    }, (err) => {
      console.error("Firestore error:", err);
      setError("Không thể kết nối với cơ sở dữ liệu.");
    });
    return () => unsubscribe();
  }, []);

  const stats = useMemo(() => {
    const totalClasses = classes.reduce((acc, curr) => acc + curr.numClasses, 0);
    const totalStudents = classes.reduce((acc, curr) => acc + (curr.actualStudents || curr.numStudents), 0);
    const fostering = classes.length;
    return { totalClasses, totalStudents, fostering };
  }, [classes]);

  const filteredClasses = useMemo(() => {
    return classes.filter(c => {
      const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.targetAudience.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [searchTerm, classes]);

  const isAdmin = user?.email === 'trongtuan.india@gmail.com';

  const handleEdit = () => {
    if (!selectedClass) return;
    setEditData({
      actualStudents: selectedClass.actualStudents || selectedClass.numStudents,
      startDate: selectedClass.startDate || '',
      endDate: selectedClass.endDate || '',
      status: selectedClass.status
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!selectedClass || !isAdmin) return;
    try {
      const classRef = doc(db, 'classes', selectedClass.id);
      const updatePayload = {
        ...editData,
        updatedAt: Timestamp.now()
      };
      
      // Check if doc exists, if not use setDoc
      const docSnap = await getDoc(classRef);
      if (docSnap.exists()) {
        await updateDoc(classRef, updatePayload);
      } else {
        await setDoc(classRef, { ...selectedClass, ...updatePayload });
      }
      
      setIsEditing(false);
      setError(null);
    } catch (err) {
      console.error("Save error:", err);
      setError("Lỗi khi lưu dữ liệu. Vui lòng kiểm tra quyền hạn.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-6 px-6 shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-lg">
              <GraduationCap className="text-primary w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight uppercase">Trường Chính trị tỉnh Đồng Nai</h1>
              <p className="text-primary-foreground/80 text-sm font-medium">Hệ thống Quản lý Bồi dưỡng 2026</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-foreground/60 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Tìm kiếm lớp học..." 
                className="bg-white/10 border border-white/20 rounded-full py-2 pl-10 pr-4 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-accent/50 placeholder:text-white/40 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {user ? (
              <div className="flex items-center gap-3 bg-white/10 p-1 pr-3 rounded-full border border-white/20">
                <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-white/40" />
                <button onClick={logout} className="text-xs font-bold hover:text-accent transition-colors flex items-center gap-1">
                  <LogOut className="w-3 h-3" /> Thoát
                </button>
              </div>
            ) : (
              <button 
                onClick={loginWithGoogle}
                className="bg-white text-primary px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-accent hover:text-white transition-all shadow-md"
              >
                <LogIn className="w-4 h-4" /> Đăng nhập Admin
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard 
            icon={<LayoutDashboard className="w-5 h-5" />} 
            label="Tổng số lớp" 
            value={stats.totalClasses} 
            color="bg-blue-500" 
          />
          <StatCard 
            icon={<Users className="w-5 h-5" />} 
            label="Tổng học viên (Thực tế)" 
            value={stats.totalStudents.toLocaleString()} 
            color="bg-emerald-500" 
          />
          <StatCard 
            icon={<CalendarDays className="w-5 h-5" />} 
            label="Lớp Bồi dưỡng" 
            value={stats.fostering} 
            color="bg-purple-500" 
          />
        </div>

        {/* Classes List */}
        <div className="max-w-4xl mx-auto space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredClasses.map((item) => (
              <div key={item.id} className="space-y-3">
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => {
                    if (selectedClass?.id === item.id) {
                      setSelectedClass(null);
                      setIsEditing(false);
                    } else {
                      setSelectedClass(item);
                      setIsEditing(false);
                    }
                  }}
                  className={`glass-panel p-4 cursor-pointer transition-all hover:border-primary/40 hover:shadow-md group ${selectedClass?.id === item.id ? 'ring-2 ring-primary border-transparent' : ''}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                          {item.category}
                        </span>
                        <StatusBadge status={item.status} />
                      </div>
                      <h3 className="font-bold text-slate-900 group-hover:text-primary transition-colors leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-sm text-slate-500 line-clamp-1">
                        Đối tượng: {item.targetAudience}
                      </p>
                      
                      <div className="pt-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Tiến độ thực tế</span>
                          <span className="text-[10px] font-bold text-primary">
                            {item.status === 'Completed' ? '100%' : item.status === 'In Progress' ? '50%' : '5%'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ 
                              width: item.status === 'Completed' ? '100%' : item.status === 'In Progress' ? '50%' : '5%' 
                            }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`h-full ${
                              item.status === 'Completed' ? 'bg-emerald-500' : 
                              item.status === 'In Progress' ? 'bg-amber-500' : 'bg-blue-500'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold text-primary">{item.numClasses} lớp</div>
                      <div className="text-xs text-slate-400 font-medium">
                        {item.actualStudents || item.numStudents} học viên
                      </div>
                      {item.actualStudents && (
                        <div className="text-[10px] text-emerald-600 font-bold uppercase mt-1">Đã cập nhật</div>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Inline Detail Panel */}
                <AnimatePresence>
                  {selectedClass?.id === item.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="glass-panel p-6 bg-slate-50/50 border-primary/20 space-y-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2">
                            <h2 className="text-lg font-bold text-slate-900 leading-tight">Chi tiết lớp học</h2>
                            {selectedClass.subTitle && (
                              <p className="text-sm text-slate-500 italic">{selectedClass.subTitle}</p>
                            )}
                          </div>
                          {isAdmin && !isEditing && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit();
                              }}
                              className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              title="Cập nhật thông tin"
                            >
                              <Edit3 className="w-5 h-5" />
                            </button>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="space-y-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Học viên thực tế</label>
                              <input 
                                type="number" 
                                className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                value={editData.actualStudents}
                                onChange={(e) => setEditData({...editData, actualStudents: parseInt(e.target.value)})}
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Ngày khai giảng</label>
                                <input 
                                  type="date" 
                                  className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                  value={editData.startDate}
                                  onChange={(e) => setEditData({...editData, startDate: e.target.value})}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Ngày bế giảng</label>
                                <input 
                                  type="date" 
                                  className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                  value={editData.endDate}
                                  onChange={(e) => setEditData({...editData, endDate: e.target.value})}
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Trạng thái</label>
                              <select 
                                className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                value={editData.status}
                                onChange={(e) => setEditData({...editData, status: e.target.value as any})}
                              >
                                <option value="Planned">Dự kiến</option>
                                <option value="In Progress">Đang triển khai</option>
                                <option value="Completed">Hoàn thành</option>
                              </select>
                            </div>
                            <div className="flex gap-2 pt-2">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSave();
                                }}
                                className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
                              >
                                <Save className="w-4 h-4" /> Lưu thay đổi
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsEditing(false);
                                }}
                                className="px-4 bg-white border border-slate-200 text-slate-600 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors"
                              >
                                Hủy
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <DetailItem 
                                icon={<Users className="w-4 h-4" />} 
                                label="Học viên thực tế" 
                                value={selectedClass.actualStudents ? `${selectedClass.actualStudents} học viên` : "Chưa cập nhật"} 
                                highlight={!!selectedClass.actualStudents}
                              />
                              <DetailItem 
                                icon={<Calendar className="w-4 h-4" />} 
                                label="Khai giảng thực tế" 
                                value={selectedClass.startDate || "Chưa có"} 
                              />
                              <DetailItem 
                                icon={<Calendar className="w-4 h-4" />} 
                                label="Bế giảng thực tế" 
                                value={selectedClass.endDate || "Chưa có"} 
                              />
                            </div>
                            <div className="space-y-4">
                              <DetailItem 
                                icon={<MapPin className="w-4 h-4" />} 
                                label="Địa điểm" 
                                value={selectedClass.location} 
                              />
                              <DetailItem 
                                icon={<CreditCard className="w-4 h-4" />} 
                                label="Kinh phí" 
                                value={selectedClass.funding} 
                              />
                              <DetailItem 
                                icon={<Info className="w-4 h-4" />} 
                                label="Hình thức" 
                                value={selectedClass.mode} 
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </AnimatePresence>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-8 px-6 text-center text-slate-500 text-sm">
        <p>© 2026 Trường Chính trị tỉnh Đồng Nai. Tất cả quyền được bảo lưu.</p>
        <p className="mt-1">Dựa trên Kế hoạch số 70-KH/TU và Quyết định số 829/QĐ-UBND</p>
      </footer>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number, color: string }) {
  return (
    <div className="glass-panel p-5 flex items-center gap-4">
      <div className={`${color} p-3 rounded-xl text-white shadow-sm`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-black text-slate-900 leading-none mt-1">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: TrainingClass['status'] }) {
  switch (status) {
    case 'Planned':
      return (
        <span className="status-planned flex items-center gap-1">
          <Clock className="w-3 h-3" /> Dự kiến
        </span>
      );
    case 'In Progress':
      return (
        <span className="status-inprogress flex items-center gap-1">
          <Clock className="w-3 h-3" /> Đang triển khai
        </span>
      );
    case 'Completed':
      return (
        <span className="status-completed flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Hoàn thành
        </span>
      );
  }
}

function DetailItem({ icon, label, value, highlight }: { icon: React.ReactNode, label: string, value: string, highlight?: boolean }) {
  return (
    <div className="flex gap-3">
      <div className="mt-1 text-primary shrink-0">{icon}</div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className={`text-sm font-medium leading-relaxed ${highlight ? 'text-emerald-600 font-bold' : 'text-slate-700'}`}>{value}</p>
      </div>
    </div>
  );
}
