from collections import defaultdict
from datetime import UTC, datetime
import sqlite3
import os

import orjson

conn = sqlite3.connect("backend/wrapped.db")
CURRENT_YEAR = int(os.environ.get("CURRENT_YEAR", "2025"))

print("Current year:", CURRENT_YEAR)

print("Loading to memory")
all_messages = (
    conn.cursor()
    .execute(
        f"SELECT content, total_reactions, mentions, timestamp FROM messages WHERE year = {CURRENT_YEAR} ORDER BY timestamp ASC"
    )
    .fetchall()
)
count = len(all_messages)
print(f"Loaded all messages ({count})")
word_cache = {}
message_buckets = defaultdict(int)
reaction_buckets = defaultdict(int)
mention_buckets = defaultdict(int)


def get_start_of_day_timestamp(timestamp: int) -> int:
    return int(
        datetime.fromtimestamp(timestamp, tz=UTC)
        .replace(hour=0, minute=0, second=0, microsecond=0)
        .timestamp()
    )


for i, row in enumerate(all_messages):
    if i % 500 == 0:
        print(f"{i + 1}/{count}")

    content, total_reactions, mentions, timestamp = row
    timestamp_bucket = str(get_start_of_day_timestamp(timestamp))
    # process message bucket
    message_buckets[timestamp_bucket] += 1

    # process word buckets
    words = content.replace("\n", " ").split(" ")
    for word in words:
        if word == " " or word == "":
            continue
        word = word.lower()

        if word not in word_cache:
            word_cache[word] = {"total": 0, "buckets": defaultdict(int)}

        word_cache[word]["total"] += 1
        word_cache[word]["buckets"][timestamp_bucket] += 1

    # process reaction buckets
    reaction_buckets[timestamp_bucket] += total_reactions

    # process mention buckets
    parsed_mentions = orjson.loads(mentions)
    mention_buckets[timestamp_bucket] += len(parsed_mentions)

conn.cursor().execute(
    "INSERT OR REPLACE INTO static (key, value, year) VALUES (?, ?, ?)",
    ("message_buckets", orjson.dumps(message_buckets), CURRENT_YEAR),
)

conn.cursor().execute(
    "INSERT OR REPLACE INTO static (key, value, year) VALUES (?, ?, ?)",
    ("reaction_buckets", orjson.dumps(reaction_buckets), CURRENT_YEAR),
)

conn.cursor().execute(
    "INSERT OR REPLACE INTO static (key, value, year) VALUES (?, ?, ?)",
    ("mention_buckets", orjson.dumps(mention_buckets), CURRENT_YEAR),
)

for word in word_cache:
    conn.cursor().execute(
        "INSERT OR REPLACE INTO word_usage (word, data, year) VALUES (?, ?, ?)",
        (word, orjson.dumps(word_cache[word]), CURRENT_YEAR),
    )

conn.commit()
