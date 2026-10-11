import React, { createContext, useContext, useState, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
} from "@mui/material";
import { Close } from "@mui/icons-material";

const PengumumanContext = createContext();

export default function PengumumanProvider({ children }) {
  const [popup, setPopup] = useState(null);
  const [onMarkAsReadHandler, setOnMarkAsReadHandler] = useState(null);

  const showPengumuman = useCallback((data, options = {}) => {
    setPopup(data);
    setOnMarkAsReadHandler(() => options.onMarkAsRead || null);
  }, []);

  const handleClose = () => {
    setPopup(null);
    setOnMarkAsReadHandler(null);
  };

  const markAsRead = async (id) => {
    if (onMarkAsReadHandler) {
      try {
        await onMarkAsReadHandler(id);
      } catch (err) {
        console.error("Gagal mengirim markAsRead:", err);
      }
    }
    handleClose();
  };

  return (
    <PengumumanContext.Provider value={{ showPengumuman }}>
      {children}

      <Dialog open={!!popup} onClose={handleClose} fullWidth scroll="paper">
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography>{popup?.title}</Typography>
          <IconButton onClick={handleClose}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ maxHeight: '80vh', overflowY: 'auto' }}>
          <Typography fontSize={14} whiteSpace="pre-line">
            {popup?.content}
          </Typography>
        </DialogContent>

        {/* Tampilkan tombol hanya jika belum dibaca */}
        {popup && popup.is_read === false && (
          <DialogActions>
            <Button fullWidth variant="contained" onClick={() => markAsRead(popup.id)}>
              Tandai Sudah Dibaca
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </PengumumanContext.Provider>
  );
}

export const usePengumuman = () => {
  const context = useContext(PengumumanContext);
  if (!context) {
    throw new Error("usePengumuman harus digunakan di dalam PengumumanProvider");
  }
  return context;
};
