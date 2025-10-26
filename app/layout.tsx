import type React from "react"
import type { Metadata } from "next"
import { GeistMono } from "geist/font/mono"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "Document Classification System",
  description: "Classify and organize documents within your organizational hierarchy",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-mono ${GeistMono.variable}`}>
        <Suspense fallback={<div>Loading...</div>}>
          {children}
          {/* Analytics removed due to package conflict */}
        </Suspense>
      </body>
    </html>
  )
}
