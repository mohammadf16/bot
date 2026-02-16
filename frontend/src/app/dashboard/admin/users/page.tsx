"use client"

import { motion } from "framer-motion"
import { Search, Filter, MoreVertical, User, Mail, Phone, AlertCircle, CheckCircle2, Ban, UserPlus, Download, Settings } from "lucide-react"
import { useState } from "react"

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  const users = [
    {
      id: 1,
      name: "علیرضا محمدی",
      email: "alireza@example.com",
      phone: "09123456789",
      status: "verified",
      tickets: 12,
      wins: 3,
      balance: 2500000,
      joinDate: "1402/10/12",
      lastActive: "2 ساعت پیش"
    },
    {
      id: 2,
      name: "سارا احمدی",
      email: "sara@example.com",
      phone: "09123456788",
      status: "pending",
      tickets: 8,
      wins: 1,
      balance: 1200000,
      joinDate: "1402/11/15",
      lastActive: "1 روز پیش"
    },
    {
      id: 3,
      name: "محمد رضایی",
      email: "mohammad@example.com",
      phone: "09123456787",
      status: "suspended",
      tickets: 0,
      wins: 0,
      balance: 0,
      joinDate: "1402/12/01",
      lastActive: "1 هفته پیش"
    },
    {
      id: 4,
      name: "فاطمه کریمی",
      email: "fatemeh@example.com",
      phone: "09123456786",
      status: "verified",
      tickets: 25,
      wins: 5,
      balance: 5000000,
      joinDate: "1402/09/20",
      lastActive: "همین حالا"
    }
  ]

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone.includes(searchTerm)
    
    if (filterStatus === "all") return matchesSearch
    return matchesSearch && user.status === filterStatus
  })

  const getStatusIcon = (status: string) => {
    switch(status) {
      case "verified":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      case "pending":
        return <AlertCircle className="w-4 h-4 text-amber-500" />
      case "suspended":
        return <Ban className="w-4 h-4 text-rose-500" />
      default:
        return null
    }
  }

  const getStatusText = (status: string) => {
    switch(status) {
      case "verified":
        return "تایید شده"
      case "pending":
        return "در انتظار"
      case "suspended":
        return "معلق"
      default:
        return "نامشخص"
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] relative overflow-hidden">
      {/* Dynamic Background Light Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-gold/10 rounded-full blur-[100px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-cyan/10 rounded-full blur-[100px] animate-pulse-slow delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-[80px]" />
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10 pb-20">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-black mb-2">مدیریت کاربران</h1>
              <p className="text-white/40 text-sm">مدیریت و بررسی حساب‌های کاربری</p>
            </div>
            <div className="flex gap-3">
              <button className="btn-primary px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-black btn-shine">
                <UserPlus className="w-4 h-4" />
                کاربر جدید
              </button>
              <button className="bg-white/5 border border-white/5 hover:border-white/20 px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-black transition-all">
                <Download className="w-4 h-4" />
                خروجی اکسل
              </button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
              <input
                type="text"
                placeholder="جستجو در نام، ایمیل یا شماره موبایل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-3.5 pr-12 text-sm focus:border-accent-gold/50 focus:shadow-[0_0_20px_rgba(255,215,0,0.2)] outline-none transition-all"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-white/5 border border-white/5 rounded-2xl px-4 py-3.5 text-sm focus:border-accent-gold/50 outline-none transition-all"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="verified">تایید شده</option>
                <option value="pending">در انتظار</option>
                <option value="suspended">معلق</option>
              </select>
              <button className="bg-white/5 border border-white/5 hover:border-white/20 p-3 rounded-2xl transition-all">
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <User className="w-6 h-6 text-accent-gold" />
                <span className="text-2xl font-black">{users.length}</span>
              </div>
              <p className="text-white/40 text-xs">کل کاربران</p>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                <span className="text-2xl font-black">{users.filter(u => u.status === "verified").length}</span>
              </div>
              <p className="text-white/40 text-xs">تایید شده</p>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <AlertCircle className="w-6 h-6 text-amber-500" />
                <span className="text-2xl font-black">{users.filter(u => u.status === "pending").length}</span>
              </div>
              <p className="text-white/40 text-xs">در انتظار</p>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <Ban className="w-6 h-6 text-rose-500" />
                <span className="text-2xl font-black">{users.filter(u => u.status === "suspended").length}</span>
              </div>
              <p className="text-white/40 text-xs">معلق</p>
            </div>
          </div>
        </motion.div>

        {/* Users Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/5">
                <tr>
                  <th className="text-right p-6 text-sm font-black">کاربر</th>
                  <th className="text-right p-6 text-sm font-black">تماس</th>
                  <th className="text-right p-6 text-sm font-black">وضعیت</th>
                  <th className="text-right p-6 text-sm font-black">آمار</th>
                  <th className="text-right p-6 text-sm font-black">موجودی</th>
                  <th className="text-right p-6 text-sm font-black">فعالیت</th>
                  <th className="text-right p-6 text-sm font-black">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                          <User className="w-6 h-6 text-white/40" />
                        </div>
                        <div>
                          <p className="font-bold mb-1">{user.name}</p>
                          <p className="text-xs text-white/40">{user.joinDate}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-white/20" />
                          <span className="text-sm">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-white/20" />
                          <span className="text-sm text-white/60">{user.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(user.status)}
                        <span className="text-sm">{getStatusText(user.status)}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{user.tickets}</span>
                          <span className="text-xs text-white/40">بلیط</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-accent-gold">{user.wins}</span>
                          <span className="text-xs text-white/40">برد</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="text-right">
                        <p className="font-bold">{user.balance.toLocaleString()}</p>
                        <p className="text-xs text-white/40">تومان</p>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="text-right">
                        <p className="text-sm">{user.lastActive}</p>
                        <p className="text-xs text-white/40">آخرین فعالیت</p>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <button className="bg-white/5 hover:bg-white/10 p-2 rounded-xl transition-all">
                          <Settings className="w-4 h-4" />
                        </button>
                        <button className="bg-white/5 hover:bg-white/10 p-2 rounded-xl transition-all">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Pagination */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mt-8"
        >
          <div className="flex gap-2 bg-[#0A0A0A] border border-white/5 rounded-2xl p-2">
            <button className="px-4 py-2 rounded-xl bg-accent-gold text-black font-black">1</button>
            <button className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 font-black transition-all">2</button>
            <button className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 font-black transition-all">3</button>
            <button className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 font-black transition-all">بعدی</button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}