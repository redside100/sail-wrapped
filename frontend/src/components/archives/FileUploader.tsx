import { Box, Tooltip, Typography } from "@mui/material";
import { useRef, useState } from "react";
import { API_BASE } from "../../consts";
import { FileUpload } from "@mui/icons-material";
import toast from "react-hot-toast";
import ConfirmationDialog from "./ConfirmationDialog";

const MultiFileUploader = ({
  prefix,
  onUploadFinished,
}: {
  prefix: string;
  onUploadFinished?: () => void;
}) => {
  const fileInputRef = useRef<any>();
  const uploadEventRef = useRef<any>();
  const [uploading, setUploading] = useState(false);
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

    setUploading(true);

    const formData = new FormData();
    selectedFiles.forEach((file: any) => formData.append("files", file));
    formData.append("prefix", prefix);
    formData.append("overwrite", String(overwrite));

    try {
      const token = localStorage.getItem("access_token") ?? "";
      const toastId = toast.loading(
        `Uploading ${selectedFiles.length} file${selectedFiles.length === 1 ? "" : "s"}...`,
      );
      const res = await fetch(`${API_BASE}/drive/upload`, {
        method: "POST",
        body: formData,
        headers: {
          token,
        },
      });
      toast.remove(toastId);
      if (res.status === 409 && !overwrite) {
        const body = await res.json();
        setExistingFiles(body.detail.existing ?? []);
        return;
      } else if (res.status !== 200) {
        toast.error("Failed to upload files.");
        uploadEventRef.current = null;
        return;
      }
      uploadEventRef.current = null;
      toast.success(
        `Uploaded ${selectedFiles.length} file${selectedFiles.length === 1 ? "" : "s"}!`,
      );
      onUploadFinished?.();
    } catch (err) {
      console.error("Batch upload failed:", err);
      uploadEventRef.current = null;
    } finally {
      setUploading(false);
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
    <Tooltip title={<Typography>Upload Files</Typography>}>
      <Box display="flex" alignItems="center">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }}
          multiple
        />
        <FileUpload
          sx={{
            color: "white",
            "&:hover": { opacity: 0.8, cursor: "pointer" },
          }}
          onClick={() => {
            if (uploading) {
              return;
            }
            handleButtonClick();
          }}
        />
        <ConfirmationDialog
          open={existingFiles.length > 0}
          onClose={handleClose}
          title={`Overwrite file${existingFiles.length === 1 ? "" : "s"}?`}
          body={
            <>
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
            </>
          }
          onConfirm={async () => {
            setExistingFiles([]);
            await upload(true);
          }}
          confirmLabel="Overwrite"
        />
      </Box>
    </Tooltip>
  );
};

export default MultiFileUploader;
