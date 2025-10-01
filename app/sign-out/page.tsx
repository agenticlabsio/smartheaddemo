'use client'

import { useEffect } from 'react'
import { useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function SignOutPage() {
  const { signOut } = useClerk()
  const router = useRouter()

  useEffect(() => {
    const handleSignOut = async () => {
      try {
        await signOut()
        router.push('/')
      } catch (error) {
        console.error('Sign out error:', error)
        router.push('/')
      }
    }

    handleSignOut()
  }, [signOut, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Signing you out...</p>
      </div>
    </div>
  )
}