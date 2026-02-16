"use client"

import { motion } from "framer-motion"
import { Search, Plus, Edit, Trash2, Eye, Calendar, Users, Ticket, Clock, Award, TrendingUp, Filter } from "lucide-react"
import { useState } from "react"

export default function AdminRafflesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  const raffles = [
    {
      id: 1,
      title: "Lamborghini Aventador SVJ",
      description: "سوپراسپرت ایتالیایی با موتور V12",
      image: "/api/placeholder/400/300",
      ticketPrice: 500000,
      totalTickets: 1000,
      soldTickets: 750,
      startDate: "1402/12/01",
      endDate: "1402/12/31",
      status: "active",
      prizeValue: 20000000000,
      participants: 450,
      winner: null,
      featured: true
    },
    {
      id: 2,
      title: "شمش طلا 1 کیلوگرمی",
      description: "طلای 24 عیار با گواهینامه رسمی",
      image: "/api/placeholder/400/300",
      ticketPrice: 100000,
      totalTickets: 500,
      soldTickets: 500,
      startDate: "1402/11/15",
      endDate: "1402/11/30",
      status: "completed",
      prizeValue: 4000000000,
      participants: 320,
      winner: "علیرضا محمدی",
      featured: false
    },
    {
      id: 3,
      title: "Rolex Daytona",
      description: "ساعت کلاسیک سوئیسی",
      image: "/api/placeholder/400/300",
      ticketPrice: 200000,
      totalTickets: 300,
      soldTickets: 150,
      startDate: "1403/01/01",
      endDate: "1403/01/31",
      status: "upcoming",
      prizeValue: 1500000000,
      participants: 120,
      winner: null,
      featured: false
    },
    {
      id: 4,
      title: "Tesla Model S",
      description: "خودروی برقی لوکس آمریکایی",
      image: "/api/placeholder/400/300",
      ticketPrice: 300000,
      totalTickets: 800,
      soldTickets: 200,
      startDate: "1402/10/01",
      endDate: "1402/10/31",
      status: "cancelled",
      prizeValue: 12000000000,
      participants: 180,
      winner: null,
      featured: true
    }
  ]

  const filteredRaffles = raffles.filter(raffle => {
    const matchesSearch = raffle.title.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (filterStatus === "all") return matchesSearch
    return matchesSearch && raffle.status === filterStatus
  })

  const getStatusColor = (status: string) => {
    switch(status) {
      case "active":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
      case "completed":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "upcoming":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20"
      case "cancelled":
        return "bg-rose-500/10 text-rose-500 border-rose-500/20"
      default:
        return "bg-white/10 text-white border-white/20"
    }
  }

  const getStatusText = (status: string) => {
    switch(status) {
      case "active":
        return "فعال"
      case "completed":
        return "تکمیل شده"
      case "upcoming":
        return "آینده"
      case "cancelled":
        return "لغو شده"
      default:
        return "نامشخص"
    }
  }

  const getProgressPercentage = (sold: number, total: number) => {
    return Math.round((sold / total) * 100)
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
              <h1 className="text-3xl font-black mb-2">مدیریت قرعه‌کشی‌ها</h1>
              <p className="text-white/40 text-sm">ایجاد و مدیریت مسابقات</p>
            </div>
            <div className="flex gap-3">
              <button className="btn-primary px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-black btn-shine">
                <Plus className="w-4 h-4" />
                قرعه‌کشی جدید
              </button>
              <button className="bg-white/5 border border-white/5 hover:border-white/20 px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-black transition-all">
                <Award className="w-4 h-4" />
                جوایز
              </button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
              <input
                type="text"
                placeholder="جستجو در عنوان قرعه‌کشی..."
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
                <option value="active">فعال</option>
                <option value="completed">تکمیل شده</option>
                <option value="upcoming">آینده</option>
                <option value="cancelled">لغو شده</option>
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
                <Ticket className="w-6 h-6 text-accent-gold" />
                <span className="text-2xl font-black">{raffles.length}</span>
              </div>
              <p className="text-white/40 text-xs">کل قرعه‌کشی‌ها</p>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-6 h-6 text-emerald-500" />
                <span className="text-2xl font-black">{raffles.filter(r => r.status === "active").length}</span>
              </div>
              <p className="text-white/40 text-xs">فعال</p>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-6 h-6 text-blue-500" />
                <span className="text-2xl font-black">{raffles.reduce((sum, r) => sum + r.participants, 0)}</span>
              </div>
              <p className="text-white/40 text-xs">شرکت‌کننده</p>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <Award className="w-6 h-6 text-amber-500" />
                <span className="text-2xl font-black">{raffles.reduce((sum, r) => sum + (r.soldTickets * r.ticketPrice), 0).toLocaleString()}</span>
              </div>
              <p className="text-white/40 text-xs">درآمد (تومان)</p>
            </div>
          </div>
        </motion.div>

        {/* Raffles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRaffles.map((raffle, index) => (
            <motion.div
              key={raffle.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] overflow-hidden group hover:border-white/10 transition-all"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={raffle.image} 
                  alt={raffle.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                {raffle.featured && (
                  <div className="absolute top-4 right-4 bg-accent-gold text-black px-3 py-1 rounded-full text-xs font-black">
                    ویژه
                  </div>
                )}
                <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-black border ${getStatusColor(raffle.status)}`}>
                  {getStatusText(raffle.status)}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-black mb-2">{raffle.title}</h3>
                <p className="text-white/60 text-sm mb-4">{raffle.description}</p>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-white/40">پیشرفت</span>
                    <span className="text-xs font-bold">{getProgressPercentage(raffle.soldTickets, raffle.totalTickets)}%</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-accent-gold to-accent-cyan h-2 rounded-full transition-all"
                      style={{ width: `${getProgressPercentage(raffle.soldTickets, raffle.totalTickets)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-white/40">{raffle.soldTickets} فروخته شده</span>
                    <span className="text-xs text-white/40">{raffle.totalTickets} کل</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-lg font-black text-accent-gold">{raffle.ticketPrice.toLocaleString()}</p>
                    <p className="text-xs text-white/40">قیمت بلیط</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-black">{raffle.participants}</p>
                    <p className="text-xs text-white/40">شرکت‌کننده</p>
                  </div>
                </div>

                {/* Dates */}
                <div className="flex justify-between items-center mb-4 text-xs text-white/40">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>شروع: {raffle.startDate}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>پایان: {raffle.endDate}</span>
                  </div>
                </div>

                {/* Winner */}
                {raffle.winner && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mb-4">
                    <p className="text-xs text-emerald-500">برنده: {raffle.winner}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button className="flex-1 bg-accent-gold text-black px-4 py-2 rounded-xl text-sm font-black hover:scale-105 transition-all">
                    <Eye className="w-4 h-4 inline ml-2" />
                    مشاهده
                  </button>
                  <button className="bg-white/5 border border-white/5 hover:border-white/20 px-3 py-2 rounded-xl transition-all">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="bg-white/5 border border-white/5 hover:border-white/20 px-3 py-2 rounded-xl transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pagination */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center mt-12"
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