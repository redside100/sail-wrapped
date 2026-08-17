import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { COLORS } from "../../consts";
import { useState } from "react";

const FolderCreationDialog = ({
  open,
  onClose,
  onFolderCreated,
}: {
  open: boolean;
  onClose: () => void;
  onFolderCreated: (name: string) => void;
}) => {
  const [name, setName] = useState("");
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle
        sx={{
          backgroundColor: COLORS.BLURPLE,
        }}
      >
        Create Folder
      </DialogTitle>
      <DialogContent
        sx={{
          backgroundColor: COLORS.BLURPLE,
        }}
      >
        <TextField
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          autoFocus
          required
          margin="dense"
          name="Folder Name"
          label="Folder Name"
          fullWidth
          variant="standard"
          sx={{
            "& input[type=number]::-webkit-outer-spin-button": {
              display: "none",
              margin: 0,
            },
            "& input[type=number]::-webkit-inner-spin-button": {
              display: "none",
              margin: 0,
            },
          }}
          slotProps={{
            htmlInput: {
              style: {
                color: "white",
              },
            },
          }}
        />
      </DialogContent>
      <DialogActions
        sx={{
          backgroundColor: COLORS.BLURPLE,
          color: "white",
        }}
      >
        <Button
          onClick={() => {
            onClose();
            setName("");
          }}
          autoFocus
          sx={{
            color: "white",
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={() => {
            onFolderCreated(name);
            setName("");
          }}
          sx={{
            color: "white",
          }}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FolderCreationDialog;
