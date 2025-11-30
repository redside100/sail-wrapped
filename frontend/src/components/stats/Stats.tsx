import { useContext, useEffect, useState } from "react";
import { getStats } from "../../api";
import toast from "react-hot-toast";
import { Box, Link, Stack, Tab, Tabs, Typography } from "@mui/material";
import { animated, useSprings } from "@react-spring/web";
import { Insights } from "@mui/icons-material";
import { UserContext } from "../../App";
import { COLORS } from "../../consts";
import { usePersistedTabs } from "../../util";
import { LoadingAnimation } from "../LoadingPage";
import StatsPage from "./StatsPage";
import ContentPage from "./ContentPage";
import EmojisPage from "./EmojisPage";

const Stats = () => {
  const [missingInfo, setMissingInfo] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [tab, setTab] = usePersistedTabs("stats");
  const [loading, setLoading] = useState(false);
  const { user, year } = useContext(UserContext);
  const [style] = useSprings(4, (idx: number) => ({
    from: {
      opacity: 0,
      y: 10,
    },
    to: {
      opacity: 1,
      y: 0,
    },
    delay: idx * 100,
  }));

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem("access_token") ?? "";
      setLoading(true);
      try {
        const [res, status] = await getStats(token, year);
        if (status === 404) {
          setMissingInfo(true);
          return;
        } else if (status !== 200) {
          toast.error("Failed to get stats.");
          return;
        }
        setStats(res);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [year]);

  return (
    <Stack justifyContent="center" alignItems="center" p={3}>
      <animated.div style={style[0]}>
        <Box display="flex" gap={1} alignItems="center" mt={2}>
          <Insights sx={{ color: "white", fontSize: 40 }} />
          <Typography variant="h3">Stats</Typography>
        </Box>
      </animated.div>
      <animated.div style={style[1]}>
        <Typography>
          Cool things about{" "}
          <Link color={COLORS.LINK}>@{user.info.username}</Link> during {year}
        </Typography>
      </animated.div>
      <animated.div style={style[2]}>
        <Tabs
          value={tab}
          onChange={(_: unknown, value: string) => {
            setTab(value);
          }}
          indicatorColor="secondary"
        >
          <Tab label={<Typography>Stats</Typography>} value="stats" />
          {stats?.notable_content && (
            <Tab label={<Typography>Content</Typography>} value="content" />
          )}
          {stats?.user_stats?.favourite_emojis && (
            <Tab label={<Typography>Emojis</Typography>} value="emojis" />
          )}
        </Tabs>
      </animated.div>
      {loading && (
        <Box mt={3}>
          <LoadingAnimation />
        </Box>
      )}
      {!loading && missingInfo && (
        <Box
          sx={{ backgroundColor: "rgba(0, 0, 0, 0.2) " }}
          mt={3}
          p={2}
          borderRadius={3}
        >
          <Typography variant="h5">
            There was no data found for your account...
          </Typography>
        </Box>
      )}
      {!loading && stats && !missingInfo && tab === "stats" && (
        <StatsPage stats={stats} />
      )}
      {!loading && stats && !missingInfo && tab === "content" && (
        <ContentPage stats={stats} />
      )}
      {!loading && stats && !missingInfo && tab === "emojis" && (
        <EmojisPage stats={stats} />
      )}
    </Stack>
  );
};

export default Stats;
