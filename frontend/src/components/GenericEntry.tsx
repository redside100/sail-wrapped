import { useMemo } from "react";
import { COLORS, VIDEO_EXT_LIST } from "../consts";
import { Box, Link, Stack, Typography } from "@mui/material";
import { getTruncatedString } from "../util";
import { useNavigate } from "react-router-dom";
import { Favorite, VideoFile } from "@mui/icons-material";

const GenericEntry = ({
  entryType,
  entryInfo,
  likes,
  sx = {},
}: {
  entryType: "attachment" | "message";
  entryInfo: any;
  rank?: number;
  likes?: number;
  sx?: any;
}) => {
  const navigate = useNavigate();
  const isVideo = useMemo(() => {
    if (entryType === "message") return;
    if (!entryInfo) {
      return false;
    }
    const fileNameParts = entryInfo?.file_name?.toLowerCase()?.split(".") ?? [
      "",
    ];
    return VIDEO_EXT_LIST.includes(
      `.${fileNameParts[fileNameParts.length - 1]}`
    );
  }, [entryType, entryInfo?.attachment_id]);

  const displayName = useMemo(() => {
    if (entryType === "message") return;
    if (!entryInfo) {
      return "";
    }
    return getTruncatedString(entryInfo.file_name, 32);
  }, [entryInfo?.file_name]);

  return (
    <Box
      width={{
        xs: "80vw",
        md: "50vw",
      }}
      height={90}
      borderRadius={3}
      sx={{
        cursor: "pointer",
        backgroundColor: COLORS.BLURPLE,
        "&:hover": {
          backgroundColor: "rgba(88, 101, 242, 0.7) !important",
          transform: "translateY(-2px)",
        },
        transition: "all 0.2s ease-in-out",
        userSelect: "none",
        ...sx,
      }}
      onClick={() =>
        navigate(
          entryType === "attachment"
            ? `/media/view/${entryInfo.attachment_id}`
            : `/messages/view/${entryInfo.message_id}`
        )
      }
    >
      <Box
        display="flex"
        justifyContent="space-between"
        height="100%"
        width="100%"
      >
        <Box display="flex" overflow="hidden" width="100%" p={2}>
          {likes && (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              px={1}
              pr={2}
              gap={1}
            >
              <Favorite
                sx={{
                  color: "red",
                }}
              />
              <Typography>{likes}</Typography>
            </Box>
          )}
          <Stack overflow="hidden" width="100%">
            <Typography variant="h5" noWrap>
              {entryType === "attachment" && displayName}
              {entryType === "message" && (
                <Link color={COLORS.LINK}>@{entryInfo?.sender_handle}</Link>
              )}
            </Typography>
            <Typography noWrap>
              {entryType === "attachment" && (
                <>
                  Sent by{" "}
                  <Link color={COLORS.LINK}>@{entryInfo?.sender_handle}</Link>
                </>
              )}
              {entryType === "message" &&
                getTruncatedString(entryInfo?.content, 128)}
            </Typography>
          </Stack>
        </Box>
        {entryType === "attachment" && (
          <Box
            width={100}
            height="auto"
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            {isVideo ? (
              <VideoFile
                sx={{
                  color: "white",
                  display: {
                    xs: "none",
                    md: "block",
                  },
                }}
                fontSize="large"
              />
            ) : (
              <Box
                component="img"
                src={entryInfo.url}
                borderRadius={3}
                sx={{
                  opacity: 0.5,
                  display: {
                    xs: "none",
                    md: "block",
                  },
                }}
                style={{
                  width: 100,
                  height: 90,
                }}
                loading="lazy"
              />
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default GenericEntry;
