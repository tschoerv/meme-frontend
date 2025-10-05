'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MintRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/?open=gallery') }, [router])
  return null
}