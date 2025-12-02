import {
  Box,
  Grid2,
  Link,
  Slider,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { animated, easings, useSpring, useSprings } from "@react-spring/web";
import { useContext, useMemo, useState } from "react";
import { getTimeMachineSnapshot } from "../api";
import toast from "react-hot-toast";
import { AccessTime, Egg, OpenInNew } from "@mui/icons-material";
import moment from "moment";
import { LoadingAnimation } from "./LoadingPage";
import { MessageContainer } from "./Messages";
import {
  COLORS,
  EASTER_DATE_OFFSET,
  SAIL_MSG_URL,
  VIDEO_EXT_LIST,
} from "../consts";
import { MediaContainer } from "./Media";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../App";

const MARKS = [
  {
    value: 0,
    label: "Jan",
  },
  {
    value: 31,
    label: "Feb",
  },
  {
    value: 60,
    label: "Mar",
  },
  {
    value: 91,
    label: "Apr",
  },
  {
    value: 121,
    label: "May",
  },
  {
    value: 152,
    label: "Jun",
  },
  {
    value: 182,
    label: "Jul",
  },
  {
    value: 213,
    label: "Aug",
  },
  {
    value: 244,
    label: "Sep",
  },
  {
    value: 274,
    label: "Oct",
  },
  {
    value: 305,
    label: "Nov",
  },
  {
    value: 335,
    label: "Dec",
  },
  {
    value: 365,
    label: <AccessTime sx={{ fontSize: 18 }} />,
  },
];

const TimeMachine = () => {
  const [style] = useSprings(3, (idx: number) => ({
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

  const [snapshotInfo, setSnapshotInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dateOffset, setDateOffset] = useState(0);
  const navigate = useNavigate();
  const { user, year } = useContext(UserContext);

  const [fadeStyle] = useSpring(
    {
      from: {
        opacity: 0,
        y: 10,
      },
      to: {
        opacity: 1,
        y: 0,
      },
      reset: true,
    },
    [dateOffset]
  );

  const [snapshotStyle] = useSprings(
    32,
    (idx: number) => ({
      from: {
        y: 4 * (idx % 2),
      },
      to: [
        {
          y: 4 * ((idx + 1) % 2),
        },
        {
          y: 4 * (idx % 2),
        },
      ],
      reset: true,
      loop: true,
      config: {
        easing: easings.easeInOutCubic,
        duration: 1000 + 100 * idx,
      },
    }),
    [dateOffset]
  );

  const loadSnapshot = async (date: string) => {
    const token = localStorage.getItem("access_token") ?? "";
    setSnapshotInfo(null);
    setIsLoading(true);
    const [res, status] = await getTimeMachineSnapshot(token, date, year);
    if (status !== 200) {
      toast.error(`Failed to fetch snapshot. Reason: ${res.detail}`);
      setIsLoading(false);
      return;
    }
    setSnapshotInfo(res);
    setIsLoading(false);
  };

  const getDate = (value: number) => {
    return moment()
      .year(year)
      .startOf("year")
      .add(moment.duration(value, "day"))
      .format("YYYY-MM-DD");
  };

  const displayDate = useMemo(
    () =>
      moment()
        .year(year)
        .startOf("year")
        .add(moment.duration(dateOffset, "day"))
        .format("MMM DD, YYYY"),
    [dateOffset]
  );

  const isEmptyDate = useMemo(
    () =>
      snapshotInfo?.attachments?.length === 0 &&
      snapshotInfo?.messages?.length === 0,
    [snapshotInfo]
  );

  const isVideo = (attachment: any) => {
    const fileNameParts = attachment?.file_name?.toLowerCase()?.split(".") ?? [
      "",
    ];
    return VIDEO_EXT_LIST.includes(
      `.${fileNameParts[fileNameParts.length - 1]}`
    );
  };

  return (
    <Stack justifyContent="center" alignItems="center" p={3}>
      <animated.div style={style[0]}>
        <Box display="flex" gap={1} alignItems="center" mt={2}>
          <AccessTime sx={{ color: "white", fontSize: 40 }} />
          <Typography variant="h3" noWrap>
            Time Machine
          </Typography>
        </Box>
      </animated.div>
      <animated.div style={style[1]}>
        <Typography>See random snapshots of a date in {year}</Typography>
      </animated.div>
      <animated.div style={style[2]}>
        <Box
          sx={{
            width: {
              xs: "80vw",
              sm: "60vw",
            },
            backgroundColor: "rgba(0, 0, 0, 0.15)",
          }}
          mt={3}
          px={3}
          py={1}
          borderRadius={3}
        >
          <Slider
            valueLabelDisplay="auto"
            shiftStep={1}
            step={1}
            min={0}
            max={year % 4 === 0 ? 365 : 364}
            color="secondary"
            onChangeCommitted={(_: unknown, value: number | number[]) => {
              if (Array.isArray(value)) {
                return;
              }
              setDateOffset(value);
              loadSnapshot(getDate(value));
            }}
            valueLabelFormat={(value: number) => getDate(value)}
            sx={{
              "& .MuiSlider-markLabel": {
                color: "white",
              },
            }}
            marks={MARKS}
          />
        </Box>
      </animated.div>
      {isLoading && (
        <Box mt={3}>
          <LoadingAnimation />
        </Box>
      )}
      {!isLoading && snapshotInfo && (
        <>
          <animated.div style={fadeStyle}>
            <Typography mt={3} variant="h5">
              {displayDate}
            </Typography>
          </animated.div>
          {!isEmptyDate ? (
            <>
              <Grid2 container mt={2} gap={1} justifyContent="center">
                {snapshotInfo.messages.map((message: any, idx: number) => (
                  <Grid2
                    size={{
                      xs: 12,
                      md: 3,
                    }}
                    key={`snapshot-message-${idx}`}
                  >
                    <animated.div style={snapshotStyle[idx]}>
                      <Stack
                        sx={{
                          maxWidth: {
                            xs: "95vw",
                            md: "100%",
                          },
                        }}
                      >
                        <MessageContainer
                          messageInfo={message}
                          maxWidth="100%"
                        />
                        <animated.div style={fadeStyle}>
                          <Box
                            display="flex"
                            gap={1}
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Typography textAlign="center">
                              Sent by{" "}
                              <Link color={COLORS.LINK}>
                                @{message.sender_handle}
                              </Link>{" "}
                              in{" "}
                              <Tooltip title="Click to view in Discord">
                                <Link
                                  color={COLORS.LINK}
                                  href={`${SAIL_MSG_URL}/${message.channel_id}/${message.message_id}`}
                                >
                                  #{message.channel_name}
                                </Link>
                              </Tooltip>
                            </Typography>
                            <OpenInNew
                              sx={{
                                color: "white",
                                cursor: "pointer",
                                "&:hover": {
                                  opacity: 0.6,
                                },
                                fontSize: 20,
                              }}
                              onClick={() =>
                                window
                                  .open(
                                    `${window.location.origin}/messages/view/${message.message_id}`,
                                    "_blank"
                                  )
                                  ?.focus()
                              }
                            />
                          </Box>
                        </animated.div>
                      </Stack>
                    </animated.div>
                  </Grid2>
                ))}
              </Grid2>
              <Grid2 container mt={4} gap={3} justifyContent="center">
                {snapshotInfo.attachments.map(
                  (attachment: any, idx: number) => {
                    const video = isVideo(attachment);
                    return (
                      <Grid2
                        size={{
                          xs: 12,
                          md: 3,
                        }}
                        key={`snapshot-attachment-${idx}`}
                      >
                        <animated.div style={snapshotStyle[idx]}>
                          <Stack alignItems="center">
                            <MediaContainer
                              isVideo={video}
                              url={attachment.url}
                              defaultVolume={0}
                              maxWidth="100%"
                              isSpoiler={attachment.file_name.startsWith(
                                "SPOILER_"
                              )}
                            />
                            <animated.div style={fadeStyle}>
                              <Box display="flex" gap={1} alignItems="center">
                                <Typography textAlign="center">
                                  Sent by{" "}
                                  <Link color={COLORS.LINK}>
                                    @{attachment.sender_handle}
                                  </Link>{" "}
                                  in{" "}
                                  <Tooltip title="Click to view in Discord">
                                    <Link
                                      color={COLORS.LINK}
                                      href={`${SAIL_MSG_URL}/${attachment.related_channel_id}/${attachment.related_message_id}`}
                                    >
                                      #{attachment.related_channel_name}
                                    </Link>
                                  </Tooltip>
                                </Typography>
                                <OpenInNew
                                  sx={{
                                    color: "white",
                                    cursor: "pointer",
                                    "&:hover": {
                                      opacity: 0.6,
                                    },
                                    fontSize: 20,
                                  }}
                                  onClick={() =>
                                    window
                                      .open(
                                        `${window.location.origin}/media/view/${attachment.attachment_id}?year=${year}`,
                                        "_blank"
                                      )
                                      ?.focus()
                                  }
                                />
                              </Box>
                            </animated.div>
                          </Stack>
                        </animated.div>
                      </Grid2>
                    );
                  }
                )}
              </Grid2>
            </>
          ) : (
            <Box
              sx={{ backgroundColor: "rgba(0, 0, 0, 0.2) " }}
              mt={3}
              p={2}
              borderRadius={3}
            >
              <Typography variant="h5">
                There was no data found for this date.
              </Typography>
            </Box>
          )}
        </>
      )}
      {dateOffset === EASTER_DATE_OFFSET[year] && (
        <Box display="flex" width="100%" justifyContent="flex-end" mt={3}>
          <Egg
            sx={{
              color: "white",
              cursor: "pointer",
              "&:hover": {
                opacity: 0.6,
              },
            }}
            onClick={() =>
              navigate(
                `/super-duper-secret-page-for-cool-people?user=${user.info?.id}`
              )
            }
          />
        </Box>
      )}
    </Stack>
  );
};
export default TimeMachine;
