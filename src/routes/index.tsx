import { memo, useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createFileRoute } from "@tanstack/react-router";
import { BrandHeader } from "@/components/BrandHeader";
import { CharacterAvatar, CharacterAvatarPreview } from "@/components/CharacterAvatar";
import { Tilt3D } from "@/components/Tilt3D";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CRITERIA, averageScore, buildPodiumGroups, effectiveCriterionScore, isInverseCriterion, useCharacters, type Character, type CriterionKey, type ScoredCharacter } from "@/lib/rating-store";
import { isImageFile, isImageStoreRef, saveImageFile } from "@/lib/image-store";
import { INFINITY_LOGO_URL } from "@/assets/logo";

export const Route = createFileRoute("/")({
  component: Home,
});

type Tab = "roster" | "add" | "rate" | "reveal" | "podium";

function Home() {
  const { list, addCharacter, updateScores, remove, clearAll } = useCharacters();
  const [tab, setTab] = useState<Tab>("roster");
  const [rateId, setRateId] = useState<string | null>(null);

  const rating = list.find((c) => c.id === rateId) ?? null;

  return (
    <div className="min-h-screen">
      <BackgroundFX />
      <BrandHeader />
      <main className="relative z-10 pb-24">
        {tab === "roster" && (
          <RosterView
            list={list}
            onAdd={() => setTab("add")}
            onRate={(id) => { setRateId(id); setTab("rate"); }}
            onReveal={() => setTab("reveal")}
            onRemove={remove}
            onClear={clearAll}
          />
        )}
        <div className="mx-auto max-w-6xl px-4 md:px-8">
        {tab === "add" && (
          <AddView
            onCancel={() => setTab("roster")}
            onCreate={(name, image) => {
              const id = addCharacter(name, image);
              setRateId(id);
              setTab("rate");
            }}
          />
        )}
        {tab === "rate" && rating && (
          <RateView
            character={rating}
            onSave={(scores) => { updateScores(rating.id, scores); setTab("roster"); }}
            onBack={() => setTab("roster")}
          />
        )}
        {tab === "reveal" && (
          <RevealView
            list={list}
            onComplete={() => setTab("podium")}
            onBack={() => setTab("roster")}
          />
        )}
        {tab === "podium" && <PodiumView list={list} onBack={() => setTab("roster")} />}
        </div>
      </main>
    </div>
  );
}

/* ---------- Background FX ---------- */
function BackgroundFX() {
  const orbs = [
    { size: 620, top: "-10%", left: "50%", color: "oklch(0.55 0.30 305 / 45%)", anim: "aurora-drift-1", delay: "0s" },
    { size: 520, top: "40%", left: "-10%", color: "oklch(0.50 0.28 320 / 40%)", anim: "aurora-drift-2", delay: "1.2s" },
    { size: 460, top: "70%", left: "85%", color: "oklch(0.45 0.25 290 / 40%)", anim: "aurora-drift-3", delay: "2.4s" },
    { size: 360, top: "15%", left: "88%", color: "oklch(0.60 0.30 310 / 35%)", anim: "aurora-drift-4", delay: "3.6s" },
  ];

  return (
    <div aria-hidden className="bg-layer pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0"
           style={{ background: "radial-gradient(ellipse at top, oklch(0.22 0.10 305) 0%, oklch(0.12 0.05 295) 55%, oklch(0.08 0.03 290) 100%)" }} />

      <div className="absolute inset-0 opacity-40"
           style={{
             backgroundImage:
               "radial-gradient(1px 1px at 20% 30%, oklch(0.95 0.05 300 / 60%), transparent 60%),\
                radial-gradient(1px 1px at 70% 60%, oklch(0.95 0.05 300 / 45%), transparent 60%),\
                radial-gradient(1.5px 1.5px at 40% 80%, oklch(0.98 0.02 300 / 55%), transparent 60%),\
                radial-gradient(1px 1px at 85% 20%, oklch(0.95 0.05 300 / 50%), transparent 60%),\
                radial-gradient(1px 1px at 10% 70%, oklch(0.95 0.05 300 / 40%), transparent 60%),\
                radial-gradient(1.5px 1.5px at 55% 15%, oklch(0.98 0.02 300 / 55%), transparent 60%)",
             backgroundSize: "600px 600px",
           }} />

      {orbs.map((o, i) => (
        <div
          key={i}
          className={`aurora-orb ${o.anim}`}
          style={{
            width: o.size,
            height: o.size,
            top: o.top,
            left: o.left,
            background: `radial-gradient(circle, ${o.color}, transparent 70%)`,
            animationDelay: o.delay,
          }}
        />
      ))}

      <div className="absolute inset-0"
           style={{ background: "radial-gradient(ellipse at center, transparent 40%, oklch(0.08 0.04 290 / 70%) 100%)" }} />
    </div>
  );
}

/* ---------- Roster ---------- */
function RosterView({
  list, onAdd, onRate, onReveal, onRemove, onClear,
}: {
  list: Character[];
  onAdd: () => void;
  onRate: (id: string) => void;
  onReveal: () => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  return (
    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <HeroBanner onAdd={onAdd} />

      <div className="mx-auto max-w-6xl px-4 md:px-8">
      <div className="mt-10 flex items-center justify-between">
        <h2 className="text-xl font-black md:text-2xl">الشخصيات المضافة <span className="text-muted-foreground">({list.length})</span></h2>
        {list.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                className="text-xs font-bold text-muted-foreground transition hover:text-destructive"
              >
                مسح الكل
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="card-premium max-w-md rounded-3xl border-border/60 bg-background/95 shadow-elevated">
              <AlertDialogHeader className="text-right sm:text-right">
                <AlertDialogTitle className="text-xl font-black">مسح كل التقييمات؟</AlertDialogTitle>
                <AlertDialogDescription className="text-sm leading-relaxed">
                  رح ينمسح كل الشخصيات والتقييمات اللي ضفتها. هالخطوة ما بتراجع عنها.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-row-reverse gap-2 sm:justify-start">
                <AlertDialogAction
                  onClick={onClear}
                  className="rounded-xl border-0 bg-destructive font-black text-destructive-foreground hover:bg-destructive/90"
                >
                  نعم، امسح الكل
                </AlertDialogAction>
                <AlertDialogCancel className="rounded-xl border-border/80 bg-background/40 font-bold">
                  إلغاء
                </AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {list.length === 0 ? (
        <EmptyState onAdd={onAdd} />
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {list.map((c, i) => (
              <CharacterCard key={c.id} character={c} index={i}
                onRate={() => onRate(c.id)}
                onRemove={() => onRemove(c.id)} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {list.length > 0 && (
        <RevealActionBar onReveal={onReveal} />
      )}
      </div>
    </motion.section>
  );
}

/* ---------- Hero Banner ---------- */
function HeroBanner({ onAdd }: { onAdd: () => void }) {
  return (
    <section className="mx-auto max-w-6xl px-4 md:px-8">
      <div className="hero-panel relative overflow-hidden rounded-[2rem] px-6 py-10 text-center md:px-12 md:py-14">
        <div className="hero-panel-glow pointer-events-none absolute inset-0" aria-hidden />
        <div className="hero-panel-grid pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden />

        <div className="relative z-10 flex flex-col items-center">
          <div className="hero-logo-wrap hero-enter-scale mb-6" style={{ animationDelay: "0.08s" }}>
            <img
              src={INFINITY_LOGO_URL}
              alt="Infinity"
              className="relative h-16 w-16 rounded-2xl object-cover ring-1 ring-white/15 shadow-neon md:h-20 md:w-20"
            />
          </div>

          <div
            className="hero-badge hero-enter-fade mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-black tracking-wide md:text-xs"
            style={{ animationDelay: "0.15s" }}
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary shadow-[0_0_8px_oklch(0.65_0.28_305)]" />
            نظام تقييم رسمي · FiveM
          </div>

          <h1
            className="hero-enter-fade max-w-2xl text-3xl font-black leading-[1.15] tracking-tight sm:text-4xl md:text-5xl"
            style={{ animationDelay: "0.2s" }}
          >
            <span className="text-gradient-royal">قيّم الشخصيات</span>
            <span className="mt-2 block text-xl font-bold text-muted-foreground sm:text-2xl md:text-3xl">
              على سيرفر <span className="shimmer-text font-black">Infinity</span>
            </span>
          </h1>

          <p
            className="hero-enter-fade mt-5 max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base"
            style={{ animationDelay: "0.28s" }}
          >
            أضف الشخصيات، قيّمها بهدوء — والنتائج ما بتطلع إلا بكشف سينمائي على لوحة الشرف.
          </p>

          <div
            className="hero-enter-fade mt-8 flex flex-wrap items-center justify-center gap-2 md:gap-3"
            style={{ animationDelay: "0.34s" }}
          >
            <HeroStepChip step="١" label="أضف شخصية" />
            <span className="hero-step-arrow text-muted-foreground/40" aria-hidden>←</span>
            <HeroStepChip step="٢" label="قيّمها" />
            <span className="hero-step-arrow text-muted-foreground/40" aria-hidden>←</span>
            <HeroStepChip step="٣" label="كشف النتائج" highlight />
          </div>

          <div className="hero-enter-fade mt-8" style={{ animationDelay: "0.42s" }}>
            <button
              type="button"
              onClick={onAdd}
              className="btn-primary group rounded-2xl px-8 py-3.5 text-sm font-black shadow-neon transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/15 text-base leading-none transition group-hover:bg-white/25">
                  +
                </span>
                إضافة شخصية
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroStepChip({ step, label, highlight = false }: { step: string; label: string; highlight?: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold md:px-4 md:py-2.5 md:text-sm ${
        highlight
          ? "border border-gold/30 bg-gold/10 text-gold"
          : "border border-border/50 bg-background/30 text-muted-foreground"
      }`}
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-black ${
          highlight ? "bg-gold/20 text-gold" : "bg-primary/15 text-primary"
        }`}
      >
        {step}
      </span>
      {label}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="mt-6 flex flex-col items-center justify-center rounded-3xl glass p-14 text-center">
      <img src={INFINITY_LOGO_URL} alt="Infinity"
        className="animate-empty-float h-20 w-20 rounded-[1.35rem] object-cover shadow-neon ring-1 ring-white/10" />
      <h3 className="mt-6 text-xl font-black">ما في شخصيات لسا</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">أضف الشخصيات وقيّمها — النتائج ما بتبين إلا لما تكشفها.</p>
      <button onClick={onAdd}
        className="btn-primary mt-6 rounded-2xl px-6 py-3 text-sm font-black transition hover:scale-105">
        أضف أول شخصية
      </button>
    </motion.div>
  );
}

const CharacterCard = memo(function CharacterCard({ character, index, onRate, onRemove }: {
  character: Character; index: number;
  onRate: () => void; onRemove: () => void;
}) {
  return (
    <Tilt3D className="h-full" innerClassName="h-full" intensity={10}>
    <motion.article
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: Math.min(index * 0.05, 0.4) }}
      className="card-premium depth-card group relative h-full overflow-hidden rounded-3xl p-5 contain-paint"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-royal opacity-80" />
      <div className="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl transition group-hover:bg-primary/20" />
      <div className="flex items-start gap-4">
        <CharacterAvatar name={character.name} image={character.image} size="md" />
        <div className="flex-1 min-w-0">
          <h3 className="truncate text-lg font-black">{character.name}</h3>
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/10 px-3 py-2">
            <span className="text-base">🔒</span>
            <span className="text-xs font-bold text-primary/90">النتيجة مخفية — بانتظار الكشف</span>
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2 text-center">
        {CRITERIA.map((c) => (
          <div key={c.key} className="criterion-chip rounded-xl py-1.5 text-[10px] opacity-60">
            <div>{c.icon}</div>
            <div className="font-black text-muted-foreground">؟</div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <button onClick={onRate}
          className="btn-primary flex-1 rounded-xl py-2 text-xs font-black">
          تعديل التقييم
        </button>
        <button onClick={onRemove}
          className="rounded-xl border border-border/80 bg-background/30 px-3 text-xs font-bold text-muted-foreground transition hover:border-destructive hover:bg-destructive/10 hover:text-destructive">
          حذف
        </button>
      </div>
    </motion.article>
    </Tilt3D>
  );
});

/* ---------- Add ---------- */
function AddView({ onCancel, onCreate }: { onCancel: () => void; onCreate: (name: string, image: string) => void }) {
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState("");

  const handleFile = async (file: File) => {
    setImageError("");
    if (!isImageFile(file)) {
      setImageError("الملف لازم يكون صورة (JPG, PNG, GIF, WEBP, HEIC...)");
      return;
    }
    setImageLoading(true);
    try {
      const ref = await saveImageFile(file);
      setImage(ref);
    } catch {
      setImageError("ما قدرنا نحفظ الصورة — جرّب مرة ثانية");
    } finally {
      setImageLoading(false);
    }
  };

  const handleUrlChange = (url: string) => {
    setImageError("");
    setImage(url.trim());
  };

  return (
    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pt-6">
      <div className="mx-auto max-w-2xl card-premium rounded-3xl p-8 shadow-elevated">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-gradient-royal">إضافة شخصية جديدة</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              اكتب اسم الشخصية — الصورة اختيارية، وبنحط الاسم بشكل حلو مكانها.
            </p>
          </div>
          <div className="hidden text-4xl sm:block">✦</div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <div className="flex flex-col items-center gap-3">
            <CharacterAvatarPreview name={name} image={image} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">معاينة مباشرة</span>
          </div>

          <div className="w-full flex-1 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-bold">اسم الشخصية</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثلاً: جيمس مورفي"
                className="input-premium w-full rounded-2xl px-4 py-3.5 text-sm"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                مثال: <span className="font-bold text-primary/90">جيمس مورفي</span> · <span className="font-bold text-primary/90">أحمد الراشد</span>
              </p>
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-bold">
                صورة الشخصية
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground">اختياري</span>
              </label>
              <div className="space-y-2">
                <label className={`block cursor-pointer rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3.5 text-center text-xs font-bold text-primary transition hover:border-primary/70 hover:bg-primary/10 ${imageLoading ? "pointer-events-none opacity-60" : ""}`}>
                  {imageLoading ? "جاري رفع الصورة..." : "📁 اختر أي صورة — أي حجم"}
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleFile(file);
                      e.target.value = "";
                    }}
                  />
                </label>
                <input
                  value={isImageStoreRef(image) || image.startsWith("data:") ? "" : image}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="أو الصق رابط صورة من الإنترنت"
                  className="input-premium w-full rounded-xl px-3 py-2.5 text-xs"
                />
                {imageError && (
                  <p className="text-xs font-bold text-destructive">{imageError}</p>
                )}
                {image && (
                  <button type="button" onClick={() => setImage("")}
                    className="text-xs font-bold text-muted-foreground transition hover:text-destructive">
                    إزالة الصورة — استخدم الاسم فقط
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3 border-t border-border/40 pt-6">
          <button onClick={onCancel}
            className="rounded-xl border border-border/80 bg-background/30 px-5 py-2.5 text-sm font-bold text-muted-foreground transition hover:text-foreground">
            إلغاء
          </button>
          <button
            disabled={!name.trim()}
            onClick={() => onCreate(name.trim(), image)}
            className="btn-primary rounded-xl px-6 py-2.5 text-sm font-black disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100">
            التالي: التقييم →
          </button>
        </div>
      </div>
    </motion.section>
  );
}

/* ---------- Reveal Action Bar ---------- */
function RevealActionBar({ onReveal }: { onReveal: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="ratings-action-bar relative mt-12 overflow-hidden rounded-3xl p-6 md:p-8"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-primary/10 via-transparent to-gold/10" />
      <div className="relative text-center">
        <h3 className="text-lg font-black md:text-xl">جاهز للكشف؟</h3>
        <p className="mt-1 text-xs text-muted-foreground md:text-sm">
          لما تخلص التقييم، اضغط لكشف النتيجة النهائية على لوحة الشرف
        </p>

        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={onReveal}
            className="btn-gold rounded-2xl px-10 py-4 text-sm font-black transition hover:scale-105"
          >
            ✨ كشف النتيجة النهائية
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ---------- Rate ---------- */
function RateView({ character, onSave, onBack }: {
  character: Character; onSave: (scores: Record<CriterionKey, number>) => void; onBack: () => void;
}) {
  const [scores, setScores] = useState(character.scores);

  return (
    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pt-6">
      <div className="card-premium rounded-3xl p-6 md:p-10 shadow-elevated">
        <div className="flex flex-col items-center gap-5 md:flex-row md:items-start md:gap-8">
          <CharacterAvatar
            name={character.name}
            image={character.image}
            size="lg"
            showNameInAvatar
          />
          <div className="flex-1 text-center md:text-right">
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">جاري تقييم</div>
            <h2 className="mt-1 text-3xl font-black md:text-4xl">{character.name}</h2>
            <div className="mt-4 rounded-2xl border border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-center md:text-right">
              <div className="text-3xl font-black text-muted-foreground">؟؟</div>
              <p className="mt-1 text-xs font-bold text-muted-foreground">النتيجة ما بتبين — بتنكشف بلوحة الشرف فقط</p>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {CRITERIA.map((c) => {
            const inverse = isInverseCriterion(c.key);
            const raw = scores[c.key];
            const sliderValue = inverse ? 10 - raw : raw;

            return (
            <div key={c.key} className="criterion-card rounded-2xl p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <span className="text-xl">{c.icon}</span> {c.label}
                  </div>
                  {inverse && (
                    <span className="text-[10px] font-bold text-primary/80">كل ما قلّت = أحسن</span>
                  )}
                </div>
                <div className="rounded-lg bg-gradient-royal px-3 py-1 text-sm font-black shadow-neon">
                  {sliderValue}
                </div>
              </div>
              <input type="range" min={0} max={10} step={1}
                value={sliderValue}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setScores((s) => ({ ...s, [c.key]: inverse ? 10 - v : v }));
                }}
                className="range-premium w-full" />
              <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                {inverse ? (
                  <>
                    <span>شخصنة عالية</span>
                    <span>متوسط</span>
                    <span>شخصنة قليلة ✓</span>
                  </>
                ) : (
                  <>
                    <span>0</span><span>5</span><span>10</span>
                  </>
                )}
              </div>
            </div>
            );
          })}
        </div>

        <div className="mt-8 flex justify-between gap-3">
          <button onClick={onBack}
            className="rounded-xl border border-border/80 bg-background/30 px-5 py-2.5 text-sm font-bold text-muted-foreground transition hover:text-foreground">
            ← رجوع
          </button>
          <button onClick={() => onSave(scores)}
            className="btn-primary rounded-xl px-8 py-2.5 text-sm font-black">
            حفظ التقييم
          </button>
        </div>
      </div>
    </motion.section>
  );
}

/* ---------- Reveal Loading ---------- */
const REVEAL_STEPS = [
  "جاري جمع التقييمات...",
  "تحليل المعايير الثمانية...",
  "حساب المتوسطات...",
  "ترتيب لوحة الشرف...",
  "تجهيز الكشف السينمائي...",
] as const;

const REVEAL_DURATION_MS = 4200;

function RevealView({
  list,
  onComplete,
  onBack,
}: {
  list: Character[];
  onComplete: () => void;
  onBack: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const start = Date.now();
    const id = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / REVEAL_DURATION_MS) * 100);
      setProgress(pct);
      setStepIndex(Math.min(REVEAL_STEPS.length - 1, Math.floor((pct / 100) * REVEAL_STEPS.length)));

      if (elapsed >= REVEAL_DURATION_MS) {
        setDone(true);
        window.clearInterval(id);
      }
    }, 48);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(onComplete, 600);
    return () => clearTimeout(timer);
  }, [done, onComplete]);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative flex min-h-[70vh] flex-col items-center justify-center pt-6"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl card-premium p-10 text-center shadow-elevated">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-gold/10" />

        <div className="relative mx-auto flex h-36 w-36 items-center justify-center">
          <div className="portal-ring portal-ring-spin absolute inset-0" />
          <div
            className="portal-ring portal-ring-spin-reverse absolute inset-3"
            style={{ borderColor: "oklch(0.85 0.18 90 / 35%)" }}
          />
          <div className="animate-reveal-logo relative" style={{ transformStyle: "preserve-3d" }}>
            <div className="absolute inset-0 rounded-[1.35rem] bg-gradient-royal blur-2xl opacity-60" />
            <img
              src={INFINITY_LOGO_URL}
              alt="Infinity"
              className="relative mx-auto h-24 w-24 rounded-[1.35rem] object-cover shadow-neon ring-2 ring-white/15"
            />
          </div>
        </div>

        <h2 className="animate-reveal-pulse-text mt-8 text-2xl font-black text-gradient-royal md:text-3xl">
          {done ? "جاهزين!" : "جاري حساب النتائج"}
        </h2>

        <AnimatePresence mode="wait">
          <motion.p
            key={stepIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-3 min-h-[1.5rem] text-sm font-bold text-muted-foreground"
          >
            {done ? "لوحة الشرف جاهزة للكشف..." : REVEAL_STEPS[stepIndex]}
          </motion.p>
        </AnimatePresence>

        <div className="mt-8">
          <div className="mb-2 flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <span>التقدم</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-secondary/80">
            <div
              className="reveal-bar h-full rounded-full transition-[width] duration-150 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {list.slice(0, 6).map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 * i }}
            >
              <CharacterAvatar name={c.name} image={c.image} size="sm" glow={false} />
            </motion.div>
          ))}
          {list.length > 6 && (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary/60 text-xs font-black text-muted-foreground">
              +{list.length - 6}
            </div>
          )}
        </div>

        {!done && (
          <button
            onClick={onBack}
            className="mt-8 text-xs font-bold text-muted-foreground transition hover:text-foreground"
          >
            إلغاء
          </button>
        )}
      </div>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <span
            key={i}
            className="reveal-particle absolute h-1 w-1 rounded-full bg-primary/60"
            style={{
              top: `${10 + (i * 7) % 80}%`,
              left: `${5 + (i * 11) % 90}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${2 + i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </motion.section>
  );
}

/* ---------- Podium ---------- */
function PodiumView({ list, onBack }: { list: Character[]; onBack: () => void }) {
  const { first, second, third, rest } = useMemo(() => buildPodiumGroups(list), [list]);

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-6">
      <div className="mb-8 flex items-center justify-between">
        <button onClick={onBack}
          className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-muted-foreground transition hover:text-foreground">
          ← رجوع
        </button>
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-black shimmer-text md:text-3xl"
        >
          🏆 لوحة الشرف 🏆
        </motion.h2>
        <div className="w-16" />
      </div>

      <div className="podium-scene min-h-[480px] md:min-h-[560px]">
        <div className="podium-floor" aria-hidden />

        <div className="podium-row px-2 pb-8 pt-4 md:px-6">
          {second.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 80, rotateX: 18 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ type: "spring", stiffness: 90, damping: 16, delay: 0.35 }}
              className="podium-slot podium-slot--second order-2 md:order-1"
            >
              <PodiumTierLabel label="المركز الثاني" count={second.length} medal="🥈" />
              <div className="podium-block podium-block--silver" aria-hidden />
              <div className="relative space-y-4 pb-14 md:pb-16">
                {second.map((c, i) => (
                  <Tilt3D key={c.id} intensity={16}>
                    <RunnerUpCard c={c} rank={2} index={i} />
                  </Tilt3D>
                ))}
              </div>
            </motion.div>
          )}

          {first.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.85, rotateX: 20 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 14, delay: 0.15 }}
              className="podium-slot podium-slot--first order-1 md:order-2"
            >
              <PodiumTierLabel label="المركز الأول" count={first.length} medal="👑" />
              <div className="podium-block podium-block--gold" aria-hidden />
              <div className={`relative grid gap-4 pb-20 md:pb-24 ${first.length > 1 ? "grid-cols-1" : ""}`}>
                {first.map((c, i) => (
                  <Tilt3D key={c.id} intensity={12}>
                    <ChampionCard c={c} compact={first.length > 1} index={i} />
                  </Tilt3D>
                ))}
              </div>
            </motion.div>
          )}

          {third.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 80, rotateX: 18 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ type: "spring", stiffness: 90, damping: 16, delay: 0.5 }}
              className="podium-slot podium-slot--third order-3"
            >
              <PodiumTierLabel label="المركز الثالث" count={third.length} medal="🥉" />
              <div className="podium-block podium-block--bronze" aria-hidden />
              <div className="relative space-y-4 pb-12 md:pb-14">
                {third.map((c, i) => (
                  <Tilt3D key={c.id} intensity={16}>
                    <RunnerUpCard c={c} rank={3} index={i} />
                  </Tilt3D>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {rest.length > 0 && (
        <div className="mt-12">
          <h3 className="mb-4 text-lg font-black text-muted-foreground">باقي الترتيب</h3>
          <div className="space-y-3">
            {rest.map((c, i) => (
              <Tilt3D key={c.id} intensity={6}>
                <motion.div
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="depth-card flex items-center gap-4 rounded-2xl glass p-4"
                >
                  <div className="w-10 text-center text-2xl font-black text-muted-foreground">{c.displayRank}</div>
                  <CharacterAvatar name={c.name} image={c.image} size="sm" glow={false} />
                  <div className="flex-1">
                    <div className="font-bold">{c.name}</div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div className="score-bar h-full" style={{ width: `${c.avg * 10}%` }} />
                    </div>
                  </div>
                  <div className="text-xl font-black text-gradient-royal">{c.avg.toFixed(1)}</div>
                </motion.div>
              </Tilt3D>
            ))}
          </div>
        </div>
      )}
    </motion.section>
  );
}

function PodiumTierLabel({ label, count, medal }: { label: string; count: number; medal: string }) {
  return (
    <div className="mb-3 flex items-center justify-center gap-2 text-center">
      <span className="text-xl">{medal}</span>
      <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">{label}</span>
      {count > 1 && (
        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-black text-primary">
          تعادل · {count}
        </span>
      )}
    </div>
  );
}

function ChampionCard({ c, compact = false, index = 0 }: { c: ScoredCharacter; compact?: boolean; index?: number }) {
  return (
    <motion.div
      className="preserve-3d relative animate-hologram"
      initial={{ opacity: 0, y: 20 }}
      animate={{ rotateY: [0, 4, 0, -4, 0], rotateX: [0, -1.5, 0, 1.5, 0], opacity: 1, y: 0 }}
      transition={{
        rotateY: { duration: 12, repeat: Infinity, ease: "easeInOut", delay: index * 0.15 },
        rotateX: { duration: 12, repeat: Infinity, ease: "easeInOut", delay: index * 0.15 },
        opacity: { duration: 0.5, delay: index * 0.1 },
        y: { duration: 0.5, delay: index * 0.1 },
      }}
    >
      {/* orbiting rings */}
      <div className="pointer-events-none absolute -inset-10 flex items-center justify-center">
        <div className="absolute h-full w-full animate-spin-slow rounded-full border-2 border-dashed border-gold/30" style={{ borderColor: "oklch(0.85 0.18 90 / 30%)" }} />
        <div className="absolute h-[85%] w-[85%] animate-spin-slow rounded-full border border-primary/40"
             style={{ animationDirection: "reverse", animationDuration: "14s" }} />
      </div>

      {/* light beams */}
      <motion.div className="absolute inset-x-0 -top-32 mx-auto h-64 w-64"
        animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity }}
        style={{ background: "radial-gradient(circle at 50% 100%, oklch(0.85 0.18 90 / 60%), transparent 60%)" }} />

      <div className="relative overflow-hidden rounded-[2rem] p-1 shadow-gold animate-pulse-glow depth-card"
           style={{ background: "var(--gradient-gold)", transform: "translateZ(30px)" }}>
        <div className={`rounded-[calc(2rem-4px)] bg-background/95 ${compact ? "p-5 md:p-6" : "p-6 md:p-10"}`}>
          {!compact && (
          <motion.div className="absolute left-1/2 top-4 -translate-x-1/2 text-5xl md:text-6xl"
            animate={{ y: [0, -8, 0], rotate: [-5, 5, -5] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
            👑
          </motion.div>
          )}

          <div className={`flex flex-col items-center text-center ${compact ? "mt-2" : "mt-10"}`}>
            <div className="text-xs font-black uppercase tracking-[0.4em] shimmer-text">
              {compact ? "CHAMPION" : "CHAMPION · المركز الأول"}
            </div>

            <div className={`relative ${compact ? "mt-3" : "mt-6"}`}>
              <motion.div className="absolute inset-0 rounded-full blur-3xl"
                style={{ background: "var(--gradient-gold)", opacity: 0.7 }}
                animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 3, repeat: Infinity }} />
              <CharacterAvatar
                name={c.name}
                image={c.image}
                size={compact ? "runner" : "xl"}
                showNameInAvatar
                ringClassName="ring-gold/80"
                style={compact ? undefined : { boxShadow: "0 0 0 6px oklch(0.14 0.06 300), 0 0 0 10px oklch(0.85 0.18 90)" }}
              />
              {!compact && [...Array(6)].map((_, i) => (
                <motion.div key={i} className="absolute text-2xl"
                  style={{
                    top: `${50 + 55 * Math.sin((i / 6) * Math.PI * 2)}%`,
                    left: `${50 + 55 * Math.cos((i / 6) * Math.PI * 2)}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  animate={{ scale: [0.5, 1.2, 0.5], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}>
                  ✨
                </motion.div>
              ))}
            </div>

            <h3 className={`mt-4 font-black text-gradient-gold ${compact ? "text-xl md:text-2xl" : "text-4xl md:text-5xl"}`}>{c.name}</h3>
            <div className="mt-2 flex items-baseline gap-2">
              <motion.span className={`font-black shimmer-text ${compact ? "text-4xl" : "text-7xl md:text-8xl"}`}
                animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                {c.avg.toFixed(1)}
              </motion.span>
              <span className={compact ? "text-sm text-muted-foreground" : "text-xl text-muted-foreground"}>/ 10</span>
            </div>

            <div className={`mt-4 grid w-full gap-2 ${compact ? "grid-cols-4" : "grid-cols-4 md:grid-cols-8"}`}>
              {CRITERIA.map((cr) => (
                <div key={cr.key} className="rounded-xl bg-secondary/60 p-2 text-center">
                  <div className="text-lg">{cr.icon}</div>
                  <div className="text-lg font-black" style={{ color: "oklch(0.90 0.15 90)" }}>{effectiveCriterionScore(cr.key, c.scores[cr.key])}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function RunnerUpCard({ c, rank, index = 0 }: { c: ScoredCharacter; rank: 2 | 3; index?: number }) {
  const gradient = rank === 2 ? "var(--gradient-silver)" : "var(--gradient-bronze)";
  const medal = rank === 2 ? "🥈" : "🥉";
  const label = rank === 2 ? "المركز الثاني" : "المركز الثالث";
  return (
    <motion.div
      className="perspective-1000"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      <div className="relative overflow-hidden rounded-3xl p-[3px] shadow-elevated depth-card" style={{ background: gradient, transform: "translateZ(20px)" }}>
        <div className="rounded-[calc(1.5rem-3px)] bg-background/95 p-6">
          <motion.div className="absolute right-4 top-4 text-5xl"
            animate={{ y: [0, -6, 0], rotate: [-8, 8, -8] }}
            transition={{ duration: 3, repeat: Infinity }}>
            {medal}
          </motion.div>
          <div className="text-xs font-black uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="mt-4 flex items-center gap-4">
            <CharacterAvatar
              name={c.name}
              image={c.image}
              size="runner"
              showNameInAvatar
              ringClassName="ring-2"
              style={{ boxShadow: `0 0 0 3px oklch(0.14 0.06 300), 0 0 0 5px ${rank === 2 ? "oklch(0.85 0.02 280)" : "oklch(0.68 0.14 55)"}` }}
            />
            <div>
              <h3 className="text-2xl font-black">{c.name}</h3>
              <div className="mt-1 text-4xl font-black" style={{
                background: gradient, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
              }}>{c.avg.toFixed(1)}</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-1.5 md:grid-cols-8">
            {CRITERIA.map((cr) => (
              <div key={cr.key} className="rounded-lg bg-secondary/60 py-1 text-center text-xs font-black">
                {effectiveCriterionScore(cr.key, c.scores[cr.key])}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
