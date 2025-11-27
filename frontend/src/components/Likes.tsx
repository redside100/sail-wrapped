import { useContext, useEffect, useMemo, useState } from "react";
import { getLikes } from "../api";
import toast from "react-hot-toast";
import { animated, useSprings } from "@react-spring/web";
import { Box, Pagination, Stack, Tab, Tabs, Typography } from "@mui/material";
import { Favorite } from "@mui/icons-material";
import { usePagination, usePersistedTabs } from "../util";
import GenericEntry from "./GenericEntry";
import { LoadingAnimation } from "./LoadingPage";
import { UserContext } from "../App";

const MAX_PER_PAGE = 5;

const Likes = () => {
  const [likes, setLikes] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = usePersistedTabs("media");

  const listData = useMemo(
    () => (tab === "media" ? likes?.attachments : likes?.messages) ?? [],
    [tab, likes?.attachments, likes?.messages]
  );
  const [pageEntities, totalPages, page, setPage] = usePagination(
    listData,
    MAX_PER_PAGE
  );

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

  const [entryStyle] = useSprings(
    MAX_PER_PAGE,
    () => ({
      from: {
        opacity: 0,
      },
      to: {
        opacity: 1,
        y: 0,
      },
      reset: true,
    }),
    [page, tab]
  );
  const { year } = useContext(UserContext);

  // fetch user likes on load
  useEffect(() => {
    const fetchLikes = async () => {
      const token = localStorage.getItem("access_token") ?? "";
      setLoading(true);
      const [res, status] = await getLikes(token, year);
      if (status !== 200) {
        toast.error("Failed to get likes.");
        return;
      }
      setLikes(res);
      setLoading(false);
    };
    fetchLikes();
  }, [year]);

  return (
    <Stack justifyContent="center" alignItems="center" p={3}>
      <animated.div style={headerStyle[0]}>
        <Box display="flex" gap={1} alignItems="center" mt={2}>
          <Favorite sx={{ color: "white", fontSize: 40 }} />
          <Typography variant="h3">Likes</Typography>
        </Box>
      </animated.div>
      <animated.div style={headerStyle[1]}>
        <Typography>Your liked media and messages for {year}</Typography>
      </animated.div>
      {loading && (
        <Box mt={3}>
          <LoadingAnimation />
        </Box>
      )}
      {!loading && (
        <Stack mt={3} alignItems="center" gap={1}>
          <animated.div style={headerStyle[2]}>
            <Tabs
              value={tab}
              onChange={(_: unknown, value: string) => setTab(value)}
              indicatorColor="secondary"
              sx={{
                mb: 3,
              }}
            >
              <Tab label={<Typography>Media</Typography>} value="media" />
              <Tab label={<Typography>Messages</Typography>} value="messages" />
            </Tabs>
          </animated.div>
          {pageEntities.map((entity, idx: number) => (
            <animated.div style={entryStyle[idx]} key={idx}>
              <GenericEntry
                entryType={tab === "media" ? "attachment" : "message"}
                entryInfo={entity}
              />
            </animated.div>
          ))}
          {!loading &&
            likes != null &&
            (tab === "Media"
              ? likes.attachments.length
              : likes.messages.length) === 0 && (
              <Box
                sx={{ backgroundColor: "rgba(0, 0, 0, 0.2) " }}
                p={2}
                borderRadius={3}
              >
                <Typography variant="h5">
                  You haven't liked any {tab === "media" ? "media" : "messages"}{" "}
                  yet.
                </Typography>
              </Box>
            )}
          {totalPages > 0 && (
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
          )}
        </Stack>
      )}
    </Stack>
  );
};

export default Likes;
