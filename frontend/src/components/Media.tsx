import {
  Box,
  Button,
  Checkbox,
  Link,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { animated, useSpring, useSprings } from "@react-spring/web";
import { useContext, useEffect, useMemo, useState } from "react";
import {
  getAttachment,
  getLikes,
  getRandomAttachment,
  sendLike,
  sendUnlike,
} from "../api";
import toast from "react-hot-toast";
import { COLORS, SAIL_MSG_URL, VIDEO_EXT_LIST } from "../consts";
import { Favorite, FavoriteBorder, PermMedia } from "@mui/icons-material";
import moment from "moment";
import { useParams, useSearchParams } from "react-router-dom";
import LinkIcon from "@mui/icons-material/Link";
import { getTruncatedString } from "../util";
import { LoadingAnimation } from "./LoadingPage";
import { UserContext } from "../App";

export const MediaContainer = ({
  isVideo,
  maxHeight = "min(60vh, 400px)",
  maxWidth = "min(95vw, 800px)",
  defaultVolume = 0.5,
  url,
  isSpoiler = false,
}: {
  isVideo: boolean;
  maxHeight?: string;
  maxWidth?: string;
  defaultVolume?: number;
  url: string;
  isSpoiler?: boolean;
}) => {
  const [style] = useSpring(
    {
      from: {
        opacity: 0,
        y: 10,
      },
      to: {
        opacity: 1,
        y: 0,
      },
    },
    [url]
  );
  const [spoilerFilter, setSpoilerFilter] = useState(isSpoiler);
  return (
    <animated.div style={style}>
      <Box position="relative">
        {spoilerFilter && (
          <Button
            variant="contained"
            sx={{
              position: "absolute",
              zIndex: 1,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
            onClick={() => setSpoilerFilter(false)}
          >
            Show Spoiler
          </Button>
        )}
        {isVideo ? (
          <Box
            sx={{
              boxShadow: "0px 0px 30px rgba(255, 255, 255, 0.4);",
            }}
            component="video"
            onLoadStart={(e: any) => {
              e.target.volume = defaultVolume;
            }}
            src={url}
            controls
            autoPlay={!spoilerFilter}
            style={{
              maxWidth,
              maxHeight,
              ...(spoilerFilter && {
                filter: "blur(10px)",
              }),
            }}
            loop
          />
        ) : (
          <Box
            sx={{
              boxShadow: "0px 0px 30px rgba(255, 255, 255, 0.4);",
            }}
            component="img"
            src={url}
            style={{
              maxWidth,
              maxHeight,
              ...(spoilerFilter && {
                filter: "blur(10px)",
              }),
            }}
          />
        )}
      </Box>
    </animated.div>
  );
};

const Media = () => {
  const { viewAttachmentId } = useParams();
  const [searchParams] = useSearchParams();

  const [videoOnly, setVideoOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [likeAdjustment, setLikeAdjustment] = useState(0);
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

  const [mediaInfo, setMediaInfo] = useState<any>(null);
  const [userLikes, setUserLikes] = useState<any>(null);
  const [fetchedInfo, setFetchedInfo] = useState<any>(null);
  const [liked, setLiked] = useState(false);

  const { year } = useContext(UserContext);

  useEffect(() => {
    if (!viewAttachmentId) {
      return;
    }
    const requestedYear = searchParams.get("year")
      ? Number(searchParams.get("year"))
      : year;
    const fetchMedia = async () => {
      const token = localStorage.getItem("access_token") ?? "";
      const [res, status] = await getAttachment(
        token,
        viewAttachmentId,
        requestedYear
      );
      if (status !== 200) {
        toast.error("Failed to get media.");
        return;
      }
      setMediaInfo(res);
    };
    fetchMedia();
  }, [year]);

  // fetch/sync user attachment likes on load
  useEffect(() => {
    const fetchLikes = async () => {
      const token = localStorage.getItem("access_token") ?? "";
      const [res, status] = await getLikes(token, year);
      if (status !== 200) {
        toast.error("Failed to get likes.");
        return;
      }
      const likes = res.attachments.map(
        ({ attachment_id }: { attachment_id: string }) => attachment_id
      );
      setUserLikes(likes);
      setFetchedInfo(likes);
    };
    fetchLikes();
  }, []);

  // load like state from user likes
  useEffect(() => {
    if (!mediaInfo) {
      return;
    }
    setLiked(userLikes?.includes(mediaInfo.attachment_id) ?? false);
    setLikeAdjustment(0);
  }, [mediaInfo?.attachment_id, fetchedInfo]);

  const isVideo = useMemo(() => {
    if (!mediaInfo) {
      return false;
    }
    const fileNameParts = mediaInfo?.file_name?.toLowerCase()?.split(".") ?? [
      "",
    ];
    return VIDEO_EXT_LIST.includes(
      `.${fileNameParts[fileNameParts.length - 1]}`
    );
  }, [mediaInfo?.file_name]);

  const mediaCaption = useMemo(() => {
    if (!mediaInfo) {
      return "";
    }
    return getTruncatedString(mediaInfo.related_message_content, 50);
  }, [mediaInfo?.related_message_content]);

  const rollMedia = async () => {
    const token = localStorage.getItem("access_token") ?? "";
    setMediaInfo(null);
    setIsLoading(true);
    const [res, status] = await getRandomAttachment(token, videoOnly, year);
    if (status !== 200) {
      toast.error(`Failed to fetch media. Reason: ${res.detail}`);
      setIsLoading(false);
      return;
    }
    setMediaInfo(res);
    setIsLoading(false);
  };

  const setLike = async (like: boolean) => {
    const token = localStorage.getItem("access_token") ?? "";
    if (like) {
      const [, status] = await sendLike(token, mediaInfo.attachment_id, true);
      if (status !== 200) {
        toast("Failed to like attachment.");
        return;
      }
    } else {
      const [, status] = await sendUnlike(token, mediaInfo.attachment_id, true);
      if (status !== 200) {
        toast("Failed to unlike attachment.");
        return;
      }
    }
    setLiked(like);
    setUserLikes((prev: any) => {
      const newAttachments = new Set(prev);
      if (like) {
        newAttachments.add(mediaInfo.attachment_id);
      } else {
        newAttachments.delete(mediaInfo.attachment_id);
      }
      return [...newAttachments];
    });
    setLikeAdjustment((prev) => prev + (like ? 1 : -1));
  };

  return (
    <Stack justifyContent="center" alignItems="center" p={3}>
      <animated.div style={style[0]}>
        <Box display="flex" gap={1} alignItems="center" mt={2}>
          <PermMedia sx={{ color: "white", fontSize: 40 }} />
          <Typography variant="h3">Media</Typography>
        </Box>
      </animated.div>
      <animated.div style={style[1]}>
        <Typography>Explore random attachments sent on Sail</Typography>
      </animated.div>
      <animated.div style={style[2]}>
        <Stack mt={3} justifyContent="center" gap={1}>
          {!viewAttachmentId && (
            <>
              <Button
                variant="contained"
                onClick={rollMedia}
                sx={{
                  width: 150,
                  height: 50,
                  alignSelf: "center",
                }}
                disabled={isLoading}
              >
                Roll
              </Button>
              <Box display="flex" alignItems="center" justifyContent="center">
                <Checkbox
                  sx={{ color: "white", p: 0 }}
                  value={videoOnly}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setVideoOnly(e.target.checked)
                  }
                />
                <Typography ml={1}>Videos Only</Typography>
              </Box>
            </>
          )}
          {isLoading && (
            <Box mt={3}>
              <LoadingAnimation />
            </Box>
          )}
          {mediaInfo && !isLoading && (
            <Stack gap={1} mt={1} justifyContent="center" alignItems="center">
              {mediaCaption && (
                <Typography textAlign="center">
                  <em>{mediaCaption}</em>
                </Typography>
              )}
              <Box
                maxWidth={800}
                maxHeight={400}
                display="flex"
                justifyContent="center"
              >
                <MediaContainer
                  isVideo={isVideo}
                  url={mediaInfo.url}
                  isSpoiler={mediaInfo.file_name.startsWith("SPOILER_")}
                />
              </Box>
              <Typography textAlign="center">
                {moment(mediaInfo.timestamp).format("YYYY-MM-DD [at] h:mm A")}
              </Typography>
              <Box display="flex" alignItems="center" gap={0.5}>
                <Typography>Sent by</Typography>
                <Box
                  component="img"
                  src={mediaInfo.sender_avatar_url}
                  width={20}
                  height={20}
                  borderRadius={10}
                />
                <Typography>
                  <Link color={COLORS.LINK}>@{mediaInfo.sender_handle}</Link>
                </Typography>
                <Typography>in</Typography>
                <Tooltip title="Click to view in Discord">
                  <Typography>
                    <Link
                      color={COLORS.LINK}
                      href={`${SAIL_MSG_URL}/${mediaInfo.related_channel_id}/${mediaInfo.related_message_id}`}
                    >
                      #{mediaInfo.related_channel_name}
                    </Link>
                  </Typography>
                </Tooltip>
              </Box>
              <Box display="flex" justifyContent="center" gap={2}>
                <Tooltip title="Copy permalink">
                  <LinkIcon
                    sx={{
                      color: "white",
                      cursor: "pointer",
                      "&:hover": {
                        opacity: 0.6,
                      },
                    }}
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/media/view/${mediaInfo.attachment_id}?year=${year}`
                      );
                      toast.success("Copied permalink to clipboard");
                    }}
                  />
                </Tooltip>
                <Box display="flex" gap={1}>
                  {liked ? (
                    <Favorite
                      sx={{
                        color: "red",
                        cursor: "pointer",
                        "&:hover": {
                          opacity: 0.6,
                        },
                      }}
                      onClick={() => setLike(false)}
                    />
                  ) : (
                    <FavoriteBorder
                      sx={{
                        color: "white",
                        cursor: "pointer",
                        "&:hover": {
                          opacity: 0.6,
                        },
                      }}
                      onClick={() => setLike(true)}
                    />
                  )}
                  <Typography>{mediaInfo.likes + likeAdjustment}</Typography>
                </Box>
              </Box>
            </Stack>
          )}
        </Stack>
      </animated.div>
    </Stack>
  );
};
export default Media;
