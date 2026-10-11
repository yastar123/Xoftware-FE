import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Typography } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import SafeImage from '@/Comp/SafeImage';
import { renderWhatsappText } from '../lib/renderFormatWhatsApp';

const DialogPaperContext = createContext();

export const useDialogPaper = () => useContext(DialogPaperContext);

export const DialogPaperProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [scroll, setScroll] = useState('paper');
  const [dialogContent, setDialogContent] = useState({
    title: '',
    text: '',
    image: '',
    onConfirm: null,
    onCancel: null,
    prelineText: false,
  });

  const descriptionElementRef = useRef(null);

  useEffect(() => {
    if (open && descriptionElementRef.current) {
      descriptionElementRef.current.focus();
    }
  }, [open]);

  const openDialogPaper = ({ title, text, image, scrollType = 'paper', onConfirm, onCancel, prelineText = false }) => {
    setDialogContent({ title, text, image, onConfirm, onCancel, prelineText });
    setScroll(scrollType);
    setOpen(true);
  };

  const closeDialogPaper = () => {
    setOpen(false);
  };

  const handleConfirm = () => {
    if (dialogContent.onConfirm) dialogContent.onConfirm();
    closeDialogPaper();
  };

  const handleCancel = () => {
    if (dialogContent.onCancel) dialogContent.onCancel();
    closeDialogPaper();
  };

  return (
    <DialogPaperContext.Provider value={{ openDialogPaper, closeDialogPaper }}>
      {children}

      <Dialog
        open={open}
        onClose={closeDialogPaper}
        scroll={scroll}
        aria-labelledby="scroll-dialog-title"
        aria-describedby="scroll-dialog-description"
      >
        <DialogTitle id="scroll-dialog-title">{dialogContent.title}</DialogTitle>
        <DialogContent dividers={scroll === 'paper'}>
          {dialogContent.image && <SafeImage
            src={dialogContent.image}
            objectFit="cover"
            width={0}
            height={0}
            style={{ width: '100%', height: '100%', borderRadius: 4 }}
            layout="responsive"
            priority
          />}
          <DialogContentText
            id="scroll-dialog-description"
            ref={descriptionElementRef}
            tabIndex={-1}
          >

            {dialogContent.prelineText ?
              <Typography
                variant="body2"
                component="div"
                sx={{
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                  color: "text.primary",
                  fontSize: 14,
                  lineHeight: 1.6,
                }}>{renderWhatsappText(dialogContent.text || "-")}</Typography> :
              <ReactMarkdown>{dialogContent.text}</ReactMarkdown>
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>Abaikan</Button>
          <Button onClick={handleConfirm}>Dibaca</Button>
        </DialogActions>
      </Dialog>
    </DialogPaperContext.Provider>
  );
};