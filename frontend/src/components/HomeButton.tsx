import { ArrowForward } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { COLORS } from "../consts";

const HomeButton = ({
  to,
  title,
  description,
  hoverColor = "rgba(88, 101, 242, 0.6)",
}: {
  to: string;
  title: string;
  description: string;
  hoverColor?: string;
}) => {
  const navigate = useNavigate();
  return (
    <Box
      p={2}
      sx={{
        cursor: "pointer",
        backgroundColor: COLORS.BLURPLE,
        "&:hover": {
          backgroundColor: `${hoverColor} !important`,
          transform: "translateY(-2px)",
        },
        transition: "all 0.2s ease-in-out",
        userSelect: "none",
      }}
      borderRadius={5}
      onClick={() => navigate(to)}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Stack gap={0.5}>
          <Typography variant="h5">{title}</Typography>
          <Typography>{description}</Typography>
        </Stack>
        <ArrowForward sx={{ color: "white" }} />
      </Box>
    </Box>
  );
};
export default HomeButton;
