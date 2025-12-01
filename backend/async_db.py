from datetime import datetime, timezone
import time
from typing import Dict, List, Optional
import aiosqlite
import orjson
from util import get_avatar_url
from consts import (
    ATTACHMENT_URL_BASE,
    EMOJI_URL_BASE,
    EXCLUDED_EXTENSIONS,
    VIDEO_EXT_LIST,
)
from models import (
    AttachmentInfo,
    AttachmentSummary,
    GlobalStats,
    MentionGraphEdge,
    MentionGraphResponse,
    MessageInfo,
    MessageSummary,
    NotableAttachmentSummary,
    NotableMessageSummary,
    TimeMachineScreenshot,
    UserEmojiEntry,
    UserStats,
)
from cache import AsyncTTL

conn = None


async def init():
    global conn
    conn = await aiosqlite.connect("wrapped.db")


async def cleanup():
    if conn and conn.is_alive():
        await conn.close()


async def get_random_attachment(
    year: int,
    excluded_ids: List[str],
    video_only: bool = False,
) -> AttachmentInfo:
    where_clause = f"lower(extension) IN ({', '.join(['?' for _ in VIDEO_EXT_LIST])}) AND id NOT IN ({', '.join(['?' for _ in (excluded_ids)])})"
    default_exclude_clause = f"lower(extension) NOT IN ({', '.join(['?' for _ in EXCLUDED_EXTENSIONS])}) AND id NOT IN ({', '.join(['?' for _ in (excluded_ids)])})"
    if video_only:
        cursor = await conn.execute(
            f"SELECT id, file_name, author_id AS sender_id, author_name AS sender_handle, attachments.timestamp, related_message_id, channel_id, channel_name, content FROM attachments LEFT JOIN messages ON attachments.related_message_id = messages.message_id WHERE id IN (SELECT id FROM attachments WHERE {where_clause} AND year = ? ORDER BY RANDOM() LIMIT 1)",
            [*VIDEO_EXT_LIST, *excluded_ids, year],
        )
    else:
        cursor = await conn.execute(
            f"SELECT id, file_name, author_id AS sender_id, author_name AS sender_handle, attachments.timestamp, related_message_id, channel_id, channel_name, content FROM attachments LEFT JOIN messages ON attachments.related_message_id = messages.message_id WHERE id IN (SELECT id FROM attachments WHERE {default_exclude_clause} AND year = ? ORDER BY RANDOM() LIMIT 1)",
            [*EXCLUDED_EXTENSIONS, *excluded_ids, year],
        )

    row = await cursor.fetchone()
    if not row:
        return None

    attachment_id = int(row[0])
    await cursor.close()

    likes = await get_attachment_likes(attachment_id)

    return AttachmentInfo(
        attachment_id=str(attachment_id),
        file_name=row[1],
        url=ATTACHMENT_URL_BASE.format(year, attachment_id, row[1]),
        sender_id=str(row[2]),
        sender_handle=row[3],
        sender_avatar_url=get_avatar_url(year, row[3]),
        likes=likes,
        timestamp=row[4],
        related_message_id=str(row[5]),
        related_channel_id=str(row[6]),
        related_channel_name=str(row[7]),
        related_message_content=row[8],
    )


async def get_random_message(
    year: int, min_length: int = 1, links_only: bool = False
) -> MessageInfo:
    where_clause = (
        "AND (content LIKE '%http://%' OR content LIKE '%https://%') "
        if links_only
        else ""
    )
    query = f"""
SELECT message_id, content, channel_name, author_id, author_name, timestamp, channel_id 
FROM messages 
WHERE message_id 
IN (SELECT message_id FROM messages WHERE content_length >= ? AND year = ? {where_clause}ORDER BY RANDOM() LIMIT 1)
"""
    async with conn.execute(
        query,
        (min_length, year),
    ) as cursor:
        row = await cursor.fetchone()

    if not row:
        return None

    message_id = int(row[0])
    likes = await get_message_likes(message_id)
    return MessageInfo(
        message_id=str(message_id),
        content=row[1],
        channel_name=row[2],
        sender_id=str(row[3]),
        sender_handle=row[4],
        sender_avatar_url=get_avatar_url(year, row[4]),
        timestamp=row[5],
        likes=likes,
        channel_id=str(row[6]),
    )


async def get_message(year: int, message_id: int) -> MessageInfo:
    async with conn.execute(
        "SELECT message_id, content, channel_name, author_id, author_name, timestamp, channel_id FROM messages WHERE message_id = ? AND year = ?",
        (message_id, year),
    ) as cursor:
        row = await cursor.fetchone()

    if not row:
        return None

    likes = await get_message_likes(message_id)
    return MessageInfo(
        message_id=str(message_id),
        content=row[1],
        channel_name=row[2],
        sender_id=str(row[3]),
        sender_handle=row[4],
        sender_avatar_url=get_avatar_url(year, row[4]),
        timestamp=row[5],
        likes=likes,
        channel_id=str(row[6]),
    )


async def get_attachment(year: int, attachment_id: int) -> Optional[AttachmentInfo]:
    async with conn.execute(
        "SELECT id, file_name, author_id AS sender_id, author_name AS sender_handle, attachments.timestamp, related_message_id, channel_id, channel_name, content FROM attachments LEFT JOIN messages ON attachments.related_message_id = messages.message_id WHERE id = ? AND attachments.year = ?",
        (attachment_id, year),
    ) as cursor:
        row = await cursor.fetchone()

    if not row:
        return None

    likes = await get_attachment_likes(attachment_id)
    return AttachmentInfo(
        attachment_id=str(row[0]),
        file_name=row[1],
        url=ATTACHMENT_URL_BASE.format(year, attachment_id, row[1]),
        sender_id=str(row[2]),
        sender_handle=row[3],
        sender_avatar_url=get_avatar_url(year, row[3]),
        likes=likes,
        timestamp=row[4],
        related_message_id=str(row[5]),
        related_channel_id=str(row[6]),
        related_channel_name=str(row[7]),
        related_message_content=row[8],
    )


async def get_likes_for_user(year: int, discord_id: str) -> Dict[str, List[str]]:
    async with conn.execute(
        f"SELECT attachment_id, file_name, messages.author_name, messages.content, messages.channel_name FROM likes LEFT JOIN attachments ON likes.attachment_id = attachments.id LEFT JOIN messages ON attachments.related_message_id = messages.message_id WHERE discord_id = {int(discord_id)} AND attachments.year = ? ORDER BY likes.timestamp DESC",
        (year,),
    ) as cursor:
        attachment_rows = await cursor.fetchall()

    async with conn.execute(
        f"SELECT messages.message_id, messages.content, messages.author_name, messages.channel_name FROM message_likes LEFT JOIN messages ON message_likes.message_id = messages.message_id WHERE discord_id = {int(discord_id)} AND messages.year = ? ORDER BY message_likes.timestamp DESC",
        (year,),
    ) as cursor:
        message_rows = await cursor.fetchall()
    return {
        "attachments": [
            AttachmentSummary(
                attachment_id=str(row[0]),
                file_name=row[1],
                url=ATTACHMENT_URL_BASE.format(year, row[0], row[1]),
                sender_handle=row[2],
                sender_avatar_url=get_avatar_url(year, row[2]),
                related_message_content=row[3],
                related_channel_name=row[4],
            )
            for row in attachment_rows
        ],
        "messages": [
            MessageSummary(
                message_id=str(row[0]),
                content=row[1],
                sender_handle=row[2],
                sender_avatar_url=get_avatar_url(year, row[2]),
                channel_name=row[3],
            )
            for row in message_rows
        ],
    }


async def get_attachment_likes(attachment_id: int) -> int:
    async with conn.execute(
        f"SELECT COUNT(attachment_id) FROM likes WHERE attachment_id = {attachment_id}"
    ) as cursor:
        like_row = await cursor.fetchone()
        if like_row:
            return like_row[0]
        return 0


async def get_message_likes(message_id: int) -> int:
    async with conn.execute(
        f"SELECT COUNT(message_id) FROM message_likes WHERE message_id = {message_id}"
    ) as cursor:
        like_row = await cursor.fetchone()
        if like_row:
            return like_row[0]
        return 0


async def like(entity_id: int, discord_id: int, is_attachment: bool):
    timestamp = int(time.time())
    query = "INSERT INTO message_likes VALUES (?, ?, ?) ON CONFLICT (message_id, discord_id) DO NOTHING"
    if is_attachment:
        query = "INSERT INTO likes VALUES (?, ?, ?) ON CONFLICT (attachment_id, discord_id) DO NOTHING"
    await conn.execute(query, (entity_id, discord_id, timestamp))
    await conn.commit()


async def unlike(entity_id: int, discord_id: int, is_attachment: bool):
    query = "DELETE FROM message_likes WHERE message_id = ? AND discord_id = ?"
    if is_attachment:
        query = "DELETE FROM likes WHERE attachment_id = ? AND discord_id = ?"
    await conn.execute(query, (entity_id, discord_id))
    await conn.commit()


@AsyncTTL(time_to_live=60, maxsize=None)
async def get_leaderboard(year: int):
    attachment_query = """
SELECT
    ROW_NUMBER() OVER (
        ORDER BY
            like_count DESC
    ) AS rank,
    attachment_id,
    file_name,
    messages.author_name AS sender_handle,
    content,
    channel_name,
    like_count
FROM
    (
        SELECT
            attachment_id,
            COUNT(attachment_id) as like_count
        FROM
            likes
        GROUP BY
            attachment_id
    ) al
    LEFT JOIN attachments ON attachments.id = al.attachment_id
    LEFT JOIN messages ON attachments.related_message_id = messages.message_id WHERE attachments.year = ?;
"""

    message_query = """
SELECT
    ROW_NUMBER() OVER (
        ORDER BY
            like_count DESC
    ) rank,
    messages.message_id,
    content,
    author_name AS sender_handle,
    channel_name,
    like_count
FROM
    (
        SELECT
            message_id,
            COUNT(message_id) as like_count
        FROM
            message_likes
        GROUP BY
            message_id
    ) ml
    LEFT JOIN messages ON messages.message_id = ml.message_id WHERE messages.year = ?;
"""

    async with conn.execute(attachment_query, (year,)) as cursor:
        attachment_rows = await cursor.fetchall()

    if not attachment_rows:
        attachment_rows = []

    attachment_rows.sort(key=lambda row: row[0])

    async with conn.execute(message_query, (year,)) as cursor:
        message_rows = await cursor.fetchall()

    if not message_rows:
        message_rows = []

    message_rows.sort(key=lambda row: row[0])

    return {
        "attachments": [
            AttachmentSummary(
                attachment_id=str(row[1]),
                file_name=row[2],
                url=ATTACHMENT_URL_BASE.format(year, row[1], row[2]),
                sender_handle=row[3],
                sender_avatar_url=get_avatar_url(year, row[3]),
                related_message_content=row[4],
                related_channel_name=row[5],
                likes=row[6],
                rank=row[0],
            )
            for row in attachment_rows
        ],
        "messages": [
            MessageSummary(
                message_id=str(row[1]),
                content=row[2],
                sender_handle=row[3],
                sender_avatar_url=get_avatar_url(year, row[3]),
                channel_name=row[4],
                likes=row[5],
                rank=row[0],
            )
            for row in message_rows
        ],
    }


@AsyncTTL(time_to_live=3600, maxsize=None)
async def get_stats(discord_id: int, year: int):
    query = """
SELECT
    user_nickname,
    mentions_received,
    mentions_given,
    reactions_received,
    reactions_given,
    messages_sent,
    attachments_sent,
    attachments_size,
    most_frequent_time,
    most_mentioned_given_name,
    most_mentioned_received_name,
    most_mentioned_given_count,
    most_mentioned_received_count,
    emoji_data
FROM
    users
WHERE
    user_id = ? AND year = ?;
"""
    async with conn.execute(
        query,
        (discord_id, year),
    ) as cursor:
        row = await cursor.fetchone()

    if not row:
        return None

    raw_emoji_data = row[13]
    emoji_data = orjson.loads(raw_emoji_data) if raw_emoji_data is not None else {}
    favourite_emojis: List[UserEmojiEntry] = []
    for emoji_id in emoji_data:
        entry = emoji_data[emoji_id]
        extension = ".gif" if entry["animated"] else ".png"
        url = (
            EMOJI_URL_BASE.format(year, emoji_id) + extension
            if not entry["native"]
            else None
        )
        favourite_emojis.append(
            UserEmojiEntry(
                emoji_id=emoji_id,
                url=url,
                native=entry["native"],
                animated=entry["animated"],
                inline=entry["inline"],
                reactions=entry["reactions"],
            )
        )
    favourite_emojis.sort(key=lambda x: x.inline + x.reactions, reverse=True)
    return UserStats(
        user_nickname=row[0],
        mentions_received=row[1],
        mentions_given=row[2],
        reactions_received=row[3],
        reactions_given=row[4],
        messages_sent=row[5],
        attachments_sent=row[6],
        attachments_size=row[7],
        most_frequent_time=row[8],
        most_mentioned_given_name=row[9],
        most_mentioned_received_name=row[10],
        most_mentioned_given_avatar_url=get_avatar_url(year, row[9]),
        most_mentioned_received_avatar_url=get_avatar_url(year, row[10]),
        most_mentioned_given_count=row[11],
        most_mentioned_received_count=row[12],
        favourite_emojis=favourite_emojis,
    )


@AsyncTTL(time_to_live=86400, maxsize=None)
async def get_global_stats(year: int):
    query = """
SELECT
    SUM(mentions_received),
    SUM(reactions_received),
    SUM(messages_sent),
    SUM(attachments_sent),
    SUM(attachments_size)
FROM
    users
WHERE year = ?;
"""
    async with conn.execute(
        query,
        (year,),
    ) as cursor:
        row = await cursor.fetchone()

    if not row:
        return None

    (
        total_mentions,
        total_reactions,
        total_messages,
        total_attachments,
        total_attachments_size,
    ) = row

    return GlobalStats(
        total_mentions=total_mentions,
        total_reactions=total_reactions,
        total_messages=total_messages,
        total_attachments=total_attachments,
        total_attachments_size=total_attachments_size,
    )


@AsyncTTL(time_to_live=86400, maxsize=None)
async def get_notable_content(
    year: int, discord_id: int, n: int = 20
) -> List[NotableAttachmentSummary | NotableMessageSummary]:
    query = """
SELECT messages.message_id, messages.content, messages.channel_name, messages.author_name, messages.total_reactions, attachments.id, attachments.file_name 
FROM messages 
LEFT JOIN attachments 
ON messages.message_id = attachments.related_message_id 
WHERE messages.year = ? 
AND messages.author_id = ? 
ORDER BY messages.total_reactions DESC 
LIMIT ?;
"""
    async with conn.execute(
        query,
        (year, discord_id, n),
    ) as cursor:
        rows = await cursor.fetchall()
        results = []
        for row in rows:
            (
                message_id,
                content,
                channel_name,
                author_name,
                total_reactions,
                attachment_id,
                file_name,
            ) = row
            if not attachment_id:
                results.append(
                    NotableMessageSummary(
                        message_id=str(message_id),
                        content=content,
                        sender_handle=author_name,
                        sender_avatar_url=get_avatar_url(year, author_name),
                        channel_name=channel_name,
                        total_reactions=total_reactions,
                    )
                )
            else:
                results.append(
                    NotableAttachmentSummary(
                        attachment_id=str(attachment_id),
                        file_name=file_name,
                        url=ATTACHMENT_URL_BASE.format(year, attachment_id, file_name),
                        sender_handle=author_name,
                        sender_avatar_url=get_avatar_url(year, author_name),
                        related_message_content=content,
                        related_channel_name=channel_name,
                        total_reactions=total_reactions,
                    )
                )

        return results


async def get_time_machine_screenshot(date: datetime, year: int):
    MAX_MESSAGE_COUNT = 5
    MAX_ATTACHMENT_COUNT = 3
    start_time = int(date.replace(tzinfo=timezone.utc).timestamp())
    end_time = start_time + 86400
    async with conn.execute(
        "SELECT id, file_name, author_id AS sender_id, author_name AS sender_handle, attachments.timestamp, related_message_id, channel_id, channel_name, content FROM attachments LEFT JOIN messages ON attachments.related_message_id = messages.message_id WHERE messages.timestamp >= ? AND messages.timestamp <= ? AND attachments.year = ? ORDER BY RANDOM() LIMIT ?",
        (start_time, end_time, year, MAX_ATTACHMENT_COUNT),
    ) as cursor:
        rows = await cursor.fetchall()
        attachments = [
            AttachmentInfo(
                attachment_id=str(row[0]),
                file_name=row[1],
                url=ATTACHMENT_URL_BASE.format(year, row[0], row[1]),
                sender_id=str(row[2]),
                sender_handle=row[3],
                sender_avatar_url=get_avatar_url(year, row[3]),
                likes=0,
                timestamp=row[4],
                related_message_id=str(row[5]),
                related_channel_id=str(row[6]),
                related_channel_name=str(row[7]),
                related_message_content=row[8],
            )
            for row in rows
        ]

    async with conn.execute(
        "SELECT message_id, content, channel_name, author_id, author_name, timestamp, channel_id FROM messages WHERE content_length > 0 AND timestamp >= ? AND timestamp <= ? AND year = ? ORDER BY RANDOM() LIMIT ?",
        (start_time, end_time, year, MAX_MESSAGE_COUNT),
    ) as cursor:
        rows = await cursor.fetchall()

        messages = [
            MessageInfo(
                message_id=str(row[0]),
                content=row[1],
                channel_name=row[2],
                sender_id=str(row[3]),
                sender_handle=row[4],
                sender_avatar_url=get_avatar_url(year, row[4]),
                timestamp=row[5],
                likes=0,
                channel_id=str(row[6]),
            )
            for row in rows
        ]

    return TimeMachineScreenshot(attachments=attachments, messages=messages)


@AsyncTTL(time_to_live=3600, maxsize=None)
async def get_mention_graph(year: int):
    async with conn.execute(
        "SELECT user_name, most_mentioned_given_name, most_mentioned_given_count FROM users WHERE year = ? AND most_mentioned_given_count > 0",
        (year,),
    ) as cursor:
        rows = await cursor.fetchall()
        edges = []
        for row in rows:
            username, mentioned_name, count = row
            edge = MentionGraphEdge(
                from_user=username,
                from_user_avatar_url=get_avatar_url(year, username),
                to_user=mentioned_name,
                to_user_avatar_url=get_avatar_url(year, mentioned_name),
                count=count,
            )
            edges.append(edge)

    return MentionGraphResponse(edges=edges)
