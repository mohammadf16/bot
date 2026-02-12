"use client"

import { motion } from "framer-motion"
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  CheckCircle2,
  Camera,
  Save,
  Key,
  Bell
} from "lucide-react"

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-[#050505] relative overflow-hidden">
      {/* Dynamic Background Light Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-gold/10 rounded-full blur-[100px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-cyan/10 rounded-full blur-[100px] animate-pulse-slow delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-[80px]" />
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10 space-y-8 pb-20">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Enhanced Profile Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full md:w-1/3 bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] p-8 text-center relative overflow-hidden group profile-card-glow"
          >
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-accent-gold/10 to-transparent pointer-events-none animate-pulse-slow" />
            
            {/* Enhanced Avatar Section */}
            <div className="relative inline-block mb-6">
              <div className="w-32 h-32 rounded-full bg-white/5 border-4 border-[#0A0A0A] shadow-xl flex items-center justify-center overflow-hidden relative group-hover:scale-105 transition-transform duration-300">
                 {/* Avatar with Glow Effect */}
                 <div className="absolute inset-0 bg-gradient-to-br from-accent-gold/20 via-transparent to-accent-cyan/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                 <User className="w-12 h-12 text-white/20 relative z-10" />
              </div>
              <button className="absolute bottom-2 right-2 w-10 h-10 bg-accent-gold rounded-full flex items-center justify-center text-black hover:scale-110 transition-all shadow-lg border-4 border-[#0A0A0A] group-hover:shadow-[0_0_20px_rgba(255,215,0,0.6)]">
                <Camera className="w-5 h-5" />
              </button>
            </div>

            <h2 className="text-2xl font-black mb-1">علیرضا محمدی</h2>
            <p className="text-white/40 text-sm font-bold mb-6">عضویت: ۱۴۰۲/۱۰/۱۲</p>

            <div className="flex items-center justify-center gap-2 bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-xl text-xs font-bold border border-emerald-500/20 mb-8 animate-pulse-slow">
              <CheckCircle2 className="w-4 h-4" />
              حساب کاربری تایید شده
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-white/5 rounded-2xl p-4 group-hover:bg-white/10 transition-colors">
                <p className="text-xl font-black mb-1">۱۲</p>
                <p className="text-[10px] text-white/30 uppercase tracking-widest">بلیط‌ها</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 group-hover:bg-white/10 transition-colors">
                <p className="text-xl font-black mb-1 text-accent-gold">۳</p>
                <p className="text-[10px] text-white/30 uppercase tracking-widest">بردها</p>
              </div>
            </div>
          </motion.div>

          {/* Edit Forms */}
          <div className="flex-1 space-y-8 w-full">
            
            {/* Enhanced Personal Info Form */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] p-8 group"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-accent-gold/10 rounded-2xl flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-accent-gold/20 via-transparent to-accent-gold/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <User className="w-6 h-6 text-accent-gold relative z-10" />
                </div>
                <div>
                  <h3 className="text-xl font-black">اطلاعات شخصی</h3>
                  <p className="text-white/40 text-xs">اطلاعات هویتی خود را ویرایش کنید</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-2">
                  <label className="text-xs text-white/40 font-bold pr-2">نام و نام خانوادگی</label>
                  <div className="bg-white/5 border border-white/5 rounded-2xl px-4 py-3.5 flex items-center gap-3 focus-within:border-accent-gold/50 focus-within:shadow-[0_0_20px_rgba(255,215,0,0.2)] transition-all group-hover:bg-white/10 input-glow">
                    <User className="w-5 h-5 text-white/20" />
                    <input type="text" defaultValue="علیرضا محمدی" className="bg-transparent border-none outline-none text-sm font-bold w-full text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/40 font-bold pr-2">شماره موبایل</label>
                  <div className="bg-white/5 border border-white/5 rounded-2xl px-4 py-3.5 flex items-center gap-3 opacity-50 cursor-not-allowed group-hover:bg-white/10">
                    <Phone className="w-5 h-5 text-white/20" />
                    <input type="text" defaultValue="09123456789" disabled className="bg-transparent border-none outline-none text-sm font-bold w-full text-white/50" />
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-500 px-2 py-1 rounded">تایید شده</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/40 font-bold pr-2">ایمیل</label>
                  <div className="bg-white/5 border border-white/5 rounded-2xl px-4 py-3.5 flex items-center gap-3 focus-within:border-accent-gold/50 focus-within:shadow-[0_0_20px_rgba(255,215,0,0.2)] transition-all group-hover:bg-white/10 input-glow">
                    <Mail className="w-5 h-5 text-white/20" />
                    <input type="email" defaultValue="alireza@example.com" className="bg-transparent border-none outline-none text-sm font-bold w-full text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/40 font-bold pr-2">آدرس</label>
                  <div className="bg-white/5 border border-white/5 rounded-2xl px-4 py-3.5 flex items-center gap-3 focus-within:border-accent-gold/50 focus-within:shadow-[0_0_20px_rgba(255,215,0,0.2)] transition-all group-hover:bg-white/10 input-glow">
                    <MapPin className="w-5 h-5 text-white/20" />
                    <input type="text" placeholder="آدرس خود را وارد کنید" className="bg-transparent border-none outline-none text-sm font-bold w-full text-white" />
                  </div>
                </div>
              </div>

              <button className="btn-primary w-full md:w-auto px-8 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-black group relative overflow-hidden btn-shine">
                <span className="relative z-10 flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  ذخیره تغییرات
                </span>
              </button>
            </motion.div>

            {/* Enhanced Security */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] p-8 group security-card-glow"
            >
               <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-rose-500/20 via-transparent to-rose-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Shield className="w-6 h-6 text-rose-500 relative z-10" />
                </div>
                <div>
                  <h3 className="text-xl font-black">امنیت و رمز عبور</h3>
                  <p className="text-white/40 text-xs">مدیریت امنیت حساب کاربری</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <button className="w-full bg-white/5 border border-white/5 hover:border-white/20 p-4 rounded-2xl flex items-center justify-between group/button transition-all relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-accent-gold/5 via-transparent to-accent-gold/5 opacity-0 group-hover/button:opacity-100 transition-opacity" />
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover/button:scale-110 transition-transform">
                      <Key className="w-5 h-5 text-white/40 group-hover/button:text-white transition-colors" />
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">تغییر رمز عبور</p>
                      <p className="text-xs text-white/30">آخرین تغییر: ۳ ماه پیش</p>
                    </div>
                  </div>
                  <div className="text-xs bg-white/10 px-3 py-1.5 rounded-lg group-hover/button:bg-white text-black font-bold transition-all relative z-10">
                    تغییر
                  </div>
                </button>
                
                <button className="w-full bg-white/5 border border-white/5 hover:border-white/20 p-4 rounded-2xl flex items-center justify-between group/button transition-all relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-accent-cyan/5 via-transparent to-accent-cyan/5 opacity-0 group-hover/button:opacity-100 transition-opacity" />
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover/button:scale-110 transition-transform">
                      <Bell className="w-5 h-5 text-white/40 group-hover/button:text-white transition-colors" />
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">تنظیمات اعلان‌ها</p>
                      <p className="text-xs text-white/30">پیامک و ایمیل</p>
                    </div>
                  </div>
                  <div className="text-xs bg-white/10 px-3 py-1.5 rounded-lg group-hover/button:bg-white text-black font-bold transition-all relative z-10">
                    مدیریت
                  </div>
                </button>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  )
}