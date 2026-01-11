import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Power Employee Platform - AI Delivery Manager',
  description: 'AI-powered project management application with senior delivery manager capabilities',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
