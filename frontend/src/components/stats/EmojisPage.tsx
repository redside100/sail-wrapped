import { Box, Button, Stack, Tooltip, Typography } from "@mui/material";
import { animated, useSprings } from "@react-spring/web";
import { useContext, useMemo } from "react";
import { UserContext } from "../../App";
import { CUSTOM_PARTICLE_OPTIONS_BASE } from "../../consts";

const getCustomParticleOptions = (
  src: string | undefined,
  nativeEmoji: string | undefined
) => {
  if (nativeEmoji) {
    return {
      ...CUSTOM_PARTICLE_OPTIONS_BASE,
      particles: {
        ...CUSTOM_PARTICLE_OPTIONS_BASE.particles,
        shape: {
          type: "emoji",
          options: {
            emoji: {
              value: [nativeEmoji],
            },
          },
        },
      },
    };
  }
  return {
    ...CUSTOM_PARTICLE_OPTIONS_BASE,
    particles: {
      ...CUSTOM_PARTICLE_OPTIONS_BASE.particles,
      shape: {
        ...CUSTOM_PARTICLE_OPTIONS_BASE.particles.shape,
        options: {
          image: [
            {
              src,
            },
          ],
        },
      },
    },
  };
};

const EmojisPage = ({ stats }: { stats: any }) => {
  const [entryStyle] = useSprings(101, (idx: number) => ({
    from: {
      opacity: 0,
      y: 10,
    },
    to: {
      opacity: 1,
      y: 0,
    },
    delay: idx * 7,
  }));
  const truncatedEmojis = useMemo(
    () => stats.user_stats.favourite_emojis.slice(0, 100),
    [stats.user_stats.favourite_emojis]
  );
  const { year, customParticles, setCustomParticles } = useContext(UserContext);

  if (year <= 2024) {
    return (
      <Box
        sx={{ backgroundColor: "rgba(0, 0, 0, 0.2) " }}
        p={2}
        borderRadius={3}
        mt={2}
      >
        <Typography variant="h5">No emoji data for 2024</Typography>
      </Box>
    );
  }

  return (
    <>
      <animated.div style={entryStyle[0]}>
        <Typography my={3}>
          <em>Some of your favourite emojis!</em>
        </Typography>
      </animated.div>
      <Stack gap={2}>
        <Box
          display="flex"
          flexWrap="wrap"
          gap={3}
          width="80vw"
          alignItems="center"
        >
          {truncatedEmojis.map((emoji: any, idx: number) => {
            return (
              <animated.div style={entryStyle[idx + 1]}>
                <Tooltip
                  title={
                    <Stack>
                      {emoji.inline > 0 && (
                        <Typography>
                          {emoji.inline} inline use
                          {emoji.inline === 1 ? "" : "s"}
                        </Typography>
                      )}
                      {emoji.reactions > 0 && (
                        <Typography>
                          {emoji.reactions} reaction
                          {emoji.reactions === 1 ? "" : "s"}
                        </Typography>
                      )}
                    </Stack>
                  }
                  placement="top"
                >
                  <Box
                    height={48}
                    width={48}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    sx={{
                      cursor: "pointer",
                      "&:hover": {
                        transform: "translateY(-4px)",
                      },
                      transition: "all 0.15s ease-in-out",
                      userSelect: "none",
                    }}
                    onClick={() => {
                      const options = getCustomParticleOptions(
                        emoji.url,
                        emoji.native ? emoji.emoji_id : undefined
                      );
                      setCustomParticles(options);
                    }}
                  >
                    {emoji.native ? (
                      <Box maxWidth={48} maxHeight={48} textAlign="center">
                        <Typography fontSize={32}>{emoji.emoji_id}</Typography>
                      </Box>
                    ) : (
                      <Box
                        component="img"
                        src={emoji.url}
                        maxWidth={48}
                        maxHeight={48}
                        objectFit="contain"
                      />
                    )}
                  </Box>
                </Tooltip>
              </animated.div>
            );
          })}
        </Box>
        <Box display="flex" justifyContent="center">
          <animated.div style={entryStyle[truncatedEmojis.length]}>
            <Button
              variant="contained"
              sx={{
                mt: 2,
              }}
              onClick={() => setCustomParticles(undefined)}
              disabled={!customParticles}
            >
              Reset background particles
            </Button>
          </animated.div>
        </Box>
      </Stack>
    </>
  );
};

export default EmojisPage;
