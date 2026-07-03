import React from 'react';
import { ShoppingCart, Package, Truck, ChefHat, Store } from 'lucide-react';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex overflow-hidden bg-[#F8F7FF]"
      style={{ background: 'linear-gradient(135deg, #F8F7FF 0%, #F3F0FD 100%)' }}
    >
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

      {/* Left illustration panel */}
      <div className="hidden lg:flex w-1/2 relative items-center justify-center p-12">
        <div className="relative z-10 flex flex-col items-center gap-8 max-w-md">
          {/* Decorative elements */}
          <div className="absolute -top-20 -start-20 w-72 h-72 rounded-full bg-purple-200/40 blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-20 -end-20 w-72 h-72 rounded-full bg-orange-200/30 blur-[80px] pointer-events-none" />

          {/* Main illustration card */}
          <div className="relative bg-white/70 backdrop-blur-xl rounded-[32px] p-8 shadow-[0_20px_60px_rgba(64,41,110,0.08)] border border-white/50 w-full">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex items-center gap-3 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-200">
                  <Store className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-purple-900">Super Admin</p>
                  <p className="text-xs text-purple-500/80">Dashboard</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl p-4 flex flex-col items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-200">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-semibold text-green-700">Products</span>
                <span className="text-lg font-bold text-green-800">1,284</span>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl p-4 flex flex-col items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-200">
                  <ShoppingCart className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-semibold text-orange-700">Orders</span>
                <span className="text-lg font-bold text-orange-800">356</span>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-4 flex flex-col items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-200">
                  <Truck className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-semibold text-purple-700">Delivery</span>
                <span className="text-lg font-bold text-purple-800">98%</span>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl p-4 flex flex-col items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-200">
                  <ChefHat className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-semibold text-amber-700">Chefs</span>
                <span className="text-lg font-bold text-amber-800">48</span>
              </div>
            </div>
          </div>

          {/* Quote */}
          <div className="text-center">
            <p className="text-sm text-purple-400/60 font-medium tracking-wide uppercase">Healthy & Tasty</p>
            <p className="text-lg text-purple-700/80 font-semibold mt-1">Manage your platform with ease</p>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-12 relative">
        <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-purple-100/30 blur-[120px] pointer-events-none" />
        <main className="relative z-10 w-full max-w-md">
          {children}
        </main>
      </div>
    </div>
  );
}
