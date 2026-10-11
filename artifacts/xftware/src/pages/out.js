import Config from '@/config';
// pages/out.tsx
import { idr } from "@/lib/helper";
import { QrCode2Outlined } from "@mui/icons-material";
import {
  Box,
  Typography,
  Divider,
  CircularProgress,
  Alert,
  Paper,
  Button,
} from "@mui/material";
import { QRCodeSVG } from "qrcode.react";
import { reqApiHttp } from "@/lib/requestApi";
import React from "react";
import Image from "next/image";
import SafeImage from "@/Comp/SafeImage";

const defaultColor = {
  primary: "#6366F1",
  secondary: "#64748B",
  backgroundLight: "#F8FAFC",
  backgroundDark: "#0F172A",
  paperLight: "#FFFFFF",
  paperDark: "#1E293B",
  textLight: "#0F172A",
  textDark: "#FFFFFF",
  customColor: "#EF4444",
};

// CSR migration

function SuccessView({ total, exp, reff, type }) {
  return (
    <Box
      sx={{
        textAlign: "center",
        px: 3,
        pt: 5,
        pb: 8,
        borderRadius: 2,
        background: `linear-gradient(145deg, ${defaultColor.backgroundLight} 0%, ${defaultColor.secondary}10 100%)`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: -20,
          left: -20,
          width: 100,
          height: 100,
          backgroundColor: defaultColor.primary,
          borderRadius: "10%",
          opacity: 0.1,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: -30,
          right: -30,
          width: 120,
          height: 120,
          backgroundColor: defaultColor.secondary,
          borderRadius: "10%",
          opacity: 0.1,
        }}
      />

      <SafeImage
        src="/success_transparent.gif"
        alt="Success"
        width={300}
        height={0}
        style={{
          width: 300,
          height: "auto",
          margin: "auto",
          display: "block",
        }}
      />

      <Typography variant="h5" fontWeight={800} color={defaultColor.customColor} mt={2}>
        Yay! Pembayaran Berhasil 🎉
      </Typography>

      <Typography variant="body2" color={defaultColor.textLight} mb={4}>
        {type == 'buy' ? "Transaksi kamu berhasil. Cek akun kamu di pesan bot!" : "Selamat transaksi mu telah berhasil dan terbayarkan!"}
      </Typography>

      <Box
        sx={{
          textAlign: "left",
          bgcolor: defaultColor.paperLight,
          p: 3,
          borderRadius: 3,
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        }}
      >
        <Typography fontSize="0.875rem" fontWeight={600} color="text.secondary">
          Nomor Referensi
        </Typography>
        <Typography variant="body1" fontWeight={700}>
          {reff}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography fontSize="0.875rem" fontWeight={600} color="text.secondary">
          Jumlah Dibayar
        </Typography>
        <Typography variant="body1" fontWeight={700}>
          {idr(total)}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography fontSize="0.875rem" fontWeight={600} color="text.secondary">
          Waktu Pembayaran
        </Typography>
        <Typography variant="body1" fontWeight={700}>
          {exp}
        </Typography>
        <Button onClick={() => window.history.back()} variant="contained" sx={{ borderRadius: 3, mt: 7, px: 10 }}>Kembali</Button>
      </Box>

      <Typography variant="caption" color="text.secondary" mt={3} display="block">
        {type == 'buy' ? "🧸 Jangan lupa cek pesan dari bot untuk info akun kamu ya!" : "😊 Transaksi nyaman dan aman hanya dengan AMD Payment!"}
      </Typography>
    </Box>
  );
}

export default function Out() {
  const [status, setStatus] = React.useState("loading");
  const [data, setData] = React.useState({});
  const [id, setId] = React.useState(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const queryId = params.get('_id');
      setId(queryId);
      
      if (!queryId) {
        setStatus("failed");
        return;
      }
    }
  }, []);

  React.useEffect(() => {
    if (!id) return;

    const fetchDetail = async () => {
      try {
        const res = await reqApiHttp('/web/user/transaction/detail', { _id: id });

        if (res.error || !res.data) {
          setStatus("failed");
          return;
        }

        setData({
          total: res.data.detail_server?.total || "",
          exp: res.data.detail_server?.exp || "",
          type: res.data?.type || "unknown",
          reff: res.data.reff_id || "",
          node: res.data.detail_server?.qr_string || "",
        });

        setStatus(res.data.status || "pending");
      } catch (err) {
        setStatus("failed");
      }
    };

    fetchDetail();
  }, [id]);

  React.useEffect(() => {
    let intervalId;
    if (status === "pending" && data.reff) {
      intervalId = setInterval(async () => {
        try {
          const res = await reqApiHttp('/web/user/transaction/check', { _id: data.reff });

          if (res && !res.error && res.data?.status) {
            setStatus(res.data.status);
            if (["success", "failed"].includes(res.data.status)) {
              clearInterval(intervalId);
            }
          }
        } catch (e) { }
      }, 5000);
    }
    return () => clearInterval(intervalId);
  }, [status, data.reff]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: defaultColor.backgroundLight,
        px: 2,
        pt: 4,
        pb: 6,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          borderRadius: 2,
          width: "100%",
          maxWidth: "430px",
          p: 3,
          bgcolor: defaultColor.paperLight,
        }}
      >
        {status === "loading" && (
          <Box display="flex" justifyContent="center" alignItems="center" p={4}>
            <CircularProgress />
          </Box>
        )}
        {status === "success" && (
          <SuccessView {...data} />
        )}
        {status !== "loading" && status !== "success" && (
          <>
            <Box textAlign="center">
              <QrCode2Outlined sx={{ fontSize: 64, color: defaultColor.primary }} />
              <Typography variant="h6" fontWeight={800} mt={1} color={defaultColor.primary}>
                Scan QR untuk Membayar
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                Gunakan aplikasi e-wallet untuk menyelesaikan pembayaranmu
              </Typography>
            </Box>

            <Box textAlign="center" mt={3}>
              <Typography variant="caption" fontWeight={500} color="text.secondary">
                Nomor Referensi
              </Typography>
              <Typography variant="body2" fontWeight={700}>
                {data.reff}
              </Typography>
            </Box>

            <Box
              sx={{
                mt: 3,
                borderRadius: 2,
                border: `2px dashed ${defaultColor.secondary}`,
                bgcolor: `${defaultColor.secondary}10`,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                p: 2,
              }}
            >
              <QRCodeSVG
                value={data.node}
                level="H"
                size={220}
                bgColor={defaultColor.paperLight}
                fgColor={defaultColor.primary}
                imageSettings={{
                  src: "/favicon.ico",
                  height: 36,
                  width: 36,
                  excavate: true,
                }}
              />
            </Box>

            <Box textAlign="center" mt={3}>
              <Typography variant="body2" color="text.secondary">
                Jumlah yang harus dibayar
              </Typography>
              <Typography variant="h5" fontWeight={800} color={defaultColor.customColor}>
                {idr(data.total)}
              </Typography>
              <Typography mt={1} variant="body2" color="text.secondary">
                Bayar sebelum: {data.exp}
              </Typography>
            </Box>

            {status === "pending" && (
              <Box mt={3} textAlign="center">
                <CircularProgress size={22} />
                <Typography variant="caption" mt={1} display="block">
                  Menunggu pembayaran...
                </Typography>
              </Box>
            )}

            {status === "failed" && (
              <Alert severity="error" sx={{ mt: 3 }}>
                Transaksi gagal. Silakan ulangi proses.
              </Alert>
            )}

            <Box
              mt={4}
              bgcolor={defaultColor.secondary + "10"}
              p={2}
              borderRadius={2}
              textAlign="center"
              border={`1px dashed ${defaultColor.primary}`}
            >
              <Typography variant="caption" fontWeight={500} color="text.secondary">
                ⚠️ QR ini hanya berlaku satu kali dan memiliki batas waktu.
              </Typography>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}
