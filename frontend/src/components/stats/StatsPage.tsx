import {
  Box,
  Checkbox,
  Grid2,
  Link,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { ReactNode, useContext, useState } from "react";
import { COLORS } from "../../consts";
import { UserContext } from "../../App";
import { animated, useSprings } from "@react-spring/web";
import {
  AccessTime,
  AddReaction,
  AlternateEmail,
  Attachment,
  Favorite,
  Keyboard,
  Message,
  Percent,
  Storage,
} from "@mui/icons-material";

const humanizeFileSize = (size: number) => {
  const i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
  return (
    +(size / Math.pow(1024, i)).toFixed(2) * 1 +
    " " +
    ["B", "kB", "MB", "GB", "TB"][i]
  );
};

const StatEntry = ({
  renderIcon,
  title,
  content,
  tooltip,
}: {
  renderIcon: () => ReactNode;
  title: string;
  content: string | number | (() => ReactNode);
  tooltip?: string;
}) => {
  const isFn = typeof content === "function";
  return (
    <Box
      p={2}
      sx={{
        backgroundColor: COLORS.BLURPLE,
        "&:hover": {
          backgroundColor: `rgba(88, 101, 242, 0.7) !important`,
          transform: "translateY(-2px)",
        },
        transition: "all 0.2s ease-in-out",
        userSelect: "none",
      }}
      borderRadius={3}
    >
      <Stack gap={1} alignItems="center">
        <Box display="flex" gap={1} alignItems="center" justifyContent="center">
          {renderIcon()}
          {tooltip ? (
            <Tooltip title={<Typography>{tooltip}</Typography>} placement="top">
              <Typography variant="h5" noWrap>
                {title}
              </Typography>
            </Tooltip>
          ) : (
            <Typography variant="h5" noWrap>
              {title}
            </Typography>
          )}
        </Box>
        {isFn ? (
          content()
        ) : (
          <Typography variant="h3" noWrap>
            {content}
          </Typography>
        )}
      </Stack>
    </Box>
  );
};

const StatsPage = ({ stats }: { stats: any }) => {
  const [showServerStats, setShowServerStats] = useState(false);
  const { year } = useContext(UserContext);
  const [statStyle] = useSprings(14, (idx: number) => ({
    from: {
      opacity: 0,
      y: 10,
    },
    to: {
      opacity: 1,
      y: 0,
    },
    delay: idx * 70,
  }));
  return (
    <>
      <animated.div style={statStyle[0]}>
        <Box display="flex" alignItems="center" justifyContent="center" mt={3}>
          <Checkbox
            sx={{ color: "white", p: 0 }}
            value={showServerStats}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setShowServerStats(e.target.checked)
            }
          />
          <Typography ml={1}>Show server stats</Typography>
        </Box>
      </animated.div>
      {stats && (
        <Grid2
          container
          spacing={2}
          width="80vw"
          justifyContent="center"
          mt={3}
        >
          <Grid2
            size={{
              xs: 12,
              md: 6,
              lg: 4,
            }}
          >
            <animated.div style={statStyle[0]}>
              <StatEntry
                renderIcon={() => <Message sx={{ color: "white" }} />}
                title="Messages Sent"
                content={
                  showServerStats
                    ? stats.global_stats.total_messages
                    : stats.user_stats.messages_sent
                }
              />
            </animated.div>
          </Grid2>
          <Grid2
            size={{
              xs: 12,
              md: 6,
              lg: 4,
            }}
          >
            <animated.div style={statStyle[1]}>
              <StatEntry
                renderIcon={() => <Keyboard sx={{ color: "white" }} />}
                title="Message Frequency"
                content={`~${(
                  (showServerStats
                    ? stats.global_stats.total_messages
                    : stats.user_stats.messages_sent) /
                  (year % 4 === 0 ? 366 : 365)
                ).toFixed(2)} / day`}
              />
            </animated.div>
          </Grid2>
          <Grid2
            size={{
              xs: 12,
              md: 6,
              lg: 4,
            }}
          >
            <animated.div style={statStyle[2]}>
              <StatEntry
                renderIcon={() => <AccessTime sx={{ color: "white" }} />}
                title="Most Frequent Hour"
                content={
                  showServerStats
                    ? "--"
                    : `${stats.user_stats.most_frequent_time} UTC`
                }
              />
            </animated.div>
          </Grid2>
          <Grid2
            size={{
              xs: 12,
              md: 6,
              lg: 4,
            }}
          >
            <animated.div style={statStyle[3]}>
              <StatEntry
                renderIcon={() => <Attachment sx={{ color: "white" }} />}
                title="Attachments Sent"
                content={
                  showServerStats
                    ? stats.global_stats.total_attachments
                    : stats.user_stats.attachments_sent
                }
              />
            </animated.div>
          </Grid2>
          <Grid2
            size={{
              xs: 12,
              md: 6,
              lg: 4,
            }}
          >
            <animated.div style={statStyle[4]}>
              <StatEntry
                renderIcon={() => <Storage sx={{ color: "white" }} />}
                title="Total Attachments Size"
                content={humanizeFileSize(
                  showServerStats
                    ? stats.global_stats.total_attachments_size
                    : stats.user_stats.attachments_size
                )}
              />
            </animated.div>
          </Grid2>
          <Grid2
            size={{
              xs: 12,
              md: 6,
              lg: 4,
            }}
          >
            <animated.div style={statStyle[5]}>
              <StatEntry
                renderIcon={() => <Storage sx={{ color: "white" }} />}
                title="Avg. Attachment Size"
                content={() => {
                  const attachmentsSent = showServerStats
                    ? stats.global_stats.total_attachments
                    : stats.user_stats.attachments_sent;
                  const attachmentsSize = showServerStats
                    ? stats.global_stats.total_attachments_size
                    : stats.user_stats.attachments_size;
                  return (
                    <Typography variant="h3">
                      {humanizeFileSize(
                        attachmentsSent == 0
                          ? 0
                          : attachmentsSize / attachmentsSent
                      )}
                    </Typography>
                  );
                }}
              />
            </animated.div>
          </Grid2>
          <Grid2
            size={{
              xs: 12,
              md: 6,
              lg: 4,
            }}
          >
            <animated.div style={statStyle[6]}>
              <StatEntry
                renderIcon={() => <AddReaction sx={{ color: "white" }} />}
                title="Reactions Received"
                content={
                  showServerStats
                    ? stats.global_stats.total_reactions
                    : stats.user_stats.reactions_received
                }
              />
            </animated.div>
          </Grid2>
          <Grid2
            size={{
              xs: 12,
              md: 6,
              lg: 4,
            }}
          >
            <animated.div style={statStyle[7]}>
              <StatEntry
                renderIcon={() => <AddReaction sx={{ color: "white" }} />}
                title="Reactions Given"
                content={
                  showServerStats
                    ? stats.global_stats.total_reactions
                    : stats.user_stats.reactions_given
                }
              />
            </animated.div>
          </Grid2>
          <Grid2
            size={{
              xs: 12,
              md: 6,
              lg: 4,
            }}
          >
            <animated.div style={statStyle[8]}>
              <StatEntry
                renderIcon={() => <Percent sx={{ color: "white" }} />}
                title="Reaction Ratio"
                content={
                  showServerStats
                    ? "1.00"
                    : stats.reactions_given == 0
                    ? 0
                    : (
                        stats.user_stats.reactions_received /
                        stats.user_stats.reactions_given
                      ).toFixed(2)
                }
              />
            </animated.div>
          </Grid2>
          <Grid2
            size={{
              xs: 12,
              md: 6,
              lg: 4,
            }}
          >
            <animated.div style={statStyle[9]}>
              <StatEntry
                renderIcon={() => <AlternateEmail sx={{ color: "white" }} />}
                title="Mentions Received"
                tooltip="Includes message replies"
                content={
                  showServerStats
                    ? stats.global_stats.total_mentions
                    : stats.user_stats.mentions_received
                }
              />
            </animated.div>
          </Grid2>
          <Grid2
            size={{
              xs: 12,
              md: 6,
              lg: 4,
            }}
          >
            <animated.div style={statStyle[10]}>
              <StatEntry
                renderIcon={() => <AlternateEmail sx={{ color: "white" }} />}
                title="Mentions Given"
                tooltip="Includes message replies"
                content={
                  showServerStats
                    ? stats.global_stats.total_mentions
                    : stats.user_stats.mentions_given
                }
              />
            </animated.div>
          </Grid2>
          <Grid2
            size={{
              xs: 12,
              md: 6,
              lg: 4,
            }}
          >
            <animated.div style={statStyle[11]}>
              <StatEntry
                renderIcon={() => <Percent sx={{ color: "white" }} />}
                title="Mention Ratio"
                content={
                  showServerStats
                    ? "1.00"
                    : stats.user_stats.mentions_given == 0
                    ? 0
                    : (
                        stats.user_stats.mentions_received /
                        stats.user_stats.mentions_given
                      ).toFixed(2)
                }
              />
            </animated.div>
          </Grid2>
          <Grid2
            size={{
              xs: 12,
              md: 6,
            }}
          >
            <animated.div style={statStyle[12]}>
              <StatEntry
                renderIcon={() => <Favorite sx={{ color: "white" }} />}
                title="Most Mentioned"
                content={
                  showServerStats || !stats.user_stats.most_mentioned_given_name
                    ? "--"
                    : () => (
                        <Typography variant="h4">
                          <Tooltip
                            title={
                              <Typography>
                                You mentioned them in{" "}
                                {stats.user_stats.most_mentioned_given_count} of
                                your messages
                              </Typography>
                            }
                            placement="top"
                          >
                            <Box display="flex" gap={1} alignItems="center">
                              <Box
                                component="img"
                                src={
                                  stats.user_stats
                                    .most_mentioned_given_avatar_url
                                }
                                width={40}
                                height={40}
                                borderRadius={10}
                              />
                              <Link color={COLORS.LINK}>
                                @{stats.user_stats.most_mentioned_given_name}
                              </Link>
                            </Box>
                          </Tooltip>
                        </Typography>
                      )
                }
              />
            </animated.div>
          </Grid2>
          <Grid2
            size={{
              xs: 12,
              md: 6,
            }}
          >
            <animated.div style={statStyle[13]}>
              <StatEntry
                renderIcon={() => <Favorite sx={{ color: "white" }} />}
                title="Most Mentioned By"
                content={
                  showServerStats ||
                  !stats.user_stats.most_mentioned_received_name
                    ? "--"
                    : () => (
                        <Typography variant="h4">
                          <Tooltip
                            title={
                              <Typography>
                                They mentioned you in{" "}
                                {stats.user_stats.most_mentioned_received_count}{" "}
                                of their messages
                              </Typography>
                            }
                            placement="top"
                          >
                            <Box display="flex" gap={1} alignItems="center">
                              <Box
                                component="img"
                                src={
                                  stats.user_stats
                                    .most_mentioned_received_avatar_url
                                }
                                width={40}
                                height={40}
                                borderRadius={10}
                              />
                              <Link color={COLORS.LINK}>
                                @{stats.user_stats.most_mentioned_received_name}
                              </Link>
                            </Box>
                          </Tooltip>
                        </Typography>
                      )
                }
              />
            </animated.div>
          </Grid2>
        </Grid2>
      )}
    </>
  );
};

export default StatsPage;
