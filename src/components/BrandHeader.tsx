import { INFINITY_LOGO_URL } from "@/assets/logo";
import { motion } from "framer-motion";

export function BrandHeader() {
  return (
    <header className="relative z-10 flex items-center justify-between px-6 py-6 md:px-10">
      <div className="flex items-center gap-3">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="relative"
        >
          <div className="absolute inset-0 rounded-[1.35rem] bg-gradient-royal blur-xl opacity-70" />
          <img
            src={INFINITY_LOGO_URL}
            alt="Infinity"
            className="relative h-12 w-12 rounded-[1.35rem] object-cover shadow-neon ring-1 ring-white/10 md:h-14 md:w-14"
          />
        </motion.div>
        <div className="flex flex-col leading-tight">
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">Infinity</span>
          <span className="text-lg font-black text-gradient-royal md:text-xl">تقييم الشخصيات</span>
        </div>
      </div>
      <div className="hidden items-center gap-2 rounded-full glass px-4 py-2 text-xs font-bold text-muted-foreground md:flex">
        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_10px_theme(colors.emerald.400)]" />
        FiveM · Infinity Server
      </div>
    </header>
  );
}
