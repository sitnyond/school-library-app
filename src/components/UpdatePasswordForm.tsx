import { useState } from 'react'
import { Container, Paper, Typography, Stack, TextField, Button } from '@mui/material'
import { supabase } from '../supabaseClient'

interface UpdatePasswordFormProps {
  onComplete: () => void
}

export function UpdatePasswordForm({ onComplete }: UpdatePasswordFormProps) {
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(