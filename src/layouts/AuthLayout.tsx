import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Package, Truck, ChefHat, Store, TrendingUp, TrendingDown } from 'lucide-react';

function MiniChart({ color = '#5B34A7', height = 20 }: { color?: string; height?: number }) {
  return (
    <svg viewBox={`0 0 60 ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <rect x="2" y={height * 0.5} width="6" height={height * 0.5} rx="2" fill={color} fillOpacity="0.25" />
      <rect x="11" y={height * 0.25} width="6" height={height * 0.75} rx="2" fill={color} fillOpacity="0.35" />
      <rect x="20" y={height * 0.38} width="6" height={height * 0.62} rx="2" fill={color} fillOpacity="0.25" />
      <rect x="29" y={height * 0.12} width="6" height={height * 0.88} rx="2" fill={color} fillOpacity="0.45" />
      <rect x="38" y={height * 0.29} width="6" height={height * 0.71} rx="2" fill={color} fillOpacity="0.3" />
      <rect x="47" y={height * 0.08} width="6" height={height * 0.92} rx="2" fill={color} fillOpacity="0.5" />
      <rect x="56" y={height * 0.17} width="6" height={height * 0.83} rx="2" fill={color} fillOpacity="0.4" />
    </svg>
  );
}

function ChangeBadge({ value, isUp }: { value: string; isUp: boolean }) {
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${isUp ? 'text-green-600' : 'text-red-500'}`}>
      {isUp ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
      {value}
    </span>
  );
}

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  return (
    <div className="relative h-screen flex overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #FFFFFF 0%, #F5F0FF 40%, #EDE6FF 70%, #F5F0FF 100%)' }}
    >
      {/* Purple glow in center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-purple-300/15 blur-[120px] pointer-events-none" />

      {/* Lighter grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808004_1px,transparent_1px),linear-gradient(to_bottom,#80808004_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

      {/* Left illustration panel */}
      <div className="hidden lg:flex w-[48%] xl:w-[48%] relative items-center justify-center p-4 xl:p-6">
        <div className="relative z-10 flex flex-col items-center gap-2 w-full max-w-xl mx-auto">
          {/* Decorative elements */}
          <div className="absolute -top-16 -start-16 w-56 h-56 rounded-full bg-purple-200/30 blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-16 -end-16 w-56 h-56 rounded-full bg-purple-200/20 blur-[80px] pointer-events-none" />

          {/* Main illustration card */}
          <div className="relative bg-white/80 backdrop-blur-md rounded-[24px] p-6 shadow-[0_16px_48px_rgba(44,20,88,0.10)] border border-purple-200/60 w-full">
            {/* Today's Overview */}
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-3.5 w-3.5 text-purple-500" />
              <span className="text-[10px] font-semibold text-purple-500 tracking-wide uppercase">
                {isRtl ? 'نظرة سريعة' : "Today's Overview"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Header */}
              <div className="col-span-2 flex items-center gap-3 bg-gradient-to-br from-purple-100 to-purple-200/70 rounded-xl p-3 border border-purple-300/50 shadow-sm">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md shadow-purple-200/60">
                  <Store className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#5B34A7]">Super Admin</p>
                  <p className="text-[11px] text-purple-500/80">{isRtl ? 'لوحة التحكم' : 'Dashboard'}</p>
                </div>
              </div>

              {/* Orders */}
              <div className="col-span-2 bg-gradient-to-br from-orange-50 to-orange-100/60 rounded-xl p-4 flex flex-col gap-1.5 border border-orange-300/50 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md shadow-orange-200/50">
                      <ShoppingCart className="h-[18px] w-[18px] text-white" />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-orange-700">{isRtl ? 'الطلبات' : 'Orders'}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xl font-bold text-orange-800">356</span>
                        <ChangeBadge value="+12.5%" isUp />
                      </div>
                    </div>
                  </div>
                  <div className="w-24">
                    <MiniChart color="#EA580C" height={28} />
                  </div>
                </div>
              </div>

              {/* Products */}
              <div className="bg-gradient-to-br from-green-50 to-green-100/60 rounded-xl p-3 flex flex-col gap-1.5 border border-green-300/50 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md shadow-green-200/50">
                    <Package className="h-4 w-4 text-white" />
                  </div>
                  <MiniChart color="#16A34A" />
                </div>
                <span className="text-[11px] font-semibold text-green-700">{isRtl ? 'المنتجات' : 'Products'}</span>
                <div className="flex items-end justify-between">
                  <span className="text-base font-bold text-green-800">1,284</span>
                  <ChangeBadge value="+4.2%" isUp />
                </div>
              </div>

              {/* Delivery */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100/60 rounded-xl p-3 flex flex-col gap-1.5 border border-purple-300/50 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md shadow-purple-200/50">
                    <Truck className="h-4 w-4 text-white" />
                  </div>
                  <MiniChart color="#5B34A7" />
                </div>
                <span className="text-[11px] font-semibold text-[#5B34A7]">{isRtl ? 'التوصيل' : 'Delivery'}</span>
                <div className="flex items-end justify-between">
                  <span className="text-base font-bold text-[#5B34A7]">98%</span>
                  <ChangeBadge value="-0.8%" isUp={false} />
                </div>
              </div>

              {/* Chefs */}
              <div className="col-span-2 bg-gradient-to-br from-amber-50 to-amber-100/60 rounded-xl p-3 flex items-center justify-between border border-amber-300/50 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md shadow-amber-200/50">
                    <ChefHat className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-amber-700">{isRtl ? 'الشيفات' : 'Chefs'}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-base font-bold text-amber-800">48</span>
                      <ChangeBadge value="+2" isUp />
                    </div>
                  </div>
                </div>
                <MiniChart color="#D97706" />
              </div>
            </div>
          </div>

          {/* Quote */}
          <div className="text-center">
            <p className="text-xs text-purple-400/50 font-medium tracking-wide uppercase">Healthy & Tasty</p>
            <p className="text-sm text-purple-700/80 font-semibold mt-0.5">
              {isRtl ? 'لوحة تحكم احترافية لإدارة Healthy & Tasty' : 'Manage your platform with ease'}
            </p>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-6 relative">
        <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-purple-300/15 blur-[100px] pointer-events-none" />

        <main className="relative z-10 w-full max-w-sm xl:max-w-md">
          {children}
        </main>
      </div>
    </div>
  );
}
