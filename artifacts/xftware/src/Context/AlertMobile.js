import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Snackbar, Alert as MuiAlert, Slide } from '@mui/material';

const AlertContext = createContext({
  alert: (message, duration) => {},
});

export const AlertProvider = ({ children }) => {
  const [message, setMessage] = useState(null);
  const [open, setOpen] = useState(false);
  const [hideDuration, setHideDuration] = useState(3000);

  const showAlert = useCallback((msg, duration = 3000) => {
    setMessage(msg);
    setHideDuration(duration);
    setOpen(true);
  }, []);

  const handleClose = () => {
    setOpen(false);
  };

  // Global override for window.alert
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.alert = (msg, duration = 3000) => {
        showAlert(msg, duration);
      };
    }
  }, [showAlert]);

  return (
    <AlertContext.Provider value={{ alert: showAlert }}>
      {children}

      <Snackbar
        open={open}
        onClose={handleClose}
        autoHideDuration={hideDuration}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        TransitionComponent={Slide}
        sx={{ mb: '5rem' }}
      >
        <MuiAlert
          onClose={handleClose}
          severity="info"
          variant="filled"
          sx={{
            borderRadius: 3,
            px: 2,
            py: 1,
            fontSize: 14,
            backgroundColor: '#333',
            color: '#fff',
            boxShadow: 3,
          }}
        >
          {message}
        </MuiAlert>
      </Snackbar>
    </AlertContext.Provider>
  );
};

export const useAlert = () => useContext(AlertContext);
