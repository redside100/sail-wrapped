import { createContext } from "react";
import { DriveObject } from "./types";

type DriveContextType = {
  activeDriveObject: DriveObject | undefined;
  setActiveDriveObject: (obj: DriveObject | undefined) => void;
  visibleObjects: DriveObject[];
  driveObjects: DriveObject[];
  selectedKeys: string[];
  setSelectedKeys: (keys: string[]) => void;
};
export const DriveContext = createContext<DriveContextType>({
  activeDriveObject: undefined,
  setActiveDriveObject: (_: DriveObject | undefined) => {},
  driveObjects: [],
  visibleObjects: [],
  selectedKeys: [],
  setSelectedKeys: (_: string[]) => {},
});
