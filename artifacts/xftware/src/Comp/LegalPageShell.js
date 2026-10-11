// components/LegalPageShell.js
import React from "react"
import {
  Box,
  Container,
  Typography,
  Stack,
  Paper,
  Divider,
  IconButton,
  useMediaQuery,
  Link as MLink,
} from "@mui/material"
import { motion } from "framer-motion"
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew"
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"
import Head from "next/head"
import { useRouter } from "next/router"

const MotionBox = motion(Box)
const MotionPaper = motion(Paper)

const sectionVariants = {
  hidden: { opacity: 0, y: 16, filter: "blur(2px)" },
  show: (i = 1) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { delay: 0.03 * i, duration: 0.3 },
  }),
}

// helper: pecah string jadi array paragraf berdasarkan 2x newline
function splitParagraphs(content = "") {
  return content
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean)
}

const LegalPageShell = ({ title, metaTitle, content }) => {
  const router = useRouter()
  const isMdUp = useMediaQuery("(min-width:900px)")
  const paragraphs = splitParagraphs(content)

  return (
    <>
      <Head>
        <title>{metaTitle || title}</title>
      </Head>

      <Box
        sx={{
          background: "#FFF",
          minHeight: "100vh",
          // background:
          //   "radial-gradient(circle at top, rgba(96,165,250,0.16) 0, transparent 55%), radial-gradient(circle at bottom, rgba(52,211,153,0.12) 0, transparent 55%), #020617",
          color: "grey.700",
          py: { xs: 6, md: 8 },
        }}
      >
        <Container maxWidth="md">
          {/* Header */}
          <Stack direction="row" alignItems="center" spacing={2} mb={4}>
            <IconButton
              onClick={() => router.back()}
              sx={{
                color: "grey.700",
                borderRadius: "6px",
                border: "1px solid rgba(148,163,184,0.4)",
                backdropFilter: "blur(8px)",
                "&:hover": {
                  borderColor: "primary.main",
                  bgcolor: "rgba(15,23,42,0.8)",
                },
              }}
            >
              <ArrowBackIosNewIcon sx={{ fontSize: 18 }} />
            </IconButton>
            <Box>
              <Typography
                variant={isMdUp ? "h4" : "h5"}
                sx={{ fontWeight: 700, letterSpacing: 0.3 }}
              >
                {title}
              </Typography>
              <Typography variant="body2" sx={{ color: "grey.800", mt: 0.5 }}>
                PT Xoftware Digital Indonesia · xoftware.id
              </Typography>
            </Box>
          </Stack>

          <MotionPaper
            elevation={0}
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4 }}
            sx={{
              borderRadius: 3,
              px: { xs: 2.5, md: 4 },
              py: { xs: 3, md: 4 },
              // bgcolor: "rgba(15,23,42,0.92)",
              border: "1px solid rgba(148,163,184,0.4)",
              // boxShadow:
              //   "0 24px 60px rgba(15,23,42,0.9), 0 0 0 1px rgba(148,163,184,0.25)",
            }}
          >
            <Stack spacing={2.5}>
              {paragraphs.map((p, idx) => (
                <MotionBox
                  key={idx}
                  custom={idx + 1}
                  variants={sectionVariants}
                  initial="hidden"
                  animate="show"
                >
                  {/* heuristik kecil: kalau baris mulai angka+dot jadikan subjudul */}
                  {/^(\d+)\.\s/.test(p) ? (
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, mb: 0.5 }}
                    >
                      {p}
                    </Typography>
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{ color: "grey.800", whiteSpace: "pre-wrap" }}
                    >
                      {p}
                    </Typography>
                  )}
                </MotionBox>
              ))}

              <Divider sx={{ borderColor: "rgba(51,65,85,0.9)", my: 1 }} />

              <Stack direction="row" spacing={1} alignItems="center">
                <InfoOutlinedIcon sx={{ fontSize: 18, color: "primary.light" }} />
                <Typography variant="caption" sx={{ color: "grey.600" }}>
                  Untuk pertanyaan lebih lanjut, silakan hubungi kami melalui kontak
                  resmi yang tertera di situs{" "}
                  <MLink
                    href="https://xoftware.id"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ color: "primary.light", textDecoration: "none" }}
                  >
                    xoftware.id
                  </MLink>
                  .
                </Typography>
              </Stack>
            </Stack>
          </MotionPaper>

          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Typography variant="caption" sx={{ color: "grey.500" }}>
              Kembali ke{" "}
              <MLink
                href="/"
                sx={{ color: "primary.light", textDecoration: "none" }}
              >
                Halaman utama
              </MLink>
            </Typography>
          </Box>
        </Container>
      </Box>
    </>
  )
}

export default LegalPageShell
