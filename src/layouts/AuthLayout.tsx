import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Package, Truck, ChefHat, Store, TrendingUp } from 'lucide-react';

function MiniChart() {
  return (
    <svg viewBox="0 0 60 24" className="w-full h-6" preserveAspectRatio="none">
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5B34A7" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#5B34A7" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="2" y="12" width="6" height="12" rx="2" fill="#5B34A7" fillOpacity="0.15" />
      <rect x="11" y="6" width="6" height="18" rx="2" fill="#5B34A7" fillOpacity="0.25" />
      <rect x="20" y="9" width="6" height="15" rx="2" fill="#5B34A7" fillOpacity="0.15" />
      <rect x="29" y="3" width="6" height="21" rx="2" fill="#5B34A7" fillOpacity="0.35" />
      <rect x="38" y="7" width="6" height="17" rx="2" fill="#5B34A7" fillOpacity="0.2" />
      <rect x="47" y="2" width="6" height="22" rx="2" fill="#5B34A7" fillOpacity="0.4" />
      <rect x="56" y="4" width="6" height="20" rx="2" fill="#5B34A7" fillOpacity="0.3" />
      <path d="M5 16 Q14 8 23 13 Q32 18 41 11 Q50 4 59 8" fill="none" stroke="#5B34A7" strokeWidth="1.5" strokeOpacity="0.5" />
      <circle cx="59" cy="8" r="2" fill="#5B34A7" fillOpacity="0.6" />
    </svg>
  );
}

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  return (
    <div className="relative min-h-screen flex overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #FFFFFF 0%, #F5F0FF 40%, #EDE6FF 70%, #F5F0FF 100%)' }}
    >
      {/* Purple glow in center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple-300/15 blur-[120px] pointer-events-none" />

      {/* Lighter grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808004_1px,transparent_1px),linear-gradient(to_bottom,#80808004_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

      {/* Left illustration panel */}
      <div className="hidden lg:flex w-[45%] xl:w-1/2 relative items-center justify-center p-8 xl:p-16">
        <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-2xl mx-auto">
          {/* Decorative elements */}
          <div className="absolute -top-20 -start-20 w-72 h-72 rounded-full bg-purple-200/30 blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-20 -end-20 w-72 h-72 rounded-full bg-purple-200/20 blur-[80px] pointer-events-none" />

          {/* Main illustration card */}
          <div className="relative bg-white/80 backdrop-blur-xl rounded-[32px] p-8 shadow-[0_20px_60px_rgba(44,20,88,0.08)] border border-purple-100/40 w-full">
            {/* Today's Overview */}
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="h-4 w-4 text-purple-400" />
              <span className="text-xs font-semibold text-purple-400 tracking-wide uppercase">
                {isRtl ? 'نظرة سريعة' : "Today's Overview"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Header */}
              <div className="col-span-2 flex items-center gap-3 bg-gradient-to-br from-purple-100/80 to-purple-200/50 rounded-2xl p-4 border border-purple-200/30">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-200/60">
                  <Store className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#5B34A7]">Super Admin</p>
                  <p className="text-xs text-purple-500/70">{isRtl ? 'لوحة التحكم' : 'Dashboard'}</p>
                </div>
              </div>

              {/* Products */}
              <div className="bg-gradient-to-br from-green-50/80 to-green-100/40 rounded-2xl p-4 flex flex-col gap-2 border border-green-200/20">
                <div className="flex items-center justify-between">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md shadow-green-200/50">
                    <Package className="h-[18px] w-[18px] text-white" />
                  </div>
                  <MiniChart />
                </div>
                <span className="text-xs font-semibold text-green-700">{isRtl ? 'المنتجات' : 'Products'}</span>
                <span className="text-lg font-bold text-green-800">1,284</span>
              </div>

              {/* Orders */}
              <div className="bg-gradient-to-br from-orange-50/80 to-orange-100/40 rounded-2xl p-4 flex flex-col gap-2 border border-orange-200/20">
                <div className="flex items-center justify-between">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md shadow-orange-200/50">
                    <ShoppingCart className="h-[18px] w-[18px] text-white" />
                  </div>
                  <MiniChart />
                </div>
                <span className="text-xs font-semibold text-orange-700">{isRtl ? 'الطلبات' : 'Orders'}</span>
                <span className="text-lg font-bold text-orange-800">356</span>
              </div>

              {/* Delivery */}
              <div className="bg-gradient-to-br from-purple-50/80 to-purple-100/40 rounded-2xl p-4 flex flex-col items-center gap-2 border border-purple-200/20">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md shadow-purple-200/50">
                  <Truck className="h-[18px] w-[18px] text-white" />
                </div>
                <span className="text-xs font-semibold text-[#5B34A7]">{isRtl ? 'التوصيل' : 'Delivery'}</span>
                <span className="text-lg font-bold text-[#5B34A7]">98%</span>
              </div>

              {/* Chefs */}
              <div className="bg-gradient-to-br from-amber-50/80 to-amber-100/40 rounded-2xl p-4 flex flex-col items-center gap-2 border border-amber-200/20">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md shadow-amber-200/50">
                  <ChefHat className="h-[18px] w-[18px] text-white" />
                </div>
                <span className="text-xs font-semibold text-amber-700">{isRtl ? 'الشيفات' : 'Chefs'}</span>
                <span className="text-lg font-bold text-amber-800">48</span>
              </div>
            </div>
          </div>

          {/* Quote */}
          <div className="text-center">
            <p className="text-sm text-purple-400/50 font-medium tracking-wide uppercase">Healthy & Tasty</p>
            <p className="text-lg text-purple-700/70 font-semibold mt-1">
              {isRtl ? 'تحكم في منصتك بكل سهولة' : 'Manage your platform with ease'}
            </p>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-12 relative">
        <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-purple-300/15 blur-[120px] pointer-events-none" />
        <main className="relative z-10 w-full max-w-sm xl:max-w-md">
          {children}
        </main>
      </div>
    </div>
  );
}
