import { Box, Grid2, Link, Stack, Typography } from "@mui/material";
import { animated, useSpring, useSprings } from "@react-spring/web";
import HomeButton from "./HomeButton";
import { useContext } from "react";
import { UserContext } from "../App";
import YearSelector from "./YearSelector";

const Home = () => {
  const sailStyle = useSpring({
    from: {
      opacity: 0,
      y: -10,
    },
    to: {
      opacity: 1,
      y: 0,
    },
    delay: 50,
  });
  const [buttonStyles] = useSprings(7, (idx: number) => ({
    from: {
      opacity: 0,
      y: 10,
    },
    to: {
      opacity: 1,
      y: 0,
    },
    delay: 200 + 100 * idx,
  }));
  const { year } = useContext(UserContext);
  return (
    <Stack justifyContent="center" alignItems="center" p={3}>
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        gap={1}
      >
        <animated.div style={sailStyle}>
          <img
            src="./pusheen_sail.gif"
            height={175}
            width={175}
            style={{ borderRadius: 100 }}
          />
        </animated.div>
        <Box display="flex" alignItems="center" flexWrap="wrap" gap={1.5}>
          <Typography variant="h3">Sail Wrapped</Typography>
          <YearSelector size={40} mt={0.75} />
        </Box>
        <Typography mt={2}>
          A collection of the various things we've sent throughout {year}.
        </Typography>
        <Typography>
          You can view the 2016 - 2023 Sail Wrapped{" "}
          <Link
            color="#90caf9"
            href="https://sw2023.redside.moe/"
            target="_blank"
            rel="noopener"
          >
            here
          </Link>
          .
        </Typography>
      </Box>
      <Grid2
        container
        spacing={2}
        mt={6}
        width={{
          xs: "80vw",
          sm: "40vw",
        }}
        justifyContent="center"
      >
        <Grid2
          size={{
            xs: 12,
            md: 6,
          }}
        >
          <animated.div style={buttonStyles[0]}>
            <HomeButton
              to="/media"
              title="Media"
              description="Explore random media sent."
            />
          </animated.div>
        </Grid2>
        <Grid2
          size={{
            xs: 12,
            md: 6,
          }}
        >
          <animated.div style={buttonStyles[1]}>
            <HomeButton
              to="/messages"
              title="Messages"
              description="Explore random messages sent."
            />
          </animated.div>
        </Grid2>
        <Grid2
          size={{
            xs: 12,
            md: 6,
          }}
        >
          <animated.div style={buttonStyles[2]}>
            <HomeButton
              to="/likes"
              title="Likes"
              description="View your list of liked media or messages."
            />
          </animated.div>
        </Grid2>
        <Grid2
          size={{
            xs: 12,
            md: 6,
          }}
        >
          <animated.div style={buttonStyles[3]}>
            <HomeButton
              to="/leaderboard"
              title="Leaderboard"
              description="View the most notable media or messages."
            />
          </animated.div>
        </Grid2>
        <Grid2
          size={{
            xs: 12,
            md: 6,
          }}
        >
          <animated.div style={buttonStyles[4]}>
            <HomeButton
              to="/time-machine"
              title="Time Machine"
              description="See random snapshots of a date."
            />
          </animated.div>
        </Grid2>
        <Grid2
          size={{
            xs: 12,
            md: 6,
          }}
        >
          <animated.div style={buttonStyles[5]}>
            <HomeButton
              to="/charts"
              title="Charts"
              description="Chart visualizations for various things."
            />
          </animated.div>
        </Grid2>
        <Grid2
          size={{
            xs: 12,
            md: 6,
          }}
        >
          <animated.div style={buttonStyles[6]}>
            <HomeButton
              to="/stats"
              title="Stats"
              description="View some of your personal stats."
            />
          </animated.div>
        </Grid2>
      </Grid2>
    </Stack>
  );
};
export default Home;
