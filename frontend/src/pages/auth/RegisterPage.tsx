import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { GoogleButton } from '@/components/auth/GoogleButton'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { useRegister, useGoogleAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/auth'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
})

type FormValues = z.infer<typeof schema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const register_ = useRegister()
  const googleAuth = useGoogleAuth()

  useEffect(() => {
    if (user) navigate('/')
  }, [user, navigate])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = (data: FormValues) => register_.mutate(data)

  return (
    <AuthLayout
      title="Create account"
      subtitle="Start splitting expenses with your friends"
      footerText="Already have an account?"
      footerLinkText="Sign in"
      footerLinkTo="/auth/login"
    >
      {/* Google */}
      <GoogleButton
        onToken={(token) => googleAuth.mutate(token)}
        loading={googleAuth.isPending}
        className="mb-4"
      />

      {/* Divider */}
      <div className="relative mb-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs text-gray-400 uppercase tracking-wider">or</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <Input
          label="Full name"
          type="text"
          placeholder="Bhavy Ladani"
          autoComplete="name"
          error={errors.name?.message}
          {...register('name')}
        />
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          hint="Use a strong password you don't use elsewhere"
          error={errors.password?.message}
          {...register('password')}
        />

        <Button
          type="submit"
          size="lg"
          loading={register_.isPending}
          className="w-full mt-1"
        >
          Create account
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-gray-400">
        By creating an account you agree to our{' '}
        <span className="text-gray-600">Terms of Service</span> and{' '}
        <span className="text-gray-600">Privacy Policy</span>.
      </p>
    </AuthLayout>
  )
}
