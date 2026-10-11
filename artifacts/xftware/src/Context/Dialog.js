import React, {
  createContext,
  useContext,
  useState,
  forwardRef,
  useEffect,
  useCallback,
} from "react";
import {
  Dialog,
  DialogContent,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  useMediaQuery,
  Slide,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useTheme } from "@mui/material/styles";

const DialogContext = createContext();

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export const DialogProvider = ({ children }) => {
  const [dialogState, setDialogState] = useState({
    open: false,
    title: "",
    content: null,
    actions: null,
    onSubmit: null,
    popOver: false,
  });

  const theme = useTheme();
  const isFullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const openDialog = useCallback(
    (title, content, actions = null, onSubmit = null, popOver) => {
      setDialogState({
        open: true,
        title,
        content,
        actions,
        onSubmit,
        popOver,
      });
    },
    []
  );

  const closeDialog = useCallback(() => {
    setDialogState((prevState) => ({
      ...prevState,
      open: false,
    }));
  }, []);

  const handleSubmit = useCallback(
    (data) => {
      if (dialogState.onSubmit) {
        dialogState.onSubmit(data);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dialogState.onSubmit]
  );

  useEffect(() => {
    if (dialogState.open) {
      console.log("Dialog is now open:", dialogState);
    }
  }, [dialogState]);

  return (
    <DialogContext.Provider value={{ openDialog, closeDialog }}>
      {children}
      <Dialog
        open={dialogState.open}
        onClose={closeDialog}
        fullScreen={dialogState.popOver ? false : isFullScreen}
        TransitionComponent={Transition}
        aria-labelledby="responsive-dialog-title"
        PaperProps={{
          sx: {
            overflow: "hidden",
          },
        }}
      >
        <AppBar
          position="sticky"
          sx={{
            backgroundColor: "white",
            color: "black",
            boxShadow: theme.shadows[1],
          }}
        >
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              {dialogState.title}
            </Typography>
            <IconButton edge="end" onClick={closeDialog} aria-label="close">
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        <DialogContent sx={{ padding: 2 }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = Object.fromEntries(new FormData(e.target));
              handleSubmit(formData);
            }}
          >
            {dialogState.content}
            {dialogState.actions && (
              <div
                style={{
                  marginTop: "16px",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "8px",
                }}
              >
                {dialogState.actions}
              </div>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </DialogContext.Provider>
  );
};

export const useDialog = () => useContext(DialogContext);
