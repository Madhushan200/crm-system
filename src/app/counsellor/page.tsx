"use client";

import { useState } from "react";

const menuItems = [
  { name: "Dashboard", icon: "📊", active: true },
  { name: "My Leads", icon: "👥", active: false },
  { name: "Follow-ups", icon: "⏰", active: false },
  { name: "Hot Leads", icon: "🔥", active: false },
  { name: "Sales", icon: "💰", active: false },
  { name: "Profile", icon: "👤", active: false },
];

const stats = [
  {
    title: "My Leads",
    value: "142",
    change: "+8.5%",
    changeType: "positive",
    icon: "👥",
    color: "from-blue-500 to-blue-600"
  },
  {
    title: "Hot Leads",
    value: "28",
    change: "+12.3%",
    changeType: "positive",
    icon: "🔥",
    color: "from-red-500 to-red-600"
  },
  {
    title: "Pending Follow-ups",
    value: "12",
    change: "-3.2%",
    changeType: "negative",
    icon: "⏰",
    color: "from-yellow-500 to-yellow-600"
  },
  {
    title: "Sales",
    value: "35",
    change: "+18.7%",
    changeType: "positive",
    icon: "💰",
    color: "from-green-500 to-green-600"
  },
];

const leads = [
  { name: "Aarav Patel", phone: "+91 98765 43210", programme: "MBA - Finance", status: "Hot", lastContact: "2 hours ago" },
  { name: "Priya Nair", phone: "+91 91234 56789", programme: "BBA", status: "Neutral", lastContact: "1 day ago" },
  { name: "Kabir Khan", phone: "+91 99887 66554", programme: "BSc Data Science", status: "Cold", lastContact: "3 days ago" },
  { name: "Mira Sharma", phone: "+91 90123 45678", programme: "BA Psychology", status: "Converted", lastContact: "1 week ago" },
  { name: "Rohan Gupta", phone: "+91 98765 12345", programme: "MCA", status: "Hot", lastContact: "30 mins ago" },
  { name: "Sneha Reddy", phone: "+91 87654 32109", programme: "MSc Computer Science", status: "Neutral", lastContact: "5 hours ago" },
];

const statusStyles = {
  Hot: "bg-red-100 text-red-700 border-red-200",
  Cold: "bg-blue-100 text-blue-700 border-blue-200",
  Neutral: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Converted: "bg-green-100 text-green-700 border-green-200",
};

const statusIcons = {
  Hot: "🔥",
  Cold: "❄️",
  Neutral: "🟡",
  Converted: "✅",
};

export default function CounsellorPage() {
  const [activeItem, setActiveItem] = useState("Dashboard");
  const [selectedLead, setSelectedLead] = useState<typeof leads[0] | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl border-r border-slate-200">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-600 to-teal-600 text-xl font-semibold text-white shadow-lg">
              👨‍🏫
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Counsellor Portal</p>
              <h1 className="text-lg font-bold text-slate-900">My Dashboard</h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.name}>
                  <button
                    type="button"
                    onClick={() => setActiveItem(item.name)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium rounded-xl transition-all duration-200 ${
                      activeItem === item.name
                        ? "bg-gradient-to-r from-green-50 to-teal-50 text-green-700 shadow-md border border-green-200"
                        : "text-slate-700 hover:bg-slate-100 hover:shadow-sm"
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    {item.name}
                    {activeItem === item.name && (
                      <div className="ml-auto w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* User Profile */}
          <div className="px-4 py-4 border-t border-slate-200">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold">
                C
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">Counsellor User</p>
                <p className="text-xs text-slate-500">counsellor@edu.com</p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-72">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-slate-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">My Dashboard</h1>
              <p className="text-slate-600 mt-1">Track your leads and manage your counselling activities.</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
                📞 Call Lead
              </button>
              <button className="px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-all shadow-lg">
                + Add Follow-up
              </button>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <main className="px-8 py-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {stats.map((stat) => (
              <div key={stat.title} className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white text-xl shadow-lg`}>
                    {stat.icon}
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    stat.changeType === 'positive'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {stat.change}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Leads Table */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Recent Leads</h2>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
                    Filter
                  </button>
                  <button className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
                    Export
                  </button>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Phone</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Programme</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Last Contact</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead, index) => (
                    <tr key={index} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-900 font-medium">{lead.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{lead.phone}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{lead.programme}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${statusStyles[lead.status as keyof typeof statusStyles]}`}>
                          <span>{statusIcons[lead.status as keyof typeof statusIcons]}</span>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{lead.lastContact}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <button className="p-1 text-blue-600 hover:text-blue-700 transition-colors" title="Call">
                            📞
                          </button>
                          <button className="p-1 text-green-600 hover:text-green-700 transition-colors" title="Add Follow-up">
                            ➕
                          </button>
                          <button className="p-1 text-slate-600 hover:text-slate-700 transition-colors" title="View Details">
                            👁️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Today's Tasks</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">📞</div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Call Aarav Patel</p>
                    <p className="text-xs text-slate-500">MBA Finance inquiry</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white text-sm">⏰</div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Follow-up with Priya</p>
                    <p className="text-xs text-slate-500">BBA application</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Performance</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Conversion Rate</span>
                  <span className="text-sm font-bold text-green-600">24.6%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '24.6%' }}></div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Response Time</span>
                  <span className="text-sm font-bold text-blue-600">2.3 hrs</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all">
                  <span className="text-2xl">📞</span>
                  <span className="text-xs font-medium">Call Lead</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-green-50 to-green-100 text-green-700 rounded-xl hover:from-green-100 hover:to-green-200 transition-all">
                  <span className="text-2xl">📝</span>
                  <span className="text-xs font-medium">Add Note</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-purple-50 to-purple-100 text-purple-700 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all">
                  <span className="text-2xl">📊</span>
                  <span className="text-xs font-medium">View Stats</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 text-yellow-700 rounded-xl hover:from-yellow-100 hover:to-yellow-200 transition-all">
                  <span className="text-2xl">⚙️</span>
                  <span className="text-xs font-medium">Settings</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
