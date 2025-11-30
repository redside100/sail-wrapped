export const AUTH_URL =
  process.env.NODE_ENV === "development"
    ? "https://discord.com/oauth2/authorize?client_id=1293425051881832520&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2F&scope=identify+guilds"
    : "https://discord.com/oauth2/authorize?client_id=1293425051881832520&response_type=code&redirect_uri=https%3A%2F%2Fsw.redside.moe%2F&scope=identify+guilds";

export const API_BASE =
  process.env.NODE_ENV === "development"
    ? "http://localhost:8000"
    : "https://api-sw.redside.moe";
export const DISCORD_CDN_BASE = "https://cdn.discordapp.com";

export const COLORS = {
  LINK: "#90caf9",
  BLURPLE: "#5865F2",
};
export const PARTICLE_OPTIONS = {
  particles: {
    number: {
      value: 200,
      density: {
        enable: true,
      },
    },
    color: {
      value: "#fff",
    },
    shape: {
      type: ["circle", "triangle", "square"],
    },
    rotate: {
      value: {
        min: 0,
        max: 360,
      },
      direction: "random",
      move: true,
      animation: {
        enable: true,
        speed: 20,
      },
    },
    opacity: {
      value: 0.2,
    },
    size: {
      value: 20,
    },
    move: {
      enable: true,
      speed: 1,
      straight: true,
    },
    wobble: {
      enable: true,
      distance: 15,
      speed: 15,
    },
    zIndex: {
      value: {
        min: 0,
        max: 100,
      },
      opacityRate: 10,
      sizeRate: 2,
      velocityRate: 8,
    },
  },
};
export const CUSTOM_PARTICLE_OPTIONS_BASE = {
  particles: {
    number: {
      value: 250,
      density: {
        enable: true,
      },
    },
    color: {
      value: "#fff",
    },
    shape: {
      type: "image",
      options: {
        image: [],
      },
    },
    rotate: {
      value: {
        min: 0,
        max: 360,
      },
      direction: "random",
      move: true,
      animation: {
        enable: true,
        speed: 20,
      },
    },
    opacity: {
      value: 0.2,
    },
    size: {
      value: 40,
    },
    move: {
      enable: true,
      speed: 1,
      straight: true,
    },
    wobble: {
      enable: true,
      distance: 15,
      speed: 15,
    },
    zIndex: {
      value: {
        min: 0,
        max: 100,
      },
      opacityRate: 8,
      velocityRate: 8,
    },
  },
};
export const PUSHEEN_PARTICLE_OPTIONS = {
  ...CUSTOM_PARTICLE_OPTIONS_BASE,
  particles: {
    ...CUSTOM_PARTICLE_OPTIONS_BASE.particles,
    shape: {
      ...CUSTOM_PARTICLE_OPTIONS_BASE.particles.shape,
      options: {
        image: [
          {
            src: "/pusheen_cookie_particle.png",
          },
          {
            src: "/pusheen.png",
          },
          {
            src: "/pusheen_donut.png",
          },
          {
            src: "/pusheen_pizza.png",
          },
          {
            src: "/pusheen_burger.png",
          },
        ],
      },
    },
  },
};

export const VIDEO_EXT_LIST = [
  ".webm",
  ".mkv",
  ".flv",
  ".vob",
  ".ogv",
  ".ogg",
  ".rrc",
  ".gifv",
  ".mng",
  ".mov",
  ".avi",
  ".qt",
  ".wmv",
  ".yuv",
  ".rm",
  ".asf",
  ".amv",
  ".mp4",
  ".m4p",
  ".m4v",
  ".mpg",
  ".mp2",
  ".mpeg",
  ".mpe",
  ".mpv",
  ".m4v",
  ".svi",
  ".3gp",
  ".3g2",
  ".mxf",
  ".roq",
  ".nsv",
  ".flv",
  ".f4v",
  ".f4p",
  ".f4a",
  ".f4b",
  ".mod",
];

export const SAIL_MSG_URL = "discord://discord.com/channels/169611319501258753";
export const CURRENT_YEAR = 2025;
export const EASTER_DATE_OFFSET: Record<number, number> = {
  2024: 90,
  2025: 109,
};
