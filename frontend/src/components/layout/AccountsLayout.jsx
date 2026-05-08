import AppLayout from './AppLayout'
import { LayoutDashboard, Laptop, ClipboardCheck, Users } from 'lucide-react'

export function AccountsLayout() {
  return <AppLayout roleLabel="Accounts Team" roleColor="amber" navItems={[
    { to: '/accounts/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ]} />
}

export function ITLayout() {
  return <AppLayout roleLabel="IT Team" roleColor="it" navItems={[
    { to: '/it/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ]} />
}

export function ManagerLayout() {
  return <AppLayout roleLabel="Project Manager" roleColor="manager" navItems={[
    { to: '/manager/dashboard', label: 'My Interns', icon: Users },
  ]} />
}

export default AccountsLayout
