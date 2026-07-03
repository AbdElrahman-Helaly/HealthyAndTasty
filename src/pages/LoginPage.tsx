import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, LogIn } from 'lucide-react';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { branding } from '@/config/branding';

const schema = z.object({
  employeeCode: z.string().min(1, 'كود الموظف مطلوب'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();
  const [error, setError] = useState('');
  usePageTitle(t('auth.loginTitle'));

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setError('');
    const success = await login(data);
    if (success) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
      navigate(from ?? '/dashboard', { replace: true });
    } else {
      setError('كود الموظف أو كلمة المرور غير صحيحة');
    }
  }

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="bg-white rounded-[24px] p-8 sm:p-10 shadow-[0_20px_60px_rgba(64,41,110,0.10),0_8px_20px_rgba(64,41,110,0.06)] border border-purple-100/60">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <div className="flex h-24 w-auto min-w-[140px] px-8 items-center justify-center rounded-2xl bg-slate-950 shadow-lg ring-1 ring-white/10 transition-transform hover:scale-105 duration-300">
              <img
                src="/logo.png"
                alt={branding.name}
                className="h-16 w-auto max-w-[220px] object-contain"
              />
            </div>
          </div>

          {/* Title & subtitle */}
          <div className="text-center mb-8">
            <h2 className="mb-2 text-[28px] font-bold text-gray-900 tracking-tight">
              {t('auth.loginTitle')}
            </h2>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">
              {t('auth.loginSubtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <Input
              label={t('auth.employeeCode')}
              type="text"
              autoComplete="username"
              placeholder="EMP-001"
              dir="ltr"
              icon={<User className="h-5 w-5" />}
              error={errors.employeeCode?.message}
              {...register('employeeCode')}
            />
            <Input
              label={t('auth.password')}
              type="password"
              autoComplete="current-password"
              icon={<Lock className="h-5 w-5" />}
              error={errors.password?.message}
              {...register('password')}
            />

            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="rounded-xl bg-red-50 border border-red-100 px-4 py-2.5 text-sm text-red-600 font-medium"
                role="alert"
              >
                {error}
              </motion.p>
            )}

            <Button
              type="submit"
              size="lg"
              loading={isLoading}
              className="w-full h-14 font-semibold text-base rounded-[14px] shadow-lg shadow-purple-200/50 hover:shadow-xl hover:shadow-purple-300/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              <LogIn className="h-5 w-5" />
              {t('auth.signIn')}
            </Button>
          </form>
        </div>
      </motion.div>
    </AuthLayout>
  );
}
