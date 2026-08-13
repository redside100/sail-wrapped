import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useRef, useState } from "react";
import { API_BASE, COLORS } from "../consts";
import { FileUpload } from "@mui/icons-material";

const MultiFileUploader = ({
  prefix,
  onUploadFinished,
}: {
  prefix: string;
  onUploadFinished?: () => void;
}) => {
  const fileInputRef = useRef<any>();
  const uploadEventRef = useRef<any>();
  const [uploadingCount, setUploadingCount] = useState(0);
  const [existingFiles, setExistingFiles] = useState<string[]>([]);

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const upload = async (overwrite: boolean) => {
    if (!uploadEventRef.current) {
      return;
    }

    const selectedFiles = Array.from(uploadEventRef.current.target.files);
    if (selectedFiles.length === 0) {
      uploadEventRef.current = null;
      return;
    }

    setUploadingCount(selectedFiles.length);

    const formData = new FormData();
    selectedFiles.forEach((file: any) => formData.append("files", file));
    formData.append("prefix", prefix);
    formData.append("overwrite", String(overwrite));

    try {
      const token = localStorage.getItem("access_token") ?? "";
      const res = await fetch(`${API_BASE}/drive/upload`, {
        method: "POST",
        body: formData,
        headers: {
          token,
        },
      });
      if (res.status === 409 && !overwrite) {
        const body = await res.json();
        setExistingFiles(body.detail.existing ?? []);
        return;
      }
      uploadEventRef.current = null;
      onUploadFinished?.();
    } catch (err) {
      console.error("Batch upload failed:", err);
      uploadEventRef.current = null;
    } finally {
      setUploadingCount(0);
    }
  };

  const handleClose = () => {
    setExistingFiles([]);
    uploadEventRef.current = null;
  };

  const handleFileChange = async (e: any) => {
    uploadEventRef.current = e;
    await upload(false);
  };

  return (
    <Box display="flex" alignItems="center">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
        multiple
      />
      {uploadingCount === 0 && (
        <FileUpload
          sx={{
            color: "white",
            "&:hover": { opacity: 0.8, cursor: "pointer" },
          }}
          onClick={handleButtonClick}
        />
      )}
      {uploadingCount > 0 && (
        <Typography>Uploading {uploadingCount} files...</Typography>
      )}
      <Dialog open={existingFiles.length > 0} onClose={handleClose}>
        <DialogTitle
          sx={{
            backgroundColor: COLORS.BLURPLE,
          }}
        >
          Overwrite file{existingFiles.length === 1 ? "" : "s"}?
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
            The following {existingFiles.length} file
            {existingFiles.length === 1 ? "" : "s"} already exist
            {existingFiles.length === 1 ? "s" : ""} in this location:
            <ul>
              {existingFiles.slice(0, 10).map((filename: string) => (
                <li>{filename}</li>
              ))}
              {existingFiles.length > 10 && (
                <li>and {existingFiles.length - 10} more...</li>
              )}
            </ul>
          </DialogContentText>
        </DialogContent>
        <DialogActions
          sx={{
            backgroundColor: COLORS.BLURPLE,
            color: "white",
          }}
        >
          <Button
            onClick={handleClose}
            autoFocus
            sx={{
              color: "white",
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              setExistingFiles([]);
              await upload(true);
            }}
            sx={{
              color: "#ffa1a1",
            }}
          >
            Overwrite
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MultiFileUploader;
