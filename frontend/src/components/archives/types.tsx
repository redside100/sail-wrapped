export type DriveObject = {
  key: string;
  created: string;
  is_directory: boolean;
  author: {
    avatar: string;
    global_name: string;
    username: string;
    id: string;
  };
};
