import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { COLORS } from "../../consts";
import { ReactNode } from "react";

const ConfirmationDialog = ({
  open,
  onClose,
  title = "Confirmation",
  body,
  onConfirm,
  confirmLabel = "Ok",
  confirmColor = "#ffa1a1",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  body: ReactNode;
  onConfirm: () => void;
  confirmLabel?: string;
  confirmColor?: string;
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle
        sx={{
          backgroundColor: COLORS.BLURPLE,
        }}
      >
        {title}
      </DialogTitle>
      <DialogContent
        sx={{
          backgroundColor: COLORS.BLURPLE,
        }}
      >
        <DialogContentText
          sx={{
            color: "white",
          }}
        >
          {body}
        </DialogContentText>
      </DialogContent>
      <DialogActions
        sx={{
          backgroundColor: COLORS.BLURPLE,
          color: "white",
        }}
      >
        <Button
          onClick={onClose}
          autoFocus
          sx={{
            color: "white",
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          sx={{
            color: confirmColor,
          }}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog;
