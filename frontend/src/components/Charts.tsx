import { useCallback, useContext, useEffect, useState } from "react";
import { animated, useSprings } from "@react-spring/web";
import {
  Box,
  IconButton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { Search, TrendingUp } from "@mui/icons-material";
import { LoadingAnimation } from "./LoadingPage";
import { UserContext } from "../App";
import { getChartData, getWordData } from "../api";
import toast from "react-hot-toast";
import { usePersistedTabs } from "../util";
import GenericChart from "./GenericChart";
import { COLORS } from "../consts";
import MentionGraph from "./MentionGraph";

const Charts = () => {
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = usePersistedTabs("messages");
  const [chartData, setChartData] = useState<any>(null);
  const [wordData, setWordData] = useState<any>(null);
  const [loadingWordData, setLoadingWordData] = useState(false);

  const [word, setWord] = useState<string>("");
  const [selectedWord, setSelectedWord] = useState<string>("");

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

  const { year } = useContext(UserContext);
  // fetch graph data for current year on load
  useEffect(() => {
    const fetchGraphData = async () => {
      const token = localStorage.getItem("access_token") ?? "";
      setLoading(true);
      const [res, status] = await getChartData(token, year);
      if (status !== 200) {
        toast.error("Failed to get chart data.");
        return;
      }
      setChartData(res);
      setLoading(false);
    };
    fetchGraphData();
  }, [year]);

  const fetchWordData = useCallback(
    async (word: string) => {
      if (word.length === 0) {
        return;
      }
      const token = localStorage.getItem("access_token") ?? "";
      setLoadingWordData(true);
      const [res, status] = await getWordData(word, token, year);
      if (status !== 200) {
        toast.error(res.detail);
        setLoadingWordData(false);
        setWordData(null);
        return;
      }
      setWordData(res);
      setLoadingWordData(false);
    },
    [year]
  );

  return (
    <Stack justifyContent="center" alignItems="center" p={3}>
      <animated.div style={headerStyle[0]}>
        <Box display="flex" gap={1} alignItems="center" mt={2}>
          <TrendingUp sx={{ color: "white", fontSize: 40 }} />
          <Typography variant="h3">Charts</Typography>
        </Box>
      </animated.div>
      <animated.div style={headerStyle[1]}>
        <Typography>Charts for various things throughout {year}</Typography>
      </animated.div>
      {loading && (
        <Box mt={3}>
          <LoadingAnimation />
        </Box>
      )}
      {!loading && (
        <animated.div style={headerStyle[2]}>
          <Stack mt={3} alignItems="center" gap={2}>
            <Tabs
              value={tab}
              onChange={(_: unknown, value: string) => {
                setTab(value);
              }}
              indicatorColor="secondary"
              allowScrollButtonsMobile
              scrollButtons={true}
              variant="scrollable"
            >
              <Tab label={<Typography>Messages</Typography>} value="messages" />
              <Tab label={<Typography>Words</Typography>} value="words" />
              <Tab
                label={<Typography>Reactions</Typography>}
                value="reactions"
              />
              <Tab label={<Typography>Mentions</Typography>} value="mentions" />
              <Tab
                label={<Typography>Mention Networks</Typography>}
                value="mention-networks"
              />
            </Tabs>
            {tab === "messages" && (
              <GenericChart
                title="Messages sent over time"
                bucket_data={chartData?.message_buckets ?? []}
                yLabel="Messages"
                color={COLORS.LINK}
                curve="monotoneX"
                counter="message"
              />
            )}
            {tab === "words" && (
              <Stack gap={2} alignItems="center">
                <Box display="flex" gap={1} alignItems="center">
                  <TextField
                    label="Search for a word"
                    variant="filled"
                    color="secondary"
                    value={word ?? ""}
                    sx={{
                      width: 200,
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
                    onChange={(e) => setWord(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === "Enter") {
                        setSelectedWord(word);
                        await fetchWordData(word);
                      }
                    }}
                  />
                  <IconButton
                    variant="contained"
                    sx={{ color: "white", height: 40 }}
                    onClick={async () => {
                      await fetchWordData(word);
                    }}
                  >
                    <Search />
                  </IconButton>
                </Box>
                {loadingWordData && (
                  <Box mt={3}>
                    <LoadingAnimation />
                  </Box>
                )}
                {!loadingWordData && (
                  <GenericChart
                    title={`Historical usage of "${selectedWord}"`}
                    subtitle={`${wordData?.total_count} total use${
                      wordData?.total_count === 1 ? "" : "s"
                    }`}
                    bucket_data={wordData?.buckets ?? []}
                    yLabel="Uses"
                    color={COLORS.LINK}
                    curve={
                      wordData?.buckets?.length > 100 ? "monotoneX" : "linear"
                    }
                    height="50vh"
                    counter="use"
                  />
                )}
              </Stack>
            )}
            {tab === "reactions" && (
              <GenericChart
                title="Reactions sent over time"
                bucket_data={chartData?.reaction_buckets ?? []}
                yLabel="Reactions"
                color={COLORS.LINK}
                curve="monotoneX"
                counter="reaction"
              />
            )}
            {tab === "mentions" && (
              <GenericChart
                title="Mentions over time"
                bucket_data={chartData?.mention_buckets ?? []}
                yLabel="Mentions"
                color={COLORS.LINK}
                curve="monotoneX"
                counter="mention"
              />
            )}
            {tab === "mention-networks" && <MentionGraph />}
          </Stack>
        </animated.div>
      )}
    </Stack>
  );
};

export default Charts;
