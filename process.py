from datetime import datetime
import os
import time
import orjson
import requests
import sqlite3
import pathlib

json_files = os.listdir("export")
file_count = len(json_files)
conn = sqlite3.connect("backend/wrapped.db")

DOWNLOAD_ATTACHMENTS = bool(os.environ.get("DOWNLOAD_ATTACHMENTS"))
CURRENT_YEAR = int(os.environ.get("CURRENT_YEAR", "2025"))

print("Current year:", CURRENT_YEAR)

seen_emojis = set()

for i, file_name in enumerate(json_files):
    print(f"Processing file {i + 1}/{file_count} - {file_name}")
    with open(f"export/{file_name}", "r", encoding="utf-8") as f:
        start_time = int(time.time())
        logs = orjson.loads(f.read())
        end_time = int(time.time())
        channel_id = int(logs.get("channel", {}).get("id", "0"))
        channel_name = logs.get("channel", {}).get("name")

        print(f"Loaded into memory - {channel_id} - {channel_name}")
        print(f"Took {end_time - start_time} second(s)")

        log_messages = logs.get("messages", [])
        message_count = len(log_messages)
        print(f"Parsing through {message_count} messages")
        for j, message in enumerate(log_messages):
            if j % 500 == 0:
                print(
                    f"Process {j + 1}/{message_count} - {channel_id} - {channel_name}"
                )
                conn.commit()

            if message["author"]["isBot"]:
                continue

            message_id = int(message["id"])
            type = message["type"]

            formatted_timestamp = message["timestamp"]
            if "." not in formatted_timestamp:
                formatted_timestamp = (
                    formatted_timestamp.replace("+00:00", "") + ".0+00:00"
                )

            timestamp = int(
                datetime.strptime(
                    formatted_timestamp, "%Y-%m-%dT%H:%M:%S.%f%z"
                ).timestamp()
            )
            content = message["content"]
            author_id = int(message["author"].get("id", "0"))
            author_name = message["author"].get("name", "")
            author_nickname = message["author"].get("nickname", "")
            author_discriminator = message["author"].get("discriminator", "0000")
            author_avatar_url = message["author"].get("avatarUrl", "")
            attachments = orjson.dumps(message["attachments"])
            embeds = orjson.dumps(message["embeds"])
            stickers = orjson.dumps(message["stickers"])
            reactions = orjson.dumps(message["reactions"])
            mentions = orjson.dumps(message["mentions"])
            total_reactions = sum(
                [reaction["count"] for reaction in message["reactions"]]
            )
            inline_emojis = orjson.dumps(message["inlineEmojis"])

            t = (
                message_id,
                type,
                timestamp,
                content,
                author_id,
                author_name,
                author_nickname,
                author_discriminator,
                author_avatar_url,
                attachments,
                embeds,
                stickers,
                reactions,
                total_reactions,
                mentions,
                inline_emojis,
                channel_id,
                channel_name,
                len(content),
                CURRENT_YEAR,
            )
            conn.cursor().execute(
                f"INSERT OR REPLACE INTO messages (message_id, type, timestamp, content, author_id, author_name, author_nickname, author_discriminator, author_avatar_url, attachments, embeds, stickers, reactions, total_reactions, mentions, inline_emojis, channel_id, channel_name, content_length, year) VALUES "
                + f"(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                t,
            )
            if DOWNLOAD_ATTACHMENTS:
                # emojis
                all_emojis = message["inlineEmojis"] + [
                    r["emoji"] for r in message["reactions"]
                ]
                for emoji in all_emojis:
                    is_native_emoji = emoji["id"] == ""
                    emoji_id = emoji["id"] or emoji["name"]
                    if is_native_emoji or emoji_id in seen_emojis:
                        continue
                    seen_emojis.add(emoji_id)
                    filename = emoji["imageUrl"].rsplit("/", 1)[-1]
                    print(f"Writing emoji {emoji_id} {filename}")
                    with open(f"emojis/{filename}", "wb+") as emoji_file:
                        res = requests.get(emoji["imageUrl"])
                        emoji_file.write(res.content)

            # attachments
            for attachment in message["attachments"]:
                if DOWNLOAD_ATTACHMENTS:
                    print(
                        f"Writing attachment {attachment['id']} {attachment['fileName']}"
                    )
                    with open(
                        f"attachments/{attachment['id']}_{attachment['fileName']}",
                        "wb+",
                    ) as attachment_file:
                        res = requests.get(attachment["url"])
                        attachment_file.write(res.content)
                conn.cursor().execute(
                    f"INSERT OR REPLACE INTO attachments (id, related_message_id, file_name, timestamp, extension, year) VALUES (?, ?, ?, ?, ?, ?)",
                    (
                        int(attachment["id"]),
                        message_id,
                        attachment["fileName"],
                        formatted_timestamp,
                        pathlib.Path(attachment["fileName"]).suffix,
                        CURRENT_YEAR,
                    ),
                )
        conn.commit()
        print("Done")
