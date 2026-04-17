import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import MobileHeader from './MobileHeader.jsx'
import Toast from '../Toast.jsx'
import GlobalSearch from '../GlobalSearch.jsx'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
      <MobileHeader onMenuClick={() => setSidebarOpen(true)} onSearchClick={() => window.dispatchEvent(new Event('finlearn:search'))} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} />}
      <main className="main-content">
        <Outlet />
      </main>
      <Toast />
      <GlobalSearch />
    </>
  )
}
