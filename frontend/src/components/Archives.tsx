import { useEffect, useState } from "react";
import { getDriveObjects } from "../api";
import toast from "react-hot-toast";
import { animated, useSprings } from "@react-spring/web";
import { Box, Stack, Typography } from "@mui/material";
import { FolderCopy } from "@mui/icons-material";
import { getObjectName, usePersistedSearchParam } from "../util";
import { LoadingAnimation } from "./LoadingPage";

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
      setDriveObjects(
        res.filter((obj: any) => obj.key !== `sw-drive${prefix}`),
      );
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
        {loading && (
          <Box mt={3}>
            <LoadingAnimation />
          </Box>
        )}
        <animated.div style={headerStyle[2]}>
          <Stack alignItems="center" spacing={2} p={3}>
            {driveObjects.map((obj: any) => (
              <Box display="flex" gap={1}>
                <Typography>{getObjectName(obj.key)}</Typography>
                {!obj.is_directory && (
                  <Typography>
                    {new Date(obj.created).toLocaleString()}
                  </Typography>
                )}
              </Box>
            ))}
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
        }}
      >
        <img src="./pusheen_book.png" width={100} />
      </Box>
    </>
  );
};

export default Archives;
