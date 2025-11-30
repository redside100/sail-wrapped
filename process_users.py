import sqlite3
import orjson
from datetime import datetime
import os

import requests

conn = sqlite3.connect("backend/wrapped.db")
CURRENT_YEAR = int(os.environ.get("CURRENT_YEAR", "2025"))
DOWNLOAD_AVATARS = bool(os.environ.get("DOWNLOAD_AVATARS"))

print("Current year:", CURRENT_YEAR)

all_messages = (
    conn.cursor()
    .execute(
        f"SELECT author_id, author_name, author_nickname, author_avatar_url, content, timestamp, attachments, reactions, mentions, total_reactions, inline_emojis FROM messages WHERE year = {CURRENT_YEAR} ORDER BY timestamp ASC"
    )
    .fetchall()
)
count = len(all_messages)

user_cache = {}

print(f"Loaded all messages ({count})")
print("Loading to memory")


def init_user_if_not_exists(user_id, user_name, user_nickname, avatar_url):
    global user_cache
    if user_id not in user_cache:
        user_cache[user_id] = {
            "messages": 0,
            "name": user_name,
            "nickname": user_nickname,
            "avatar_url": avatar_url,
            "msg_frequency": {},
            "reactions_given": 0,
            "reactions_received": 0,
            "attachments_sent": 0,
            "attachments_size": 0,
            "mentions_given": {},
            "mentions_received": {},
            "emojis": {},
        }


for i, row in enumerate(all_messages):
    if i % 500 == 0:
        print(f"{i + 1}/{count}")

    if not row[0]:
        continue

    user_id = int(row[0])
    user_name = row[1]
    user_nickname = row[2]
    user_avatar_url = row[3]
    content: str = row[4]
    timestamp = row[5]
    attachments = orjson.loads(row[6])
    reactions = orjson.loads(row[7])
    mentions = orjson.loads(row[8])
    total_reactions = row[9]
    inline_emojis = orjson.loads(row[10])

    if user_name == "Deleted User":
        continue

    init_user_if_not_exists(user_id, user_name, user_nickname, user_avatar_url)

    user_cache[user_id]["messages"] += 1

    utc_dt = datetime.utcfromtimestamp(timestamp)
    if utc_dt.hour not in user_cache[user_id]["msg_frequency"]:
        user_cache[user_id]["msg_frequency"][utc_dt.hour] = 1
    else:
        user_cache[user_id]["msg_frequency"][utc_dt.hour] += 1

    user_cache[user_id]["reactions_received"] += total_reactions

    def init_emoji_for_user(emoji_id: str, target_user_id: int):
        if emoji_id not in user_cache[target_user_id]["emojis"]:
            user_cache[target_user_id]["emojis"][emoji_id] = {
                "inline": 0,
                "reactions": 0,
                "native": emoji["id"] == "",
                "animated": emoji["isAnimated"],
            }

    for emoji in inline_emojis:
        is_native_emoji = emoji["id"] == ""
        emoji_id = emoji["id"] or emoji["name"]
        init_emoji_for_user(emoji_id, user_id)

        emoji_code = emoji["name"] if is_native_emoji else f":{emoji["code"]}:"
        inline_count = content.count(emoji_code)
        user_cache[user_id]["emojis"][emoji_id]["inline"] += inline_count

    for reaction in reactions:
        emoji = reaction["emoji"]
        is_native_emoji = emoji["id"] == ""
        emoji_id = emoji["id"] or emoji["name"]

        for user in reaction["users"]:
            if user["isBot"]:
                continue
            reactor_id = int(user["id"])
            reactor_name = user["name"]
            reactor_nickname = user["nickname"]
            reactor_avatar_url = user["avatarUrl"]
            if reactor_name == "Deleted User":
                continue
            init_user_if_not_exists(
                reactor_id, reactor_name, reactor_nickname, reactor_avatar_url
            )
            user_cache[reactor_id]["reactions_given"] += 1

            init_emoji_for_user(emoji_id, reactor_id)
            user_cache[reactor_id]["emojis"][emoji_id]["reactions"] += 1

    for mention in mentions:
        if mention["isBot"]:
            continue

        mentioned_id = int(mention["id"])
        mentioned_name = mention["name"]
        mentioned_nickname = mention["nickname"]
        mentioned_avatar_url = mention["avatarUrl"]
        if mentioned_name == "Deleted User":
            continue
        init_user_if_not_exists(
            mentioned_id, mentioned_name, mentioned_nickname, mentioned_avatar_url
        )

        if mentioned_id not in user_cache[user_id]["mentions_given"]:
            user_cache[user_id]["mentions_given"][mentioned_id] = {
                "name": mentioned_name,
                "nickname": mentioned_nickname,
                "avatar_url": mentioned_avatar_url,
                "count": 1,
            }
        else:
            user_cache[user_id]["mentions_given"][mentioned_id]["count"] += 1

        if user_id not in user_cache[mentioned_id]["mentions_received"]:
            user_cache[mentioned_id]["mentions_received"][user_id] = {
                "name": user_name,
                "nickname": user_nickname,
                "avatar_url": user_avatar_url,
                "count": 1,
            }
        else:
            user_cache[mentioned_id]["mentions_received"][user_id]["count"] += 1

    for attachment in attachments:
        user_cache[user_id]["attachments_sent"] += 1
        user_cache[user_id]["attachments_size"] += attachment["fileSizeBytes"]


print(f"Processing users ({len(user_cache)})")

for user_id in user_cache:
    user = user_cache[user_id]
    user_name = user["name"]
    user_nickname = user["nickname"]
    user_avatar_url = user["avatar_url"]
    mentions_received = user["mentions_received"]
    mentions_given = user["mentions_given"]
    reactions_received = user["reactions_received"]
    reactions_given = user["reactions_given"]
    messages_sent = user["messages"]
    attachments_sent = user["attachments_sent"]
    attachments_size = user["attachments_size"]

    msg_frequency = user["msg_frequency"]

    most_frequent_time = (
        max(msg_frequency, key=lambda x: msg_frequency[x])
        if len(msg_frequency) > 0
        else 0
    )

    mentions_given = user["mentions_given"]
    mentions_given_count = sum([mentions_given[key]["count"] for key in mentions_given])
    most_mentioned_given_id = (
        max(mentions_given, key=lambda x: mentions_given[x]["count"])
        if len(mentions_given) > 0
        else 0
    )
    most_mentioned_given_count = (
        mentions_given[most_mentioned_given_id]["count"]
        if len(mentions_given) > 0
        else 0
    )
    most_mentioned_given_name = (
        mentions_given[most_mentioned_given_id]["name"]
        if len(mentions_given) > 0
        else ""
    )
    mentions_received = user["mentions_received"]
    mentions_received_count = sum(
        [mentions_received[key]["count"] for key in mentions_received]
    )
    most_mentioned_received_id = (
        max(mentions_received, key=lambda x: mentions_received[x]["count"])
        if len(mentions_received) > 0
        else 0
    )
    most_mentioned_received_count = (
        mentions_received[most_mentioned_received_id]["count"]
        if len(mentions_received) > 0
        else 0
    )
    most_mentioned_received_name = (
        mentions_received[most_mentioned_received_id]["name"]
        if len(mentions_received) > 1
        else ""
    )

    emoji_data = orjson.dumps(user["emojis"])

    conn.cursor().execute(
        "INSERT OR REPLACE INTO users (user_id, user_name, user_nickname, user_avatar_url, mentions_received, mentions_given, reactions_received, reactions_given, messages_sent, attachments_sent, attachments_size, most_frequent_time, most_mentioned_given_name, most_mentioned_received_name, most_mentioned_given_id, most_mentioned_received_id, most_mentioned_given_count, most_mentioned_received_count, emoji_data, year) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (
            user_id,
            user_name,
            user_nickname,
            user_avatar_url,
            mentions_received_count,
            mentions_given_count,
            reactions_received,
            reactions_given,
            messages_sent,
            attachments_sent,
            attachments_size,
            most_frequent_time,
            most_mentioned_given_name,
            most_mentioned_received_name,
            most_mentioned_given_id,
            most_mentioned_received_id,
            most_mentioned_given_count,
            most_mentioned_received_count,
            emoji_data,
            CURRENT_YEAR,
        ),
    )

    if DOWNLOAD_AVATARS and user_avatar_url:
        with open(
            f"avatars/{user_name}.png",
            "wb+",
        ) as avatar_file:
            try:
                res = requests.get(user_avatar_url)
                avatar_file.write(res.content)
            except:
                print(f"Failed to download avatar for {user_name}: {user_avatar_url}")
                continue


conn.commit()
