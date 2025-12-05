import os

DISCORD_API_ENDPOINT = "https://discord.com/api/v10"
CLIENT_ID = "1293425051881832520"
REDIRECT_URI = (
    "https://sw.redside.moe/"
    if os.environ.get("ENV", "local") == "production"
    else "http://localhost:3000/"
)
CLIENT_SECRET = ""
VIDEO_EXT_LIST = [
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
]

EXCLUDED_EXTENSIONS = [".yaml", ".zip"]
ATTACHMENT_URL_BASE = (
    "https://redside.tor1.digitaloceanspaces.com/sw/{}/attachments/{}_{}"
)
AVATAR_URL_BASE = "https://redside.tor1.digitaloceanspaces.com/sw/{}/avatars/{}.png"
# png or gif
EMOJI_URL_BASE = "https://redside.tor1.digitaloceanspaces.com/sw/{}/emojis/{}"

ATTACHMENT_EXCLUDE_REPEAT_COUNT = 25

with open("client_secret", "r") as f:
    CLIENT_SECRET = f.read()
