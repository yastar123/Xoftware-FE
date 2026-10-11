import Config from '@/config';
import React, { useMemo, useState, useEffect } from "react";
import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  Checkbox,
  FormControlLabel,
  Paper,
  IconButton,
  InputAdornment,
  Chip,
  Link as MLink,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  useMediaQuery
} from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";
import { Visibility, VisibilityOff, InfoOutlined, CheckCircleOutline } from "@mui/icons-material";
import { reqOwner, reqApiHttp, reqCheckSession } from "@/lib/requestApi";

// CSR auth check moved to RegisterPage

const SERVICES = [
  {
    key: "wa",
    title: "Layanan Bot Auto Order Whatsapp",
    register: "Rp 20.000 / Durasi 30 Hari",
    extend: "Rp 6000 / 30 Hari",
    features: [
      "Dashboard Analitics ✅",
      "Website ( Free ) ✅",
      "Penjualan Produk Otomatis ✅",
      "Payment Gateway ✅",
      "Bulking Order ✅",
      "Fitur Cashback ✅",
      "Rekap Pendapatan ✅",
      "Fitur Group ✅",
      "Fitur Store / addlist ✅",
      "Peringkat User ✅",
      "Fitur PPOB ✅",
      "Topup Games dan Pulsa  ✅"
    ]
  },
  {
    key: "tele",
    title: "Layanan Bot Auto Order Telegram",
    register: "Rp 20.000 / Durasi 30 Hari",
    extend: "Rp 6000 / 30 Hari",
    features: [
      "Dashboard Analitics ✅",
      "Website ( Free ) ✅",
      "Penjualan Produk Otomatis ✅",
      "Payment Gateway ✅",
      "Bulking Order ✅",
      "Fitur Cashback ✅",
      "Rekap Pendapatan ✅",
      "Peringkat User ✅",
      "Fitur PPOB ✅",
      "Topup Games dan Pulsa  ✅"
    ]
  }
];

const MotionPaper = motion(Paper);

const fieldVariants = {
  hidden: { opacity: 0, y: 16, filter: "blur(2px)" },
  show: (i = 1) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { delay: 0.05 * i, duration: 0.25 }
  })
};

const RegisterPage = () => {
  const isMdUp = useMediaQuery("(min-width:900px)");

  const [step, setStep] = useState(0); // 0=form, 1=otp, 2=success
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    import('js-cookie').then((Cookies) => {
      const token = Cookies.default.get('__access__token__');
      if (token) {
        fetch(`${Config.NEXT_PUBLIC_API}/o2`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: "check" }),
        })
          .then(res => res.json())
          .then(r => {
            if (r?.code === 200 && !r?.error) {
              window.location.href = "/owner";
            }
          })
          .catch(() => { });
      }
    });
  }, []);

  const [captchaImage, setCaptchaImage] = useState("");
  const [captchaCode, setCaptchaCode] = useState("");

  // form state
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [serviceWa, setServiceWa] = useState(true);
  const [serviceTele, setServiceTele] = useState(false);

  // UI helpers
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [openBenefits, setOpenBenefits] = useState(false);

  // OTP
  const [otp, setOtp] = useState("");
  const [paymentLink, setPaymentLink] = useState("");
  const [reffId, setReffId] = useState("");

  // derived
  const serviceChooses = useMemo(() => {
    const arr = [];
    if (serviceWa) arr.push("wa");
    if (serviceTele) arr.push("tele");
    return arr;
  }, [serviceWa, serviceTele]);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const usernameRegex = /^[A-Za-z0-9._-]{3,30}$/;

  const validateClient = () => {
    if (!email) return "Masukkan email";
    if (!username) return "Masukkan username";
    if (!emailRegex.test(email)) return "Format email tidak valid";
    if (!usernameRegex.test(username)) return "Username hanya boleh huruf/angka/._- (3-30 char)";
    if (!password) return "Masukkan password";
    if (!confirmPassword) return "Masukkan konfirmasi password";
    if (password !== confirmPassword) return "Konfirmasi password tidak sama";
    if (password.length < 8 || password.length > 72) return "Password harus 8–72 karakter";
    if (!/[a-z]/.test(password)) return "Password harus mengandung huruf kecil";
    if (!/[A-Z]/.test(password)) return "Password harus mengandung huruf besar";
    if (!/\d/.test(password)) return "Password harus mengandung angka";
    if (serviceChooses.length === 0) return "Pilih minimal satu layanan (WA/Telegram)";
    return null;
  };

  const handleSendOTP = async () => {
    const err = validateClient();
    if (err) return toast.error(err);

    try {
      setIsLoading(true);
      const res = await reqApiHttp('/owner/auth/register', { email, username, password, confirmPassword, serviceChooses, captchaCode });
      setIsLoading(false);

      if (res?.error) return toast.error(res?.message || "Gagal mengirim kode verifikasi");
      toast.success(res?.message || "Kode verifikasi telah dikirim ke email kamu");
      setStep(1);
    } catch (e) {
      setIsLoading(false);
      toast.error(typeof e?.message === "string" ? e.message : "Terjadi kesalahan tak terduga");
    }
  };

  const handleVerifyOTP = async () => {
    if (!/^\d{6}$/.test(otp)) {
      return toast.error("Kode verifikasi harus 6 digit angka");
    }
    try {
      setIsLoading(true);
      const res = await reqApiHttp('/owner/auth/register', { email, username, password, confirmPassword, serviceChooses, codeVerify: otp });
      setIsLoading(false);

      if (res?.error) return toast.error(res?.message || "Kode verifikasi salah");
      // success → dapet link payment
      const link = res?.data?.link;
      const _reff = res?.data?.reffId;
      setPaymentLink(link || "");
      setReffId(_reff || "");
      toast.success(res?.message || "Lanjutkan proses pembayaran");
      setStep(2);
    } catch (e) {
      setIsLoading(false);
      toast.error(typeof e?.message === "string" ? e.message : "Terjadi kesalahan tak terduga");
    }
  };

  const PasswordHint = () => (
    <Stack direction="row" spacing={1} alignItems="center">
      <InfoOutlined fontSize="small" />
      <Typography variant="caption" color="text.secondary">
        Min 8, max 72, wajib ada huruf kecil, huruf besar, dan angka.
      </Typography>
    </Stack>
  );

  useEffect(() => {
    if (step === 0) {
      reqApiHttp('/owner/auth/captcha/register').then((req) => {
        if (req.error) {
          toast.error("Gagal memuat Captcha. Silakan coba lagi.");
        } else {
          setCaptchaImage(req.data.image);
        }
      })
    }
  }, [step]);


  return (
    <Box display="flex" minHeight="100vh" bgcolor="background.default" color="text.primary">
      {/* Left content */}
      <Box flex={1} display="flex" justifyContent="center" alignItems="center" px={2} py={4}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35 }}
            style={{ width: "100%", maxWidth: 520 }}
          >
            <MotionPaper
              elevation={0}
              sx={{
                p: { xs: 2.5, md: 3.5 },
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                backdropFilter: "blur(8px)"
              }}
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25 }}
            >
              <Stack spacing={2}>
                <Typography variant="h5" fontWeight={800} textAlign="center">
                  {step === 0 && "Daftar Akun Baru"}
                  {step === 1 && "Verifikasi Email (OTP)"}
                  {step === 2 && "Pembayaran Diperlukan"}
                </Typography>

                {step === 0 && (
                  <Stack spacing={2}>
                    <motion.div variants={fieldVariants} initial="hidden" animate="show" custom={1}>
                      <TextField
                        label="Email"
                        fullWidth
                        value={email}
                        onChange={(e) => setEmail(e.target.value.trim())}
                        inputProps={{ inputMode: "email" }}
                      />
                    </motion.div>

                    <motion.div variants={fieldVariants} initial="hidden" animate="show" custom={2}>
                      <TextField
                        label="Username"
                        fullWidth
                        value={username}
                        onChange={(e) => setUsername(e.target.value.trim())}
                        helperText="3–30 karakter: huruf/angka/._-"
                      />
                    </motion.div>

                    <motion.div variants={fieldVariants} initial="hidden" animate="show" custom={3}>
                      <TextField
                        label="Password"
                        type={showPass ? "text" : "password"}
                        fullWidth
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowPass((v) => !v)} edge="end">
                                {showPass ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />
                    </motion.div>

                    <motion.div variants={fieldVariants} initial="hidden" animate="show" custom={4}>
                      <TextField
                        label="Konfirmasi Password"
                        type={showConfirm ? "text" : "password"}
                        fullWidth
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowConfirm((v) => !v)} edge="end">
                                {showConfirm ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />
                    </motion.div>

                    <motion.div variants={fieldVariants} initial="hidden" animate="show" custom={5}>
                      <PasswordHint />
                    </motion.div>

                    <motion.div variants={fieldVariants} initial="hidden" animate="show" custom={6}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          background:
                            "linear-gradient(180deg, rgba(99,102,241,0.06), rgba(14,165,233,0.06))"
                        }}
                      >
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="center" justifyContent="space-between">
                          <Typography fontWeight={700}>Pilih Layanan</Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            <Chip
                              label="WA"
                              color={serviceWa ? "primary" : "default"}
                              onClick={() => setServiceWa((v) => !v)}
                              variant={serviceWa ? "filled" : "outlined"}
                              icon={<CheckCircleOutline fontSize="small" />}
                            />
                            <Chip
                              label="Telegram"
                              color={serviceTele ? "primary" : "default"}
                              onClick={() => setServiceTele((v) => !v)}
                              variant={serviceTele ? "filled" : "outlined"}
                              icon={<CheckCircleOutline fontSize="small" />}
                            />
                          </Stack>
                        </Stack>

                        <Divider sx={{ my: 1.5 }} />

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center" justifyContent="space-between">
                          <Stack direction="row" spacing={2} alignItems="center">
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={serviceWa}
                                  onChange={(e) => setServiceWa(e.target.checked)}
                                />
                              }
                              label="Aktifkan WhatsApp"
                            />
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={serviceTele}
                                  onChange={(e) => setServiceTele(e.target.checked)}
                                />
                              }
                              label="Aktifkan Telegram"
                            />
                          </Stack>
                          <Button
                            size="small"
                            startIcon={<InfoOutlined />}
                            onClick={() => setOpenBenefits(true)}
                          >
                            Lihat Keuntungan
                          </Button>
                        </Stack>
                      </Paper>
                    </motion.div>

                    <motion.div variants={fieldVariants} initial="hidden" animate="show" custom={7}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        {captchaImage && (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={`data:image/png;base64, ${captchaImage}`} alt="Captcha Code" style={{ width: 180, height: 'auto', cursor: "pointer" }} />
                          </>
                        )}
                        <TextField
                          label="Code Captcha"
                          type="text"
                          fullWidth
                          value={captchaCode}
                          onChange={(e) => setCaptchaCode(e.target.value)}
                        />
                      </Stack>
                    </motion.div>

                    <motion.div variants={fieldVariants} initial="hidden" animate="show" custom={7}>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={handleSendOTP}
                        disabled={isLoading}
                        sx={{ height: 48, fontWeight: 700 }}
                      >
                        {isLoading ? "Loading..." : "Kirim Kode Verifikasi"}
                      </Button>
                    </motion.div>

                    <Typography variant="caption" color="text.secondary" textAlign="center">
                      Dengan mendaftar, kamu setuju pada{" "}
                      <MLink href="/terms" underline="hover">Ketentuan Layanan</MLink> &{" "}
                      <MLink href="/privacy" underline="hover">Kebijakan Privasi</MLink>.
                    </Typography>
                  </Stack>
                )}

                {step === 1 && (
                  <Stack spacing={2}>
                    <Typography textAlign="center" color="text.secondary">
                      Masukkan 6 digit OTP yang dikirim ke <b>{email}</b>.
                    </Typography>

                    <TextField
                      autoFocus
                      label="Kode OTP"
                      value={otp}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setOtp(v);
                      }}
                      inputProps={{ maxLength: 6, inputMode: "numeric" }}
                    />

                    <Button
                      variant="contained"
                      fullWidth
                      onClick={handleVerifyOTP}
                      disabled={isLoading || otp.length !== 6}
                      sx={{ height: 48, fontWeight: 700 }}
                    >
                      {isLoading ? "Verifying..." : "Verifikasi & Bayar"}
                    </Button>

                    <Button
                      variant="text"
                      fullWidth
                      onClick={handleSendOTP}
                      disabled={isLoading}
                    >
                      Kirim Ulang OTP
                    </Button>
                  </Stack>
                )}

                {step === 2 && (
                  <Stack spacing={2} alignItems="center">
                    <CheckCircleOutline color="success" sx={{ fontSize: 56 }} />
                    <Typography variant="h6" fontWeight={800} textAlign="center">
                      Lanjutkan Proses Pembayaran
                    </Typography>
                    <Typography textAlign="center" color="text.secondary">
                      Ref: <b>{reffId || "-"}</b>
                    </Typography>
                    <Button
                      variant="contained"
                      href={paymentLink || "#"}
                      target="_self"
                      fullWidth
                      sx={{ height: 48, fontWeight: 700 }}
                      disabled={!paymentLink}
                    >
                      Buka Halaman Pembayaran
                    </Button>
                    <Button variant="outlined" fullWidth onClick={() => (window.location.href = "/login")}>
                      Kembali ke Login
                    </Button>
                  </Stack>
                )}
              </Stack>
            </MotionPaper>

            {/* Micro CTA to Login */}
            {step === 0 && (
              <Stack direction="row" justifyContent="center" mt={2}>
                <Typography variant="body2" color="text.secondary">
                  Sudah punya akun?{" "}
                  <MLink href="/login" underline="hover">Masuk</MLink>
                </Typography>
              </Stack>
            )}
          </motion.div>
        </AnimatePresence>
      </Box>

      {/* Right visual */}
      <Box
        flex={1}
        sx={{
          backgroundImage: "url(/login-illustration-image.jpg)", // bisa reuse asset yang sama biar konsisten
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: { xs: "none", md: "block" }
        }}
      />

      {/* Benefits Dialog */}
      <Dialog open={openBenefits} onClose={() => setOpenBenefits(false)} maxWidth="md" fullWidth>
        <DialogTitle fontWeight={800}>Keuntungan Layanan</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            {SERVICES.map((svc, idx) => (
              <motion.div
                key={svc.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Typography variant="h6" fontWeight={800}>{svc.title}</Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <b>Register:</b> {svc.register}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1.5 }}>
                  <b>Perpanjang Layanan:</b> {svc.extend}
                </Typography>
                <Stack component="ul" sx={{ pl: 2 }} spacing={0.5}>
                  {svc.features.map((f, i) => (
                    <Typography key={i} component="li" variant="body2">
                      {f}
                    </Typography>
                  ))}
                </Stack>
                {idx < SERVICES.length - 1 && <Divider sx={{ mt: 2 }} />}
              </motion.div>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBenefits(false)}>Tutup</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RegisterPage;
