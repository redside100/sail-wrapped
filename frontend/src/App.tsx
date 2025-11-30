import { createContext, useCallback, useEffect, useState } from "react";
import MainView from "./MainView";
import { Box, createTheme, ThemeProvider } from "@mui/material";
import toast, { Toaster } from "react-hot-toast";
import { getInfo, login, refresh } from "./api";
import moment from "moment";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import {
  COLORS,
  CURRENT_YEAR,
  PARTICLE_OPTIONS,
  PUSHEEN_PARTICLE_OPTIONS,
} from "./consts";
import { loadImageShape } from "@tsparticles/shape-image";

export const UserContext = createContext<any>({
  user: {
    loggedIn: false,
    isLoading: false,
    info: {},
  },
  setUser: () => {},
  pusheenMode: false,
  setPusheenMode: () => {},
  year: CURRENT_YEAR,
  setYear: () => {},
  customParticles: undefined,
  setCustomParticles: () => {},
});

function App() {
  const [user, setUser] = useState<any>({});
  const [pusheenMode, setPusheenMode] = useState(false);
  const [year, setYear] = useState(CURRENT_YEAR);
  const [customParticles, setCustomParticles] = useState(undefined);

  const setAndPersistPusheenMode = useCallback((pusheenMode: boolean) => {
    setPusheenMode(pusheenMode);
    localStorage.setItem("pusheen_mode", String(pusheenMode));
  }, []);

  const setAndPersistCustomParticles = useCallback((config: any) => {
    setCustomParticles(config);
    localStorage.setItem("customParticles", JSON.stringify(config));
  }, []);

  useEffect(() => {
    setPusheenMode(localStorage.getItem("pusheen_mode") === "true");
    const customParticles = localStorage.getItem("customParticles");
    if (customParticles) {
      try {
        const config = JSON.parse(customParticles);
        setCustomParticles(config);
      } catch (e) {}
    }
    setYear(
      localStorage.getItem("year")
        ? Number(localStorage.getItem("year"))
        : CURRENT_YEAR
    );
  }, []);

  const theme = createTheme({
    palette: {
      mode: "light",
      primary: { main: COLORS.BLURPLE },
      secondary: { main: COLORS.LINK },
    },
    typography: {
      fontFamily: "Nunito",
      allVariants: {
        color: "#ffffff",
      },
      button: {
        textTransform: "none",
        color: "#ffffff",
      },
    },
  });

  const refreshAndUpdateToken = async (
    token: string,
    localRefreshToken: string
  ) => {
    const [res, status] = await refresh(token, localRefreshToken);
    if (status === 200) {
      localStorage.setItem("access_token", res.access_token);
      localStorage.setItem("refresh_token", res.refresh_token);
      localStorage.setItem("exp", res.exp);
      setUser({
        loggedIn: true,
        isLoading: false,
        info: res.user_info,
      });
      return true;
    }
    return false;
  };

  const [initParticles, setInitParticles] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
      await loadImageShape(engine);
    }).then(() => {
      setInitParticles(true);
    });
  });
  useEffect(() => {
    const auth = async () => {
      // previous session
      const token = localStorage.getItem("access_token");
      const localRefreshToken = localStorage.getItem("refresh_token");
      const tokenExp = localStorage.getItem("exp");

      if (token && localRefreshToken && tokenExp) {
        setUser({
          loggedIn: false,
          isLoading: true,
          info: {},
        });
        // if the token is going to expire in < 2 days, refresh it and store the value instead
        const secondsToExp = Number(tokenExp) - moment.utc().valueOf() / 1000;
        if (secondsToExp < 86400 * 2) {
          if (await refreshAndUpdateToken(token, localRefreshToken)) return;
        }

        // in case the token is still valid and doesn't need refresh, just retrieve user info
        const [res, status] = await getInfo(token);
        if (status === 200) {
          setUser({
            loggedIn: true,
            isLoading: false,
            info: res,
          });
        } else {
          // try refreshing again if it fails
          if (await refreshAndUpdateToken(token, localRefreshToken)) return;
          // if the refresh fails, we need the user to sign in again
          setUser({
            loggedIn: false,
            isLoading: false,
            info: {},
          });
          toast.error("Please login again.");
          localStorage.clear();
        }
        return;
      }

      // if we have a code in the URL, this is a login process
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      if (code != null) {
        window.history.replaceState(null, "", "/");
        setUser({
          loggedIn: false,
          isLoading: true,
          info: {},
        });
        const [res, status] = await login(code);
        if (status === 200) {
          setUser({
            loggedIn: true,
            isLoading: false,
            info: res.user_info,
          });
          localStorage.setItem("access_token", res.access_token);
          localStorage.setItem("refresh_token", res.refresh_token);
          localStorage.setItem("exp", res.exp);
          toast.success(`Logged in as @${res.user_info.username}`);
        } else {
          setUser({
            loggedIn: false,
            isLoading: false,
            info: {},
          });
          toast.error(`Unable to login. Reason: ${res.detail}`);
        }
      }
    };
    auth();
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        pusheenMode,
        setPusheenMode: setAndPersistPusheenMode,
        year,
        setYear,
        customParticles,
        setCustomParticles: setAndPersistCustomParticles,
      }}
    >
      <ThemeProvider theme={theme}>
        <Toaster
          toastOptions={{
            style: {
              fontFamily: "Nunito",
            },
          }}
        />
        {initParticles && (
          <Particles
            id="particles"
            options={
              customParticles
                ? customParticles
                : pusheenMode
                ? PUSHEEN_PARTICLE_OPTIONS
                : PARTICLE_OPTIONS
            }
          />
        )}
        <Box zIndex={1} position="relative">
          <MainView />
        </Box>
      </ThemeProvider>
    </UserContext.Provider>
  );
}

export default App;
