'use client'

import { ReactNode, useEffect, useState } from 'react'

interface NoSSRProps {
  children: ReactNode
  fallback?: ReactNode
}

export function NoSSR({ children, fallback = null }: NoSSRProps) {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    return <>{fallback}</>
  }

  return <>{children}</>
}