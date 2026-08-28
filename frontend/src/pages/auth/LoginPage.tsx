import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { useLogin } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/auth'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const nextUrl = searchParams.get('next') ?? '/'
  const user = useAuthStore((s) => s.user)
  const login = useLogin(nextUrl)

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate(nextUrl, { replace: true })
  }, [user, navigate, nextUrl])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = (data: FormValues) => login.mutate(data)

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your account to continue"
      footerText="Don't have an account?"
      footerLinkText="Create one"
      footerLinkTo="/auth/register"
    >
      {/* Email/password form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <div className="flex flex-col gap-1.5">
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <div className="flex justify-end">
            <button
              type="button"
              className="text-xs text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              Forgot password?
            </button>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          loading={login.isPending}
          className="w-full mt-1"
        >
          Sign in
        </Button>
      </form>
    </AuthLayout>
  )
}
