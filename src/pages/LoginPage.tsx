import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, ArrowLeft } from 'lucide-react';
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
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();
  const [error, setError] = useState('');
  const isRtl = i18n.language === 'ar';
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
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="bg-white rounded-[24px] p-8 sm:p-10 shadow-[0_20px_60px_rgba(44,20,88,0.12)] border border-purple-100/50">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-8 flex justify-center"
          >
            <div className="flex h-24 w-auto min-w-[140px] px-8 items-center justify-center rounded-2xl bg-slate-950 shadow-lg ring-1 ring-white/10 transition-transform hover:scale-105 duration-300">
              <img
                src="/logo.png"
                alt={branding.name}
                className="h-16 w-auto max-w-[220px] object-contain"
              />
            </div>
          </motion.div>

          {/* Title & subtitle */}
          <div className="text-center mb-12">
            <h2 className="mb-4 text-[32px] font-bold text-gray-900 tracking-tight">
              {t('auth.loginTitle')}
            </h2>
            <p className="text-base text-gray-500 font-medium leading-relaxed">
              {t('auth.loginSubtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
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
              className="group relative w-full h-14 font-semibold text-base rounded-[14px] overflow-hidden transition-all duration-300 shadow-lg shadow-purple-300/40 hover:shadow-xl hover:shadow-purple-400/50 hover:-translate-y-0.5 active:translate-y-0"
              style={{
                background: 'linear-gradient(135deg, #4E2F88 0%, #6D3EEA 100%)',
              }}
            >
              <span className="relative z-10 inline-flex items-center gap-2">
                {t('auth.signIn')}
                <ArrowLeft className={`h-5 w-5 transition-transform duration-300 group-hover:translate-x-1 ${isRtl ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
              </span>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'linear-gradient(135deg, #5B34A7 0%, #7D5CEA 100%)' }}
              />
            </Button>

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between mt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-[#D7CCF6] text-[#6D3EEA] focus:ring-[#6D3EEA]/30 focus:ring-offset-0 transition-colors"
                />
                <span className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">
                  {isRtl ? 'تذكرني' : 'Remember me'}
                </span>
              </label>
              <button
                type="button"
                className="text-sm font-medium text-[#6D3EEA] hover:text-[#5B34A7] transition-colors"
              >
                {isRtl ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </AuthLayout>
  );
}
