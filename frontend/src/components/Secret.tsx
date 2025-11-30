import { Button, Stack, Typography } from "@mui/material";
import { useContext, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../App";
import { animated, useSprings } from "@react-spring/web";

const Secret = () => {
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(window.location.search);
  const { user, pusheenMode, setPusheenMode } = useContext(UserContext);
  const isValid = useMemo(
    () => queryParams.get("user") === user.info?.id,
    [queryParams, user?.info?.id]
  );
  useEffect(() => {
    if (!isValid) {
      navigate("/");
    }
  }, []);

  const [style] = useSprings(3, (idx: number) => ({
    from: {
      opacity: 0,
      y: 10,
    },
    to: {
      opacity: 1,
      y: 0,
    },
    delay: idx * 200,
  }));

  if (!isValid) {
    return null;
  }

  return (
    <Stack justifyContent="center" alignItems="center" p={3}>
      <animated.div style={style[0]}>
        <img src="/pusheen_cookie.png" width={300} />
      </animated.div>
      <animated.div style={style[1]}>
        <Typography variant="h5">
          Welcome to the Super Duper Secret Page for Cool People
        </Typography>
      </animated.div>
      <animated.div style={style[2]}>
        <Stack alignItems="center">
          <Typography mt={3}>Thank you for being part of Sail.</Typography>
          <Typography>Enjoy the pusheen!</Typography>
          <Button
            variant="contained"
            sx={{
              alignSelf: "center",
              mt: 2,
            }}
            onClick={() => {
              setPusheenMode((prev: boolean) => !prev);
            }}
          >
            Turn {pusheenMode ? "off" : "on"} Pusheen Mode
          </Button>
        </Stack>
      </animated.div>
    </Stack>
  );
};
export default Secret;
