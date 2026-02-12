"use client"

import { motion } from "framer-motion"
import { Search, Filter, TrendingUp, TrendingDown, DollarSign, CreditCard, Wallet, ArrowUpRight, ArrowDownRight, Ticket, Eye, MoreVertical, Clock } from "lucide-react"
import { useState } from "react"

export default function AdminFinancialPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [dateRange, setDateRange] = useState("7days")

  const transactions = [
    {
      id: 1,
      user: "علیرضا محمدی",
      userPhone: "09123456789",
      type: "purchase",
      amount: 1500000,
      description: "خرید 3 بلیط - Lamborghini Aventador",
      date: "1402/12/10",
      time: "14:30",
      status: "completed",
      paymentMethod: "credit_card",
      reference: "TXN-2024-001",
      raffleId: 1
    },
    {
      id: 2,
      user: "سارا احمدی",
      userPhone: "09123456788",
      type: "withdrawal",
      amount: -5000000,
      description: "برداشت وجه - جایزه شمش طلا",
      date: "1402/12/09",
      time: "09:15",
      status: "completed",
      paymentMethod: "bank_transfer",
      reference: "TXN-2024-002",
      raffleId: 2
    },
    {
      id: 3,
      user: "محمد رضایی",
      userPhone: "09123456787",
      type: "purchase",
      amount: 500000,
      description: "خرید 1 بلیط - Rolex Daytona",
      date: "1402/12/08",
      time: "16:45",
      status: "pending",
      paymentMethod: "digital_wallet",
      reference: "TXN-2024-003",
      raffleId: 3
    },
    {
      id: 4,
      user: "فاطمه کریمی",
      userPhone: "09123456786",
      type: "refund",
      amount: -300000,
      description: "استرداد وجه - لغو قرعه‌کشی Tesla",
      date: "1402/12/07",
      time: "11:20",
      status: "completed",
      paymentMethod: "credit_card",
      reference: "TXN-2024-004",
      raffleId: 4
    },
    {
      id: 5,
      user: "علی محمدی",
      userPhone: "09123456785",
      type: "purchase",
      amount: 2000000,
      description: "خرید 4 بلیط - Lamborghini Aventador",
      date: "1402/12/06",
      time: "20:10",
      status: "failed",
      paymentMethod: "credit_card",
      reference: "TXN-2024-005",
      raffleId: 1
    }
  ]

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.userPhone.includes(searchTerm) ||
                         transaction.reference.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (filterType === "all") return matchesSearch
    return matchesSearch && transaction.type === filterType
  })

  const getTypeIcon = (type: string) => {
    switch(type) {
      case "purchase":
        return <Ticket className="w-4 h-4 text-emerald-500" />
      case "withdrawal":
        return <ArrowUpRight className="w-4 h-4 text-blue-500" />
      case "refund":
        return <ArrowDownRight className="w-4 h-4 text-amber-500" />
      default:
        return <DollarSign className="w-4 h-4 text-white" />
    }
  }

  const getTypeText = (type: string) => {
    switch(type) {
      case "purchase":
        return "خرید"
      case "withdrawal":
        return "برداشت"
      case "refund":
        return "استرداد"
      default:
        return "تراکنش"
    }
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case "completed":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
      case "pending":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20"
      case "failed":
        return "bg-rose-500/10 text-rose-500 border-rose-500/20"
      default:
        return "bg-white/10 text-white border-white/20"
    }
  }

  const getStatusText = (status: string) => {
    switch(status) {
      case "completed":
        return "تکمیل شده"
      case "pending":
        return "در انتظار"
      case "failed":
        return "ناموفق"
      default:
        return "نامشخص"
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch(method) {
      case "credit_card":
        return <CreditCard className="w-4 h-4" />
      case "digital_wallet":
        return <Wallet className="w-4 h-4" />
      case "bank_transfer":
        return <TrendingUp className="w-4 h-4" />
      default:
        return <DollarSign className="w-4 h-4" />
    }
  }

  const getPaymentMethodText = (method: string) => {
    switch(method) {
      case "credit_card":
        return "کارت اعتباری"
      case "digital_wallet":
        return "کیف پول دیجیتال"
      case "bank_transfer":
        return "انتقال بانکی"
      default:
        return "نامشخص"
    }
  }

  // Calculate financial summary
  const totalIncome = transactions
    .filter(t => t.type === "purchase" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = transactions
    .filter(t => (t.type === "withdrawal" || t.type === "refund") && t.status === "completed")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const netProfit = totalIncome - totalExpenses
  const pendingAmount = transactions
    .filter(t => t.status === "pending")
    .reduce((sum, t) => sum + t.amount, 0)

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
              <h1 className="text-3xl font-black mb-2">مدیریت مالی</h1>
              <p className="text-white/40 text-sm">گزارش تراکنش‌ها و وضعیت مالی</p>
            </div>
            <div className="flex gap-3">
              <button className="btn-primary px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-black btn-shine">
                <DollarSign className="w-4 h-4" />
                تسویه حساب
              </button>
              <button className="bg-white/5 border border-white/5 hover:border-white/20 px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-black transition-all">
                <TrendingUp className="w-4 h-4" />
                گزارش مالی
              </button>
            </div>
          </div>

          {/* Financial Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-6 h-6 text-emerald-500" />
                <span className="text-2xl font-black">{totalIncome.toLocaleString()}</span>
              </div>
              <p className="text-white/40 text-xs">کل درآمد</p>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingDown className="w-6 h-6 text-rose-500" />
                <span className="text-2xl font-black">{totalExpenses.toLocaleString()}</span>
              </div>
              <p className="text-white/40 text-xs">کل هزینه‌ها</p>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-6 h-6 text-accent-gold" />
                <span className="text-2xl font-black">{netProfit.toLocaleString()}</span>
              </div>
              <p className="text-white/40 text-xs">سود خالص</p>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-6 h-6 text-amber-500" />
                <span className="text-2xl font-black">{pendingAmount.toLocaleString()}</span>
              </div>
              <p className="text-white/40 text-xs">در انتظار</p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
              <input
                type="text"
                placeholder="جستجو در نام، شماره یا کد رهگیری..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-3.5 pr-12 text-sm focus:border-accent-gold/50 focus:shadow-[0_0_20px_rgba(255,215,0,0.2)] outline-none transition-all"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-white/5 border border-white/5 rounded-2xl px-4 py-3.5 text-sm focus:border-accent-gold/50 outline-none transition-all"
              >
                <option value="all">همه نوع تراکنش</option>
                <option value="purchase">خرید</option>
                <option value="withdrawal">برداشت</option>
                <option value="refund">استرداد</option>
              </select>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-white/5 border border-white/5 rounded-2xl px-4 py-3.5 text-sm focus:border-accent-gold/50 outline-none transition-all"
              >
                <option value="7days">7 روز اخیر</option>
                <option value="30days">30 روز اخیر</option>
                <option value="90days">90 روز اخیر</option>
                <option value="1year">1 سال اخیر</option>
              </select>
              <button className="bg-white/5 border border-white/5 hover:border-white/20 p-3 rounded-2xl transition-all">
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Transactions Table */}
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
                  <th className="text-right p-6 text-sm font-black">نوع تراکنش</th>
                  <th className="text-right p-6 text-sm font-black">مبلغ</th>
                  <th className="text-right p-6 text-sm font-black">توضیحات</th>
                  <th className="text-right p-6 text-sm font-black">تاریخ</th>
                  <th className="text-right p-6 text-sm font-black">وضعیت</th>
                  <th className="text-right p-6 text-sm font-black">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-6">
                      <div>
                        <p className="font-bold mb-1">{transaction.user}</p>
                        <p className="text-xs text-white/40">{transaction.userPhone}</p>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(transaction.type)}
                        <div>
                          <p className="text-sm font-bold">{getTypeText(transaction.type)}</p>
                          <div className="flex items-center gap-1 text-xs text-white/40">
                            {getPaymentMethodIcon(transaction.paymentMethod)}
                            <span>{getPaymentMethodText(transaction.paymentMethod)}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className={`text-right ${transaction.amount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        <p className="font-black text-lg">
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-white/40">تومان</p>
                      </div>
                    </td>
                    <td className="p-6">
                      <div>
                        <p className="text-sm">{transaction.description}</p>
                        <p className="text-xs text-white/40 mt-1">{transaction.reference}</p>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="text-right">
                        <p className="text-sm">{transaction.date}</p>
                        <p className="text-xs text-white/40">{transaction.time}</p>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className={`px-3 py-1.5 rounded-xl text-xs font-black border ${getStatusColor(transaction.status)}`}>
                        {getStatusText(transaction.status)}
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <button className="bg-white/5 hover:bg-white/10 p-2 rounded-xl transition-all">
                          <Eye className="w-4 h-4" />
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