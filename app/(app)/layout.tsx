import React from 'react'
import './styles/portal.css'

export const metadata = {
  description: 'Qmm.ee — Insights and Stories',
  title: 'Qmm.ee | Insights',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
