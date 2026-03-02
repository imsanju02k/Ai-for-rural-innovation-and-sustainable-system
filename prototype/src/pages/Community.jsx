import { useState } from 'react'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'

export default function Community() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Community" />
      
      <main className="pb-20 pt-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6 mb-4">
            <h2 className="text-xl font-semibold mb-4">Farmer Community</h2>
            <p className="text-gray-600">Community features coming soon...</p>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
