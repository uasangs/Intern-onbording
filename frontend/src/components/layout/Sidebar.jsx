import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Users, PlusCircle,
  CreditCard, Monitor, LogOut,
  Building2, Settings, ChevronLeft, ChevronRight
} from 'lucide-react'

const NAV_ITEMS = {
  hr: [
    { to: '/hr/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/hr/interns', label: 'All Interns', icon: Users },
    { to: '/hr/initiate', label: 'New Intern', icon: PlusCircle },
    { to: '/hr/masters', label: 'Masters & Settings', icon: Settings },
  ],
  accounts: [
    { to: '/accounts/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/accounts/dashboard', label: 'My Tasks', icon: CreditCard },
  ],
  it: [
    { to: '/it/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/it/dashboard', label: 'My Tasks', icon: Monitor },
  ],
  manager: [
    { to: '/manager/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/manager/dashboard', label: 'My Interns', icon: Users },
  ],
}

const ROLE_COLORS = {
  hr: 'bg-indigo-600',
  accounts: 'bg-amber-600',
  it: 'bg-slate-700',
  manager: 'bg-blue-600',
}

const ROLE_LABELS = {
  hr: 'HR Admin',
  accounts: 'Accounts',
  it: 'IT Team',
  manager: 'Project Manager',
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [collapsed, setCollapsed] = useState(false)

  const items = NAV_ITEMS[user?.role] || []
  const roleColor = ROLE_COLORS[user?.role] || 'bg-indigo-600'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className={`${collapsed ? 'w-20' : 'w-60'} h-screen sticky top-0 bg-white border-r border-slate-200 flex flex-col transition-all duration-300`}>

      {/* Toggle Button */}
      <div className="flex justify-end p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-slate-100"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Brand */}
      <div className="px-5 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg ${roleColor} flex items-center justify-center`}>
            <Building2 className="w-4 h-4 text-white" />
          </div>

          {!collapsed && (
            <div>
              <p className="text-sm font-bold text-slate-900">Grasim</p>
              <p className="text-xs text-slate-500">Intern Onboarding</p>
            </div>
          )}
        </div>
      </div>

      {/* Role badge */}
      <div className="px-4 py-3 border-b border-slate-100">
        {/* <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium text-white ${roleColor}`}>
          {collapsed ? user?.role?.toUpperCase() : ROLE_LABELS[user?.role]}
        </span> */}

        {!collapsed && (
          <>
            <p className="text-xs text-slate-600 mt-1.5 font-medium truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {!collapsed && label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 w-full rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600`}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && 'Sign out'}
        </button>
      </div>
    </aside>
  )
}