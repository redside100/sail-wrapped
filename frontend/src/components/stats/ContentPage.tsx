import { Pagination, Stack, Typography } from "@mui/material";
import { usePagination } from "../../util";
import { animated, useSprings } from "@react-spring/web";
import GenericEntry from "../GenericEntry";

const ContentPage = ({ stats }: { stats: any }) => {
  const [entryStyle] = useSprings(10, (idx: number) => ({
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
  const [pageEntities, totalPages, page, setPage] = usePagination(
    stats.notable_content,
    5
  );

  return (
    <>
      <animated.div style={entryStyle[0]}>
        <Typography mt={3}>
          <em>Some interesting things you've sent!</em>
        </Typography>
      </animated.div>
      <Stack gap={1} mt={2}>
        {pageEntities.map((entry: any, idx: number) => (
          <animated.div style={entryStyle[idx]} key={idx}>
            <GenericEntry
              entryType={entry.attachment_id ? "attachment" : "message"}
              entryInfo={entry}
              reactions={entry.total_reactions}
            />
          </animated.div>
        ))}
      </Stack>
      {totalPages > 0 && (
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_, value) => setPage(value)}
          color="primary"
          sx={{
            "& .MuiPaginationItem-root": {
              color: "#fff",
            },
            mt: 2,
          }}
        />
      )}
    </>
  );
};

export default ContentPage;
