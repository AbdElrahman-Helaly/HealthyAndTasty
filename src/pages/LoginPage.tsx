import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Card } from '@/components/ui/Card';
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
        <Card
          padding="lg"
          className="shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100/80 rounded-2xl bg-white/90 backdrop-blur-md"
        >
          {/* 🌟 تعديل اللوجو ليصبح بارزاً وواضحاً تماماً 🌟 */}
          <div className="mb-8 flex justify-center">
            <div className="flex h-20 w-auto min-w-[120px] px-6 items-center justify-center rounded-2xl bg-slate-950 shadow-md ring-1 ring-white/10 transition-transform hover:scale-105 duration-300">
              {/* ملحوظة: لو اللوجو بتاعك أصلاً غامق جداً، استبدل bg-slate-950 بـ bg-slate-50 */}
              <img
                src="/logo.png"
                alt={branding.name}
                className="h-12 w-auto max-w-[180px] object-contain"
              />
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="mb-2 text-2xl font-bold text-gray-900 tracking-tight">{t('auth.loginTitle')}</h2>
            <p className="text-sm text-gray-500 font-medium">{t('auth.loginSubtitle')}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label={t('auth.employeeCode')}
              type="text"
              autoComplete="username"
              placeholder="EMP-001"
              dir="ltr"
              error={errors.employeeCode?.message}
              {...register('employeeCode')}
            />
            <Input
              label={t('auth.password')}
              type="password"
              autoComplete="current-password"
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
              className="w-full mt-3 shadow-md active:scale-[0.98] transition-all duration-150"
            >
              {t('auth.signIn')}
            </Button>
          </form>
        </Card>
      </motion.div>
    </AuthLayout>
  );
}