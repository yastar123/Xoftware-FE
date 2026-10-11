import React from "react";
import { idr } from "@/lib/helper";
import { useRouter } from "next/router";
import {
  Box,
  ButtonBase,
  Chip,
  Grid2 as Grid,
  Paper,
  Typography,
  Skeleton,
} from "@mui/material";
import { motion } from "framer-motion";

const MotionPaper = motion(Paper);

// --- shimmer SVG + base64 util (placeholder) ---
const shimmer = (w, h) => `
<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" version="1.1">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#eee" offset="20%" />
      <stop stop-color="#ddd" offset="50%" />
      <stop stop-color="#eee" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#eee" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite" />
</svg>`.trim();

const toBase64 = (str) =>
  typeof window === "undefined" ? Buffer.from(str).toString("base64") : window.btoa(str);

// --- <img> blur-up + auto-retry + cached-image fix (drop-in) ---
function ImgWithBlur({
  src,
  alt,
  onErrorFallback = "/image-fallback-error.png",
  retryDelays = [600, 1200, 2400, 3000, 4000, 5000],
}) {
  const [loaded, setLoaded] = React.useState(false);
  const [tries, setTries] = React.useState(0);
  const [usingFallback, setUsingFallback] = React.useState(false);
  const [currentSrc, setCurrentSrc] = React.useState(src);
  const imgRef = React.useRef(null);

  // shimmer kecil buat placeholder (pakai util shimmer & toBase64 yang sudah ada di file)
  const placeholder = React.useMemo(
    () => `data:image/svg+xml;base64,${toBase64(shimmer(24, 24))}`,
    []
  );

  // reset state saat src berubah
  React.useEffect(() => {
    setCurrentSrc(src);
    setTries(0);
    setUsingFallback(false);
    setLoaded(false);
  }, [src]);

  // ✅ FIX: kalau image sudah pernah ke-load (cached), mark loaded segera
  React.useEffect(() => {
    const el = imgRef.current;
    if (!el) return;

    const check = () => {
      if (el.complete && el.naturalWidth > 0) {
        // decode biar transisinya mulus; fallback ke setLoaded langsung kalau decode gak ada/failed
        if (typeof el.decode === "function") {
          el.decode().catch(() => {}).finally(() => setLoaded(true));
        } else {
          setLoaded(true);
        }
      }
    };

    // Tunggu satu frame biar DOM ready sebelum cek
    const raf = requestAnimationFrame(check);
    return () => cancelAnimationFrame(raf);
  }, [currentSrc]);

  // cache-buster untuk retry
  const addBust = (u, n) => {
    try {
      const base = typeof window !== "undefined" ? window.location.href : "http://x";
      const url = new URL(u, base);
      url.searchParams.set("_cb", `${Date.now()}-${n}`);
      return url.toString();
    } catch {
      return `${u}${u.includes("?") ? "&" : "?"}_cb=${Date.now()}-${n}`;
    }
  };

  const handleError = () => {
    if (usingFallback) {
      // fallback juga error → stop loop
      setLoaded(true);
      return;
    }
    if (tries < retryDelays.length) {
      const nextTry = tries + 1;
      const delay = retryDelays[tries];
      setTries(nextTry);
      setTimeout(() => {
        setLoaded(false); // tetap di placeholder selama retry
        setCurrentSrc(addBust(src, nextTry));
      }, delay);
    } else {
      setUsingFallback(true);
      setCurrentSrc(onErrorFallback);
    }
  };

  return (
    <>
      {/* placeholder blur di bawah */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={placeholder}
        alt=""
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "blur(20px)",
          transform: "scale(1.05)",
          zIndex: 0,
        }}
      />

      {/* gambar high-res (atau fallback) di atas */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        key={currentSrc}               // bantu force lifecycle yang konsisten saat src berubah
        src={currentSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={handleError}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          zIndex: 1,
          opacity: loaded ? 1 : 0,
          transition: "opacity .6s ease",
        }}
      />

      {/* optional badge retry */}
      {!loaded && tries > 0 && !usingFallback && (
        <div
          style={{
            position: "absolute",
            bottom: 8,
            right: 8,
            zIndex: 4,
            padding: "2px 8px",
            fontSize: 10,
            borderRadius: 2,
            background: "rgba(0,0,0,.45)",
            color: "#fff",
          }}
        >
          Retrying… {tries}/{retryDelays.length}
        </div>
      )}
    </>
  );
}

function ProductSkeleton() {
  return (
    <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2 }} sx={{ px: 0.5, mb: 1 }}>
      <Paper elevation={0} sx={{ p: 1, borderRadius: 3 }}>
        <Box sx={{ aspectRatio: "1/1", borderRadius: 2, overflow: "hidden", mb: 1 }}>
          <Skeleton variant="rectangular" width="100%" height="100%" />
        </Box>
        <Skeleton variant="text" sx={{ fontSize: 14, width: "80%" }} />
        <Skeleton variant="text" sx={{ fontSize: 12, width: "40%" }} />
        <Skeleton variant="rounded" height={24} sx={{ mt: 1, width: "60%" }} />
      </Paper>
    </Grid>
  );
}

export default function CardProduct({
  dataProduct = [],
  loading = false,
  loadingLength = 6,
}) {
  const router = useRouter();
  const isLoading = typeof loading === "object" ? !!loading.product : !!loading;
  const skeletons = Array.from({ length: loadingLength });
  const base = router.query?.owner ? `/${router.query.owner}` : "";

  return (
    <Grid container spacing={0} sx={{ width: "100%" }}>
      {isLoading && dataProduct.length === 0
        ? skeletons.map((_, i) => <ProductSkeleton key={`sk-${i}`} />)
        : dataProduct.map((item, i) => {
            const title = item.title || item.name || "Produk";
            const img = item.image || item.icon || item.thumbnail || "/image-fallback-error.png";
            const price = item.price ?? item.harga ?? 0;
            const remain = item.remaining ?? item.remaining_stock ?? item.available_stock;
            const href = item.link || (item.id ? `${base}/produk/${item.id}` : undefined);

            return (
              <Grid key={i} size={{ xs: 6, sm: 4, md: 3, lg: 2 }} sx={{ px: 0.5, mb: 1 }}>
                <MotionPaper
                  elevation={2}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  sx={{
                    p: 1,
                    borderRadius: 3,
                    overflow: "hidden",
                    position: "relative",
                    backdropFilter: "blur(2px)",
                  }}
                >
                  <ButtonBase
                    onClick={() => href && router.push(href)}
                    sx={{
                      display: "block",
                      textAlign: "left",
                      width: "100%",
                      borderRadius: 2,
                    }}
                  >
                    {/* image container */}
                    <Box
                      sx={{
                        position: "relative",
                        aspectRatio: "1/1",
                        width: "100%",
                        overflow: "hidden",
                        borderRadius: 2,
                        mb: 1,
                        background: (t) =>
                          t.palette.mode === "dark"
                            ? "rgba(255,255,255,0.04)"
                            : "rgba(0,0,0,0.04)",
                      }}
                    >
                      {/* gambar with blur-up */}
                      <ImgWithBlur src={img} alt={title} />

                      {/* gradient overlay di atas gambar */}
                      <Box
                        sx={{
                          position: "absolute",
                          inset: 0,
                          background:
                            "linear-gradient(180deg, rgba(127,127,127,0.06), transparent 40%, rgba(0,0,0,0.08) 100%)",
                          zIndex: 2,
                          pointerEvents: "none",
                        }}
                      />

                      {/* stock badge di paling atas */}
                      {Number.isFinite(+remain) && (
                        <Chip
                          size="small"
                          label={`Sisa ${remain}`}
                          sx={{
                            position: "absolute",
                            top: 8,
                            left: 8,
                            zIndex: 3,
                            bgcolor: "background.paper",
                            fontWeight: 600,
                          }}
                        />
                      )}
                    </Box>

                    {/* text */}
                    <Typography noWrap fontWeight={700} sx={{ fontSize: 13, mb: 0.5 }}>
                      {title}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8, fontSize: 11, mb: 1 }}>
                      Terjual: {item.sold ?? 0}
                    </Typography>

                    {/* price pill */}
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        px: 1,
                        py: 0.5,
                        borderRadius: 2,
                        bgcolor: "secondary.main",
                        color: "#fff",
                        fontWeight: 800,
                        fontSize: 12,
                      }}
                    >
                      {idr(price)}
                    </Box>
                  </ButtonBase>
                </MotionPaper>
              </Grid>
            );
          })}
    </Grid>
  );
}
