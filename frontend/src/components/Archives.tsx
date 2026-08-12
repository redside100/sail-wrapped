import { useEffect, useMemo, useState } from "react";
import { getDriveObjects } from "../api";
import toast from "react-hot-toast";
import { animated, useSprings } from "@react-spring/web";
import { Box, Stack, Tooltip, Typography } from "@mui/material";
import { FolderCopy } from "@mui/icons-material";
import { getDisplayKey, getObjectName, usePersistedSearchParam } from "../util";
import { LoadingAnimation } from "./LoadingPage";
import { COLORS } from "../consts";

const ArchiveItem = ({
  driveObject,
  navigatePrefix,
}: {
  driveObject: any;
  navigatePrefix: (key: string) => void;
}) => {
  const component = (
    <Stack
      sx={{
        width: 140,
        height: driveObject.is_directory ? 25 : 140,
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
        }
      }}
    >
      <Stack direction="x" gap={0.5} alignItems="center">
        {driveObject.is_directory && (
          <FolderCopy sx={{ color: "white", fontSize: 20 }} />
        )}
        <Typography noWrap>{getObjectName(driveObject.key)}</Typography>
      </Stack>
    </Stack>
  );

  if (!driveObject.is_directory) {
    const created = new Date(driveObject.created).toLocaleString();
    return (
      <Tooltip title={<Typography>Created {created}</Typography>}>
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

  const [prefix, setPrefix] = usePersistedSearchParam("prefix", "/");
  const [driveObjects, setDriveObjects] = useState([]);

  const [fileObjects, directoryObjects] = useMemo(
    () =>
      driveObjects.reduce(
        (acc: any, cur: any) => {
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

  const displayPrefix = useMemo(() => {
    if (!prefix.startsWith("/")) {
      return "/" + prefix;
    }
    return prefix;
  }, [prefix]);

  useEffect(() => {
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
    fetchPrefixContents();
  }, [prefix]);

  return (
    <>
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
            <Box
              sx={{
                width: "100%",
                backgroundColor: "",
              }}
            >
              <Typography>{displayPrefix}</Typography>
            </Box>
            {loading && (
              <Box mt={3}>
                <LoadingAnimation />
              </Box>
            )}
            {!loading && (
              <Stack gap={3}>
                <Stack direction="x" flexWrap="1" gap={2}>
                  {directoryObjects.map((obj: any) => (
                    <ArchiveItem driveObject={obj} navigatePrefix={setPrefix} />
                  ))}
                </Stack>
                <Stack direction="x" flexWrap="1" gap={2}>
                  {fileObjects.map((obj: any) => (
                    <ArchiveItem driveObject={obj} navigatePrefix={setPrefix} />
                  ))}
                </Stack>
              </Stack>
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
            xs: 60,
            md: 120,
          },
        }}
      >
        <img src="./pusheen_book.png" width="100%" />
      </Box>
    </>
  );
};

export default Archives;
