import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { useForgotPassword } from '@/hooks/useAuth'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
})

type FormValues = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const forgotPassword = useForgotPassword()

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = (data: FormValues) =>
    forgotPassword.mutate(data.email, { onSuccess: () => setSent(true) })

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link"
      footerText="Remember your password?"
      footerLinkText="Sign in"
      footerLinkTo="/auth/login"
    >
      {sent ? (
        <div className="flex flex-col gap-4 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center">
            <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-zinc-100">Check your email</p>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
              We sent a reset link to <span className="font-medium text-gray-700 dark:text-zinc-200">{getValues('email')}</span>
            </p>
          </div>
          <p className="text-xs text-gray-400 dark:text-zinc-500">
            Didn't get it?{' '}
            <button
              type="button"
              onClick={() => setSent(false)}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
            >
              Try again
            </button>
          </p>
          <Link
            to="/auth/login"
            className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Button
            type="submit"
            size="lg"
            loading={forgotPassword.isPending}
            className="w-full mt-1"
          >
            Send reset link
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
