import AppLayout from './AppLayout'
import { LayoutDashboard, Users, PlusCircle, Wallet, Laptop, ClipboardCheck } from 'lucide-react'

export default function HRLayout() {
  return <AppLayout roleLabel="HR Admin" roleColor="brand" navItems={[
    { to: '/hr/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/hr/interns',   label: 'All Interns', icon: Users },
    { to: '/hr/initiate',  label: 'Initiate Intern', icon: PlusCircle },
  ]} />
}
