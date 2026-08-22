import { useContext, useEffect, useMemo, useState } from "react";
import {
  createDriveFolder,
  deleteDriveObjects,
  getDriveObjects,
} from "../../api";
import toast from "react-hot-toast";
import { animated, useSprings } from "@react-spring/web";
import {
  Box,
  Grid2,
  Pagination,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  ArrowBack,
  AudioFile,
  Close,
  CreateNewFolder,
  Delete,
  FolderCopy,
  InsertDriveFile,
  Photo,
  VideoFile,
} from "@mui/icons-material";
import {
  getDisplayKey,
  getDrivePreview,
  getObjectName,
  usePagination,
} from "../../util";
import { LoadingAnimation } from "../LoadingPage";
import {
  AUDIO_EXT_LIST,
  COLORS,
  PHOTO_EXT_LIST,
  VIDEO_EXT_LIST,
} from "../../consts";
import MultiFileUploader from "./FileUploader";
import MediaViewer from "./MediaViewer";
import { DriveObject } from "./types";
import { DriveContext } from "./DriveContext";
import ConfirmationDialog from "./ConfirmationDialog";
import FolderCreationDialog from "./FolderCreationDialog";

const ArchiveItem = ({
  driveObject,
  navigatePrefix,
}: {
  driveObject: DriveObject;
  navigatePrefix: (key: string) => void;
}) => {
  const {
    setActiveDriveObject,
    selectedKeys,
    setSelectedKeys,
    driveObjects,
    visibleObjects,
  } = useContext(DriveContext);
  const [isImage, isVideo, isAudio] = useMemo(
    () => [
      PHOTO_EXT_LIST.some((ext: string) => driveObject.key.endsWith(ext)),
      VIDEO_EXT_LIST.some((ext: string) => driveObject.key.endsWith(ext)),
      AUDIO_EXT_LIST.some((ext: string) => driveObject.key.endsWith(ext)),
    ],
    [driveObject],
  );
  const isSelected = useMemo(
    () => selectedKeys.some((key) => driveObject.key === key),
    [selectedKeys, visibleObjects],
  );

  const icon = useMemo(() => {
    if (driveObject.is_directory) {
      return <FolderCopy sx={{ color: "white", fontSize: 20 }} />;
    } else if (isImage) {
      return <Photo sx={{ color: "white", fontSize: 20 }} />;
    } else if (isVideo) {
      return <VideoFile sx={{ color: "white", fontSize: 20 }} />;
    } else if (isAudio) {
      return <AudioFile sx={{ color: "white", fontSize: 20 }} />;
    }

    return <InsertDriveFile sx={{ color: "white", fontSize: 20 }} />;
  }, [driveObject]);

  const component = (
    <Grid2
      size={{
        xs: 6,
        md: 3,
        lg: 2,
      }}
    >
      <Stack
        sx={{
          height: driveObject.is_directory ? 25 : { xs: 170, md: 190 },
          borderRadius: 2,
          backgroundColor: isSelected ? COLORS.LINK : COLORS.BLURPLE,
          backgroundOpacity: 0.5,
          padding: 1,
          transition: "0.15s ease-in-out",
          "&:hover": {
            backgroundColor: !isSelected
              ? `rgba(88, 101, 242, 0.6) !important`
              : COLORS.LINK,
            transform: "translateY(-2px)",
            cursor: "pointer",
          },
          userSelect: "none",
        }}
        onClick={(e: React.MouseEvent) => {
          // Selection add
          if (e.ctrlKey || (e.shiftKey && driveObject.is_directory)) {
            if (!isSelected) {
              setSelectedKeys([...selectedKeys, driveObject.key]);
            } else {
              setSelectedKeys(
                selectedKeys.filter((key: string) => key !== driveObject.key),
              );
            }
            return;
          }

          if (driveObject.is_directory) {
            navigatePrefix(getDisplayKey(driveObject.key));
            return;
          }

          // Selection range edit
          if (e.shiftKey) {
            const firstIndex = driveObjects.findIndex((obj: DriveObject) =>
              selectedKeys.some((key: string) => obj.key === key),
            );
            const currentIndex = driveObjects.findIndex(
              (obj: DriveObject) => obj.key === driveObject.key,
            );
            if (currentIndex === -1) {
              return;
            }
            if (firstIndex === -1) {
              setSelectedKeys([...selectedKeys, driveObject.key]);
              return;
            }
            const [start, end] = [
              Math.min(currentIndex, firstIndex),
              Math.max(currentIndex, firstIndex),
            ];
            setSelectedKeys(
              driveObjects
                .slice(start, end + 1)
                .map((obj: DriveObject) => obj.key),
            );
            return;
          }

          setActiveDriveObject(driveObject);
        }}
      >
        <Stack direction="x" gap={0.5} alignItems="center">
          {icon}
          <Typography noWrap>{getObjectName(driveObject.key)}</Typography>
        </Stack>
        {isImage && (
          <Box
            sx={{
              flex: 1,
              width: "100%",
              overflow: "hidden",
              mt: 1,
              borderRadius: 1,
            }}
          >
            <Box
              component="img"
              src={getDrivePreview(driveObject.key)}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </Box>
        )}
      </Stack>
    </Grid2>
  );

  if (!driveObject.is_directory && selectedKeys.length === 0) {
    return (
      <Tooltip
        title={<Typography>Hold Ctrl or Shift to select</Typography>}
        arrow
        enterDelay={500}
        enterNextDelay={500}
      >
        {component}
      </Tooltip>
    );
  }
  return component;
};
const Archives = () => {
  const [loading, setLoading] = useState(false);

  const [headerStyle] = useSprings(3, (idx: number) => ({
    from: {
      opacity: 0,
      y: 10,
    },
    to: {
      opacity: 1,
      y: 0,
    },
    delay: idx * 100,
    reset: true,
  }));

  const [prefix, setPrefix] = useState("/");
  const [driveObjects, setDriveObjects] = useState<DriveObject[]>([]);
  const [fileObjects, directoryObjects] = useMemo(
    () =>
      driveObjects.reduce(
        (acc: DriveObject[][], cur: DriveObject) => {
          if (cur.is_directory) {
            acc[1].push(cur);
          } else {
            acc[0].push(cur);
          }
          return acc;
        },
        [[], []],
      ),
    [driveObjects],
  );

  const [selectedFileKeys, setSelectedFileKeys] = useState<string[]>([]);

  const [activeDriveObject, setActiveDriveObject] = useState<
    DriveObject | undefined
  >(undefined);

  const [visibleFileObjects, totalPages, page, setPage] = usePagination(
    fileObjects,
    24,
  );

  useEffect(() => {
    setPage(1);
    setSelectedFileKeys([]);
  }, [prefix]);

  const displayPrefix = useMemo(() => {
    if (!prefix.startsWith("/")) {
      return "/" + prefix;
    }
    return prefix;
  }, [prefix]);

  const fetchPrefixContents = async () => {
    const token = localStorage.getItem("access_token") ?? "";
    setLoading(true);
    const [res, status] = await getDriveObjects(prefix, token);
    if (status !== 200) {
      toast.error("Failed to list objects.");
      return;
    }
    setLoading(false);
    setDriveObjects(res);
  };

  useEffect(() => {
    fetchPrefixContents();
  }, [prefix]);

  const [deletionDialogOpen, setDeletionDialogOpen] = useState(false);
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);

  return (
    <DriveContext.Provider
      value={{
        activeDriveObject,
        setActiveDriveObject,
        driveObjects: driveObjects,
        visibleObjects: visibleFileObjects,
        selectedKeys: selectedFileKeys,
        setSelectedKeys: setSelectedFileKeys,
      }}
    >
      <Stack justifyContent="center" alignItems="center" p={3}>
        <animated.div style={headerStyle[0]}>
          <Box display="flex" gap={1} alignItems="center" mt={2}>
            <FolderCopy sx={{ color: "white", fontSize: 40 }} />
            <Typography variant="h3">Sail Archives</Typography>
          </Box>
        </animated.div>
        <animated.div style={headerStyle[1]}>
          <Typography>Your favorite cloud file service</Typography>
        </animated.div>
        <animated.div style={headerStyle[2]}>
          <Stack
            width="75vw"
            minHeight="75vh"
            mt={3}
            sx={{
              borderRadius: "8px",
              backgroundColor: "rgba(0, 0, 0, 0.1)",
            }}
            padding={3}
          >
            <Box display="flex" justifyContent="space-between">
              <Box display="flex" gap={2} alignItems="center">
                <ArrowBack
                  sx={{
                    color: "white",
                    "&:hover": { opacity: 0.8, cursor: "pointer" },
                  }}
                  onClick={() => {
                    if (prefix == "/" || prefix == "") {
                      return;
                    }
                    const parts = prefix.split("/").filter(Boolean);
                    const newPrefix =
                      parts.length > 1
                        ? "/" + parts.slice(0, -1).join("/") + "/"
                        : "/";
                    setPrefix(newPrefix);
                  }}
                />
                <Typography>{displayPrefix}</Typography>
              </Box>
              <Box display="flex" gap={1}>
                <MultiFileUploader
                  prefix={prefix}
                  onUploadFinished={fetchPrefixContents}
                />
                <Tooltip title={<Typography>Create Directory</Typography>}>
                  <CreateNewFolder
                    sx={{
                      color: "white",
                      "&:hover": { opacity: 0.8, cursor: "pointer" },
                    }}
                    onClick={() => setCreateFolderDialogOpen(true)}
                  />
                </Tooltip>
              </Box>
            </Box>
            {loading && (
              <Box mt={3}>
                <LoadingAnimation />
              </Box>
            )}
            {!loading && (
              <Stack gap={1} mt={3}>
                {selectedFileKeys.length > 0 && (
                  <Stack
                    direction="x"
                    gap={1}
                    alignItems="center"
                    sx={{
                      padding: 1,
                      backgroundColor: "rgba(0, 0, 0, 0.2)",
                      borderRadius: 1,
                    }}
                  >
                    <Tooltip title={<Typography>Deselect all</Typography>}>
                      <Close
                        sx={{
                          color: "white",
                          "&:hover": { opacity: 0.8, cursor: "pointer" },
                        }}
                        onClick={() => setSelectedFileKeys([])}
                      />
                    </Tooltip>
                    <Typography variant="h5">
                      {selectedFileKeys.length} item
                      {selectedFileKeys.length === 1 ? "" : "s"} selected
                    </Typography>
                    <Tooltip title={<Typography>Delete</Typography>}>
                      <Delete
                        sx={{
                          color: "white",
                          "&:hover": { opacity: 0.8, cursor: "pointer" },
                        }}
                        onClick={() => setDeletionDialogOpen(true)}
                      />
                    </Tooltip>
                  </Stack>
                )}
                <Grid2 container spacing={2}>
                  {directoryObjects.map((obj: DriveObject) => (
                    <ArchiveItem driveObject={obj} navigatePrefix={setPrefix} />
                  ))}
                </Grid2>
                <Grid2 container spacing={2} mt={2}>
                  {visibleFileObjects.map((obj: DriveObject) => (
                    <ArchiveItem driveObject={obj} navigatePrefix={setPrefix} />
                  ))}
                </Grid2>
              </Stack>
            )}
            {totalPages > 1 && (
              <Box alignSelf="center">
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, value) => setPage(value)}
                  color="primary"
                  sx={{
                    "& .MuiPaginationItem-root": {
                      color: "#fff",
                    },
                    mt: 2,
                  }}
                />
              </Box>
            )}
          </Stack>
        </animated.div>
      </Stack>
      <Box
        position="fixed"
        sx={{
          bottom: 10,
          right: 20,
          transition: "transform 0.3s ease-in-out",
          "&:hover": {
            transform: "translateY(-4px)",
          },
          width: {
            xs: 40,
            md: 100,
          },
        }}
      >
        <img src="./pusheen_book.png" width="100%" />
      </Box>
      <MediaViewer />
      <ConfirmationDialog
        open={deletionDialogOpen}
        onClose={() => setDeletionDialogOpen(false)}
        body={
          <>
            <Typography>
              Are you sure you want to delete {selectedFileKeys.length} item
              {selectedFileKeys.length === 1 ? "" : "s"}?
            </Typography>
          </>
        }
        title={`Delete item${selectedFileKeys.length === 1 ? "" : "s"}?`}
        confirmLabel="Delete"
        onConfirm={async () => {
          setDeletionDialogOpen(false);
          const token = localStorage.getItem("access_token") ?? "";
          const toastId = toast.loading(
            `Deleting ${selectedFileKeys.length} items...`,
          );
          const status = await deleteDriveObjects(selectedFileKeys, token);
          if (status !== 200) {
            toast.error("Failed to delete items.");
            toast.remove(toastId);
            return;
          }
          toast.remove(toastId);
          toast.success(
            `Deleted ${selectedFileKeys.length} item${selectedFileKeys.length === 1 ? "" : "s"}!`,
          );
          setSelectedFileKeys([]);
          await fetchPrefixContents();
        }}
      />
      <FolderCreationDialog
        open={createFolderDialogOpen}
        onClose={() => setCreateFolderDialogOpen(false)}
        onFolderCreated={async (name: string) => {
          setCreateFolderDialogOpen(false);
          const token = localStorage.getItem("access_token") ?? "";
          const toastId = toast.loading(`Creating folder...`);
          const status = await createDriveFolder(prefix, name, token);
          if (status !== 200) {
            toast.error("Failed to create folder.");
            toast.remove(toastId);
            return;
          }
          toast.remove(toastId);
          toast.success("Folder created!");
          setSelectedFileKeys([]);
          await fetchPrefixContents();
        }}
      />
    </DriveContext.Provider>
  );
};

export default Archives;
