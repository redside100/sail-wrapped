import { Backdrop, Box, Stack, Typography } from "@mui/material";
import { DriveContext } from "./DriveContext";
import { useContext, useMemo } from "react";
import { AUDIO_EXT_LIST, PHOTO_EXT_LIST, VIDEO_EXT_LIST } from "../../consts";
import { MediaContainer } from "../Media";
import { getDriveSrc, getObjectName } from "../../util";
import { ArrowBackIos, ArrowForwardIos } from "@mui/icons-material";

const MediaViewer = () => {
  const { activeDriveObject, setActiveDriveObject, visibleObjects } =
    useContext(DriveContext);
  const [isImage, isVideo, isAudio] = useMemo(
    () => [
      PHOTO_EXT_LIST.some((ext: string) =>
        activeDriveObject?.key.endsWith(ext),
      ),
      VIDEO_EXT_LIST.some((ext: string) =>
        activeDriveObject?.key.endsWith(ext),
      ),
      AUDIO_EXT_LIST.some((ext: string) =>
        activeDriveObject?.key.endsWith(ext),
      ),
    ],
    [activeDriveObject],
  );

  const activeIndex = useMemo(() => {
    if (activeDriveObject) {
      return visibleObjects.indexOf(activeDriveObject);
    }
    return -1;
  }, [activeDriveObject, visibleObjects]);

  return (
    <Backdrop
      sx={(theme: { zIndex: { drawer: number } }) => ({
        color: "#fff",
        zIndex: theme.zIndex.drawer + 1,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
      })}
      open={activeDriveObject !== undefined}
      onClick={() => setActiveDriveObject(undefined)}
    >
      {activeDriveObject && (
        <Stack
          direction="x"
          gap={10}
          justifyContent="space-between"
          alignItems="center"
          sx={{
            width: "80vw",
          }}
        >
          <ArrowBackIos
            sx={{
              color: "white",
              fontSize: 32,
              "&:hover": { opacity: 0.8, cursor: "pointer" },
            }}
            onClick={(e: Event) => {
              e.stopPropagation();
              if (activeIndex === 0) {
                return;
              }
              const previousObject = visibleObjects[activeIndex - 1];
              if (previousObject) {
                setActiveDriveObject(previousObject);
              }
            }}
          />
          <Stack
            alignItems="center"
            gap={3}
            onClick={(e: Event) => e.stopPropagation()}
          >
            {(isImage || isVideo || isAudio) && (
              <MediaContainer
                isVideo={isVideo}
                isAudio={isAudio}
                url={getDriveSrc(activeDriveObject.key)}
              />
            )}
            {!isImage && !isVideo && !isAudio && (
              <>
                <Typography variant="h5">No preview available</Typography>
                <img src="./pusheen_sad.png" width={200} />
              </>
            )}
            <Typography>{getObjectName(activeDriveObject.key)}</Typography>
            <Typography>
              {activeIndex + 1} of {visibleObjects.length}
            </Typography>
          </Stack>
          <ArrowForwardIos
            sx={{
              color: "white",
              fontSize: 32,
              "&:hover": { opacity: 0.8, cursor: "pointer" },
            }}
            onClick={(e: Event) => {
              e.stopPropagation();
              if (activeIndex >= visibleObjects.length - 1) {
                return;
              }
              const previousObject = visibleObjects[activeIndex + 1];
              if (previousObject) {
                setActiveDriveObject(previousObject);
              }
            }}
          />
        </Stack>
      )}
    </Backdrop>
  );
};

export default MediaViewer;
