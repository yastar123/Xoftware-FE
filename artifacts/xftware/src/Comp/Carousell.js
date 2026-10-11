import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import { Box, Paper } from "@mui/material";
import React from "react";

/* === shimmer placeholder (super ringan) === */
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

/* === <img> blur-up + auto-retry + cached-image fix === */
function ImgWithBlur({
  src,
  alt,
  onErrorFallback = "/image-fallback-error.png",
  retryDelays = [600, 1200, 2400, 4000],
}) {
  const [loaded, setLoaded] = React.useState(false);
  const [tries, setTries] = React.useState(0);
  const [usingFallback, setUsingFallback] = React.useState(false);
  const [currentSrc, setCurrentSrc] = React.useState(src);
  const imgRef = React.useRef(null);

  const placeholder = React.useMemo(
    () => `data:image/svg+xml;base64,${toBase64(shimmer(24, 24))}`,
    []
  );

  React.useEffect(() => {
    setCurrentSrc(src);
    setTries(0);
    setUsingFallback(false);
    setLoaded(false);
  }, [src]);

  // handle case gambar sudah cached (onLoad gak selalu nembak)
  React.useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    const check = () => {
      if (el.complete && el.naturalWidth > 0) {
        if (typeof el.decode === "function") {
          el.decode().catch(() => {}).finally(() => setLoaded(true));
        } else {
          setLoaded(true);
        }
      }
    };
    const raf = requestAnimationFrame(check);
    return () => cancelAnimationFrame(raf);
  }, [currentSrc]);

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
      setLoaded(true);
      return;
    }
    if (tries < retryDelays.length) {
      const nextTry = tries + 1;
      const delay = retryDelays[tries];
      setTries(nextTry);
      setTimeout(() => {
        setLoaded(false);
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
      {/* gambar utama (atau fallback) di atas */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        key={currentSrc}
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
      {/* badge kecil saat retry (opsional) */}
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

export default function Carousell({ banners = [], delay = 3000 }) {
  const timer = React.useRef();
  const [currentSlide, setCurrentSlide] = React.useState(0);

  const [sliderRef, slider] = useKeenSlider({
    loop: true,
    renderMode: "performance",
    slides: { perView: 1 },
    slideChanged(s) {
      setCurrentSlide(s.track.details.rel);
    },
  });

  React.useEffect(() => {
    if (!slider.current || banners.length <= 1) return;
    timer.current = setInterval(() => {
      const current = slider.current?.track?.details?.rel ?? 0;
      slider.current?.moveToIdx((current + 1) % banners.length);
    }, delay);
    return () => clearInterval(timer.current);
  }, [slider, banners.length, delay]);

  return (
    <Paper sx={{ mx: 2, p: 1, mb: 3 }}>
      <Box
        ref={sliderRef}
        className="keen-slider"
        sx={{
          width: 413,
          height: 163,
          overflow: "hidden",
          borderRadius: 2,
          mx: "auto",
          boxShadow: 2,
        }}
      >
        {banners.map((src, i) => (
          <Box
            key={i}
            className="keen-slider__slide"
            sx={{ position: "relative", width: "100%", height: "100%" }}
          >
            <ImgWithBlur src={src} alt={`slide-${i}`} />
          </Box>
        ))}
        {/* dots */}
        <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
          {banners.map((_, i) => (
            <Box
              key={i}
              sx={{
                width: 8,
                height: 8,
                borderRadius: "10%",
                backgroundColor: currentSlide === i ? "#6366F1" : "#ccc",
                transition: "background-color 0.3s",
              }}
            />
          ))}
        </Box>
      </Box>
    </Paper>
  );
}
