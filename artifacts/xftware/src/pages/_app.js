import "../styles/globals.css";
import 'react-toastify/dist/ReactToastify.css';
import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file
import { Inter } from 'next/font/google';
import { Slide, ToastContainer } from "react-toastify";
import { DialogProvider } from "@/Context/Dialog";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DialogPaperProvider } from "@/Context/DialogPaper";
import { AlertProvider } from "@/Context/AlertMobile";
import { SocketProvider } from "@/Context/SocketContext";
import { UpdateProvider } from "@/Context/UpdateContext";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from "@vercel/analytics/next"
import * as React from 'react';
import ThemeToggleProvider from "@/Context/ThemeContext";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";

const inter = Inter({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'] })

export default function App({ Component, pageProps }) {

  return (
    <div className={inter.className}>
      <ThemeToggleProvider>
        <CssBaseline />
        <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <AlertProvider>
              <DialogProvider>
                <DialogPaperProvider>
                  <SocketProvider>
                    <UpdateProvider>
                    <ToastContainer
                      position="top-left"
                      autoClose={2000}
                      hideProgressBar
                      newestOnTop={false}
                      closeOnClick
                      rtl={false}
                      pauseOnFocusLoss
                      draggable
                      pauseOnHover
                      theme="light"
                      transition={Slide}
                    />
                    <Component {...pageProps} />
                    <SpeedInsights />
                    <Analytics />
                    </UpdateProvider>
                  </SocketProvider>
                </DialogPaperProvider>
              </DialogProvider>
            </AlertProvider>
          </LocalizationProvider>
        </Box>
      </ThemeToggleProvider>
    </div>
  )
}
