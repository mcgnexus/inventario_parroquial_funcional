'use client'
import ChatInterface from '@/components/ChatInterface'

export default function InventarioPage() {
  return (
    <main className="min-h-screen py-6 safe-area-bottom">
      <div className="mx-auto max-w-6xl px-4">
        <ChatInterface />
        <footer className="text-center mt-8 text-sm text-muted-foreground">
          <p>Creado por: Manuel Carrasco García</p>
        </footer>
      </div>
    </main>
  )
}