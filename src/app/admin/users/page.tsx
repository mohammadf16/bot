"use client"

export default function AdminUsersPage() {
  const users = [
    { id: 1, name: "علی محمدی", email: "ali@example.com", status: "فعال", balance: "۵۰۰٬۰۰۰" },
    { id: 2, name: "فاطمه حسینی", email: "fatema@example.com", status: "فعال", balance: "۲۵۰٬۰۰۰" },
  ]

  return (
    <div>
      <h1 className="text-4xl font-bold mb-12">مدیریت کاربران</h1>

      <div className="card glass overflow-hidden">
        <table className="w-full">
          <thead className="bg-dark-bg/50 border-b border-dark-border/30">
            <tr>
              <th className="px-6 py-4 text-right font-semibold">نام</th>
              <th className="px-6 py-4 text-right font-semibold">ایمیل</th>
              <th className="px-6 py-4 text-right font-semibold">موجودی</th>
              <th className="px-6 py-4 text-right font-semibold">وضعیت</th>
              <th className="px-6 py-4 text-right font-semibold">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-dark-border/10">
                <td className="px-6 py-4">{user.name}</td>
                <td className="px-6 py-4">{user.email}</td>
                <td className="px-6 py-4">{user.balance}</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 rounded-full bg-status-success/10 text-status-success text-sm">
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="btn-tertiary text-sm">جزئیات</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
