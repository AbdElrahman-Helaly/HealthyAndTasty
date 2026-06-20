import React from 'react';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50/60 p-4 overflow-hidden">

      {/* دوائر إضاءة خلفية هادية (Ambient Blur Blobs) بتدي لمسة Premium */}
      <div className="absolute -top-[10%] -start-[10%] w-[400px] h-[400px] rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-[10%] -end-[10%] w-[400px] h-[400px] rounded-full bg-purple-500/10 blur-[100px] pointer-events-none" />

      {/* شبكة جرافيك خفيفة جداً في الخلفية لمزيد من التفاصيل الأنيقة */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

      <main className="relative z-10 w-full max-w-md">
        {children}
      </main>
    </div>
  );
}