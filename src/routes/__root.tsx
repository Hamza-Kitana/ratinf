import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { type ReactNode } from "react";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center glass rounded-3xl p-10">
        <h1 className="text-7xl font-black text-gradient-royal">404</h1>
        <h2 className="mt-4 text-xl font-semibold">الصفحة غير موجودة</h2>
        <p className="mt-2 text-sm text-muted-foreground">الرابط الي دخلته مش موجود.</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-royal px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-neon"
          >
            الرجوع للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center glass rounded-3xl p-10">
        <h1 className="text-xl font-semibold">صار خطأ غير متوقع</h1>
        <p className="mt-2 text-sm text-muted-foreground">جرب تحدث الصفحة أو ارجع للرئيسية.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-xl bg-gradient-royal px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-neon"
          >
            إعادة المحاولة
          </button>
          <a href="/" className="rounded-xl border border-border px-5 py-2.5 text-sm font-bold">الرئيسية</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Infinity Rate — تقييم شخصيات سيرفر انفنتي" },
      { name: "description", content: "منصة تقييم شخصيات سيرفر انفنتي FiveM — قيّم اللاعبين حسب الرول بلاي، الايم، الشخصنة، والتعامل مع الجميع." },
      { property: "og:title", content: "Infinity Rate — تقييم شخصيات سيرفر انفنتي" },
      { property: "og:description", content: "قيّم شخصيات سيرفر انفنتي واعرض لوحة الشرف بأسلوب سينمائي." },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/inf-logo.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "/inf-logo.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/inf-logo.png", type: "image/png", sizes: "512x512" },
      { rel: "shortcut icon", href: "/inf-logo.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/inf-logo.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&family=Cairo:wght@600;800;900&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
