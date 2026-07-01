import { memo, useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

type Tilt3DProps = {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  intensity?: number;
  glare?: boolean;
};

function useCanHoverTilt() {
  return useState(() =>
    typeof window === "undefined"
      || window.matchMedia("(hover: hover) and (pointer: fine)").matches,
  )[0];
}

function Tilt3DInner({
  children,
  className,
  innerClassName,
  intensity = 14,
  glare = true,
}: Tilt3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef({ x: 0, y: 0 });

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [intensity, -intensity]), {
    stiffness: 220,
    damping: 32,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-intensity, intensity]), {
    stiffness: 220,
    damping: 32,
  });
  const glareX = useTransform(x, [-0.5, 0.5], ["20%", "80%"]);
  const glareY = useTransform(y, [-0.5, 0.5], ["20%", "80%"]);
  const glareBg = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, oklch(1 0 0 / 25%), transparent 50%)`;

  const flushMove = () => {
    x.set(pendingRef.current.x);
    y.set(pendingRef.current.y);
    rafRef.current = null;
  };

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    pendingRef.current = {
      x: (e.clientX - rect.left) / rect.width - 0.5,
      y: (e.clientY - rect.top) / rect.height - 0.5,
    };
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(flushMove);
    }
  };

  const onLeave = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    x.set(0);
    y.set(0);
  };

  useEffect(() => () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div className={cn("perspective-2000", className)}>
      <motion.div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d", willChange: "transform" }}
        className={cn("group preserve-3d relative", innerClassName)}
      >
        {glare && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] opacity-60"
            style={{ background: glareBg }}
          />
        )}
        {children}
      </motion.div>
    </div>
  );
}

export const Tilt3D = memo(function Tilt3D(props: Tilt3DProps) {
  const canTilt = useCanHoverTilt();

  if (!canTilt) {
    return (
      <div className={cn(props.className, props.innerClassName)}>
        {props.children}
      </div>
    );
  }

  return <Tilt3DInner {...props} />;
});
