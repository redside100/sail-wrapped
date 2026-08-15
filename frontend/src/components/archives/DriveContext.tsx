import { createContext } from "react";
import { DriveObject } from "./types";

type DriveContextType = {
  activeDriveObject: DriveObject | undefined;
  setActiveDriveObject: (obj: DriveObject | undefined) => void;
  visibleObjects: DriveObject[];
};
export const DriveContext = createContext<DriveContextType>({
  activeDriveObject: undefined,
  setActiveDriveObject: (_: DriveObject | undefined) => {},
  visibleObjects: [],
});
