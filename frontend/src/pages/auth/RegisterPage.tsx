import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { useRegister } from '@/hooks/useAuth'
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

      <p className="mt-4 text-center text-xs text-gray-400 dark:text-zinc-500">
        By creating an account you agree to our{' '}
        <span className="text-gray-600 dark:text-zinc-300">Terms of Service</span> and{' '}
        <span className="text-gray-600 dark:text-zinc-300">Privacy Policy</span>.
      </p>

      <div className="mt-5 pt-5 border-t border-gray-100 dark:border-zinc-800 text-center">
        <p className="text-xs text-gray-400 dark:text-zinc-500 mb-2">Just need to split a bill quickly?</p>
        <Link
          to="/try"
          className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
        >
          Try the quick calculator →
        </Link>
      </div>
    </AuthLayout>
  )
}
