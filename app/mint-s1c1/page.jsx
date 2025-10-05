'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MintRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/?open=mint&card=1') }, [router])
  return null
}