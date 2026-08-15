import { useContext, useEffect, useMemo, useState } from "react";
import { getDriveObjects } from "../../api";
import toast from "react-hot-toast";
import { animated, useSprings } from "@react-spring/web";
import { Box, Grid2, Pagination, Stack, Typography } from "@mui/material";
import {
  ArrowBack,
  AudioFile,
  FolderCopy,
  InsertDriveFile,
  Photo,
  VideoFile,
} from "@mui/icons-material";
import {
  getDisplayKey,
  getDriveSrc,
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

const ArchiveItem = ({
  driveObject,
  navigatePrefix,
}: {
  driveObject: DriveObject;
  navigatePrefix: (key: string) => void;
}) => {
  const { setActiveDriveObject } = useContext(DriveContext);
  const [isImage, isVideo, isAudio] = useMemo(
    () => [
      PHOTO_EXT_LIST.some((ext: string) => driveObject.key.endsWith(ext)),
      VIDEO_EXT_LIST.some((ext: string) => driveObject.key.endsWith(ext)),
      AUDIO_EXT_LIST.some((ext: string) => driveObject.key.endsWith(ext)),
    ],
    [driveObject],
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

  return (
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
          backgroundColor: COLORS.BLURPLE,
          backgroundOpacity: 0.5,
          padding: 1,
          transition: "0.15s ease-in-out",
          "&:hover": {
            backgroundColor: `rgba(88, 101, 242, 0.6) !important`,
            transform: "translateY(-2px)",
            cursor: "pointer",
          },
        }}
        onClick={() => {
          if (driveObject.is_directory) {
            navigatePrefix(getDisplayKey(driveObject.key));
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
              src={getDriveSrc(driveObject.key)}
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
  const [activeDriveObject, setActiveDriveObject] = useState<
    DriveObject | undefined
  >(undefined);

  const [visibleFileObjects, totalPages, page, setPage] = usePagination(
    fileObjects,
    24,
  );

  useEffect(() => {
    setPage(1);
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

  return (
    <DriveContext.Provider
      value={{
        activeDriveObject,
        setActiveDriveObject,
        visibleObjects: visibleFileObjects,
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
              </Box>
            </Box>
            {loading && (
              <Box mt={3}>
                <LoadingAnimation />
              </Box>
            )}
            {!loading && (
              <Stack gap={3} mt={3}>
                <Grid2 container spacing={2}>
                  {directoryObjects.map((obj: DriveObject) => (
                    <ArchiveItem driveObject={obj} navigatePrefix={setPrefix} />
                  ))}
                </Grid2>
                <Grid2 container spacing={2}>
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
    </DriveContext.Provider>
  );
};

export default Archives;
