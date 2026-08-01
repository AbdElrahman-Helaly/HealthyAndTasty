import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { branding } from '@/config/branding';

const schema = z.object({
  emailOrPhone: z.string().min(1, 'البريد الإلكتروني أو رقم الهاتف مطلوب'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const isRtl = i18n.language === 'ar';
  usePageTitle(t('auth.loginTitle'));

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setError('');
    const result = await login(data);
    if (result.ok) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
      navigate(from ?? '/dashboard', { replace: true });
    } else {
      setError(result.error || (isRtl ? 'بيانات الدخول غير صحيحة' : 'Invalid credentials'));
    }
  }

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="bg-white rounded-[20px] p-5 sm:p-6 shadow-[0_20px_50px_rgba(30,20,80,0.07)] border border-purple-100/50">
          {/* Logo */}
          <div className="mb-4 flex justify-center">
            <div className="relative flex h-14 w-auto min-w-[100px] px-4 items-center justify-center rounded-[16px] bg-gradient-to-br from-slate-900 to-slate-950 shadow-[0_8px_20px_rgba(40,20,80,0.08)] ring-1 ring-white/15 transition-all duration-300 hover:scale-105 hover:ring-purple-400/30">
              <div className="absolute inset-0 rounded-[16px] bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />
              <img
                src="/logo.png"
                alt={branding.name}
                className="h-[44px] w-auto max-w-[160px] object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
              />
            </div>
          </div>

          {/* Title & subtitle */}
          <div className="text-center mb-4">
            <h2 className="mb-1 text-[22px] font-bold text-gray-900 tracking-tight">
              {t('auth.loginTitle')}
            </h2>
            <p className="text-sm text-[#888888] font-medium leading-relaxed">
              {t('auth.loginSubtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <Input
              label={t('auth.emailOrPhone')}
              type="text"
              autoComplete="username"
              placeholder="admin@healthyandtasty.com"
              dir="ltr"
              icon={<Mail className="h-5 w-5" />}
              error={errors.emailOrPhone?.message}
              {...register('emailOrPhone')}
            />
            <Input
              label={t('auth.password')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              icon={<Lock className="h-5 w-5" />}
              rightIcon={showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              onRightIconClick={() => setShowPassword(!showPassword)}
              error={errors.password?.message}
              {...register('password')}
            />

            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="rounded-xl bg-red-50 border border-red-100 px-4 py-2 text-sm text-red-600 font-medium"
                role="alert"
              >
                {error}
              </motion.p>
            )}

            <Button
              type="submit"
              size="lg"
              loading={isLoading}
              className="group relative w-full h-[48px] font-semibold text-sm rounded-[12px] overflow-hidden transition-all duration-300 shadow-lg shadow-purple-300/40 hover:shadow-xl hover:shadow-purple-400/50 hover:-translate-y-0.5 active:translate-y-0"
              style={{
                background: 'linear-gradient(135deg, #4E2F88 0%, #6D3EEA 100%)',
              }}
            >
              <span className="relative z-10 inline-flex items-center gap-2">
                {t('auth.signIn')}
                <ArrowLeft className={`h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 ${isRtl ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
              </span>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'linear-gradient(135deg, #6D3EEA 0%, #8B5CF6 100%)' }}
              />
            </Button>

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between mt-0">
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

      {/* Scrolling brand message */}
      <div className="mt-6 w-full max-w-sm xl:max-w-md mx-auto">
        <div className="scroll-text-mask rounded-2xl bg-white/60 backdrop-blur-sm border border-purple-200/40 shadow-[0_4px_16px_rgba(109,76,255,0.06)]">
          <div className="scroll-text-track py-3.5">
            {[1, 2].map((i) => (
              <span key={i} className="flex items-center gap-2 px-5 whitespace-nowrap text-base font-arabic font-semibold text-[#4C1D95]/80" style={{ fontFamily: 'Cairo, sans-serif' }}>
                <span className="text-lg shrink-0">✨</span>
                <span>
                  <span className="bg-gradient-to-r from-[#8B5CF6] to-[#6D4CFF] bg-clip-text text-transparent font-bold">هيلثي &amp; تيستي</span>
                  {' '}هي علامة تجارية رائدة تقدم{' '}
                  <span className="text-[#22C55E] font-bold">بدائل صحية</span>
                  {' '}لآلاف العملاء في الدول العربية.
                </span>
                <span className="text-purple-300/40 mx-2">✦</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
