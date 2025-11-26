import { useContext, useEffect, useMemo, useState } from "react";
import { getMentionGraphData } from "../api";
import toast from "react-hot-toast";
import { animated, useSprings } from "@react-spring/web";
import { Box, MenuItem, Select, Stack, Typography } from "@mui/material";
import { Hub } from "@mui/icons-material";
import { LoadingAnimation } from "./LoadingPage";
import { UserContext } from "../App";
import { CameraMode, GraphCanvas, lightTheme } from "reagraph";
import { COLORS } from "../consts";

const customTheme = {
  ...lightTheme,
  canvas: {
    ...lightTheme.canvas,
    background: "blueviolet",
  },
};
const MentionGraph = () => {
  const [loading, setLoading] = useState(false);
  const [graphData, setGraphData] = useState<any>(null);
  const [cameraMode, setCameraMode] = useState<CameraMode>("pan");

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
      const [res, status] = await getMentionGraphData(token, year);
      if (status !== 200) {
        toast.error("Failed to get mention graph data.");
        return;
      }
      setGraphData(res);
      setLoading(false);
    };
    fetchGraphData();
  }, [year]);

  const nodes = useMemo(() => {
    if (!graphData) return [];
    return graphData.edges.reduce((acc: any[], edge: any) => {
      if (!acc.find((node) => node.id === edge.from_user)) {
        acc.push({
          id: edge.from_user,
          label: edge.from_user,
          icon: edge.from_user_avatar_url,
        });
      }
      if (!acc.find((node) => node.id === edge.to_user)) {
        acc.push({
          id: edge.to_user,
          label: edge.to_user,
          icon: edge.to_user_avatar_url,
        });
      }
      return acc;
    }, []);
  }, [graphData]);

  const edges = useMemo(() => {
    if (!graphData) return [];
    return graphData.edges.reduce((acc: any[], edge: any) => {
      const reverseEdgeIdx = acc.findIndex(
        (e) => e.id === `${edge.to_user}-${edge.from_user}`
      );
      if (reverseEdgeIdx !== -1) {
        acc[reverseEdgeIdx].label += ` + ${edge.count}`;
      }
      acc.push({
        source: edge.from_user,
        target: edge.to_user,
        label: reverseEdgeIdx !== -1 ? undefined : edge.count.toString(),
        id: `${edge.from_user}-${edge.to_user}`,
      });
      return acc;
    }, []);
  }, [graphData]);

  return (
    <Stack justifyContent="center" alignItems="center" p={3}>
      <animated.div style={headerStyle[0]}>
        <Box display="flex" gap={1} alignItems="center" mt={2}>
          <Hub sx={{ color: "white", fontSize: 40 }} />
          <Typography variant="h3">Mention Graph</Typography>
        </Box>
      </animated.div>
      <animated.div style={headerStyle[1]}>
        <Typography>
          A visualiztion of most mentioned networks for {year}
        </Typography>
      </animated.div>
      {loading && (
        <Box mt={3}>
          <LoadingAnimation />
        </Box>
      )}
      {!loading && (
        <Stack mt={3} alignItems="center" gap={1}>
          <animated.div style={headerStyle[2]}>
            <Box
              position="relative"
              height={{
                xs: "300px",
                sm: "600px",
              }}
              width={{
                xs: "90vw",
                md: "75vw",
              }}
              sx={{
                boxShadow: "0px 0px 30px rgba(255, 255, 255, 0.4);",
                opacity: 0.7,
              }}
            >
              <GraphCanvas
                nodes={nodes}
                edges={edges}
                theme={customTheme}
                cameraMode={cameraMode}
                draggable
                labelType="all"
              />
            </Box>
            <Box display="flex" justifyContent="flex-end">
              <Select
                value={cameraMode}
                onChange={(e) => setCameraMode(e.target.value as CameraMode)}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: COLORS.BLURPLE,
                    },
                  },
                }}
                sx={{
                  color: "white",
                  "& .MuiSvgIcon-root": {
                    color: "white",
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    border: "none",
                  },
                }}
              >
                <MenuItem value="pan">Pan</MenuItem>
                <MenuItem value="orbit">Orbit</MenuItem>
                <MenuItem value="rotate">Rotate</MenuItem>
              </Select>
            </Box>
          </animated.div>
        </Stack>
      )}
    </Stack>
  );
};

export default MentionGraph;
