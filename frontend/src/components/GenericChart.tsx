import { Box, Stack, Typography } from "@mui/material";
import { CurveType, LineChart } from "@mui/x-charts";
import { useMemo } from "react";

const GenericChart = ({
  title,
  subtitle,
  yLabel,
  bucket_data,
  color,
  curve,
  width = "90vw",
  height = "60vh",
  counter,
}: {
  title?: string;
  subtitle?: string;
  yLabel: string;
  bucket_data: any;
  color: string;
  curve: CurveType;
  width?: string | number;
  height?: string | number;
  counter?: string;
}) => {
  const data = useMemo(
    () =>
      bucket_data.map((bucket: any) => ({
        ...bucket,
        timestamp: new Date(bucket.timestamp * 1000),
      })),
    [bucket_data]
  );

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <Stack gap={1} alignItems="center">
      <Stack alignItems="center">
        {title && <Typography variant="h5">{title}</Typography>}
        {subtitle && <Typography fontSize={14}>{subtitle}</Typography>}
      </Stack>
      <Box width={width} height={height}>
        <LineChart
          sx={{
            "& .MuiChartsAxisHighlight-root": {
              stroke: "#ffffff",
              opacity: 1,
            },
            "& .MuiChartsGrid-verticalLine": {
              stroke: "#aaaaaaff",
              strokeOpacity: 0.4,
            },
            "& .MuiChartsGrid-horizontalLine": {
              stroke: "#aaaaaaff",
              strokeOpacity: 0.4,
            },
          }}
          xAxis={[
            {
              dataKey: "timestamp",
              scaleType: "time",
              min: data[0]?.timestamp,
              sx: {
                ".MuiChartsAxis-line": { stroke: "#FFFFFF" }, // axis line
                ".MuiChartsAxis-tick": { stroke: "#FFFFFF" }, // tick marks
                ".MuiChartsAxis-label": { fill: "#FFFFFF" }, // axis label text
                ".MuiChartsAxis-tickLabel": { fill: "#FFFFFF" }, // tick text
              },
            },
          ]}
          yAxis={[
            {
              sx: {
                ".MuiChartsAxis-line": { stroke: "#FFFFFF" }, // axis line
                ".MuiChartsAxis-tick": { stroke: "#FFFFFF" }, // tick marks
                ".MuiChartsAxis-label": { fill: "#FFFFFF" }, // axis label text
                ".MuiChartsAxis-tickLabel": { fill: "#FFFFFF" }, // tick text
              },
              label: yLabel,
            },
          ]}
          dataset={data}
          series={[
            {
              dataKey: "count",
              color,
              curve,
              showMark: false,
              valueFormatter: (v, ctx) =>
                `${data[ctx.dataIndex].timestamp.toUTCString()}: ${v} ${
                  counter
                    ? `${counter}${v === 1 ? "" : "s"}`
                    : yLabel.toLowerCase()
                }`,
            },
          ]}
          grid={{ vertical: true, horizontal: true }}
        />
      </Box>
    </Stack>
  );
};

export default GenericChart;
