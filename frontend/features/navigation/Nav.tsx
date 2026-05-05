'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart2, Layers, Zap } from 'lucide-react'

const TABS = [
  { href: '/',           label: 'Portfolio',  icon: BarChart2 },
  { href: '/strategy',   label: 'Strategy',   icon: Layers },
  { href: '/execution',  label: 'Execution',  icon: Zap },
]

export function Nav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1 border-b border-white/10 bg-gray-950/80 backdrop-blur-sm px-6 py-0 sticky top-0 z-40">
      <div className="flex items-center gap-1 mr-8 py-3">
        <span className="text-sm font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent tracking-tight">
          KquantM
        </span>
      </div>
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              active
                ? 'border-indigo-400 text-white'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Icon size={14} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
