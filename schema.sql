BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "attachments" (
	"id"	INTEGER,
	"related_message_id"	INTEGER,
	"file_name"	TEXT,
	"timestamp"	INTEGER,
	"extension"	TEXT,
	"year" INTEGER,
);
CREATE TABLE IF NOT EXISTS "likes" (
	"attachment_id"	INTEGER,
	"discord_id"	INTEGER,
	"timestamp"	INTEGER,
);
CREATE TABLE IF NOT EXISTS "message_likes" (
	"message_id"	INTEGER,
	"discord_id"	INTEGER,
	"timestamp"	INTEGER
);
CREATE TABLE IF NOT EXISTS "messages" (
	"message_id"	INTEGER,
	"type"	TEXT,
	"timestamp"	INTEGER,
	"content"	TEXT,
	"author_id"	INTEGER,
	"author_name"	TEXT,
	"author_nickname"	TEXT,
	"author_discriminator"	TEXT,
	"author_avatar_url"	TEXT,
	"attachments"	BLOB,
	"embeds"	BLOB,
	"stickers"	BLOB,
	"reactions"	BLOB,
	"total_reactions"	INTEGER,
	"mentions"	BLOB,
	"inline_emojis" BLOB,
	"channel_id"	INTEGER,
	"channel_name"	TEXT,
	"content_length"	INTEGER,
	"year" INTEGER,
	PRIMARY KEY("message_id")
);
CREATE TABLE IF NOT EXISTS "users" (
	"user_id"	INTEGER,
	"user_name"	TEXT,
	"user_nickname"	TEXT,
	"user_avatar_url"	TEXT,
	"mentions_received"	INTEGER,
	"mentions_given"	INTEGER,
	"reactions_received"	INTEGER,
	"reactions_given"	INTEGER,
	"messages_sent"	INTEGER,
	"attachments_sent"	INTEGER,
	"attachments_size"	INTEGER,
	"most_frequent_time"	INTEGER,
	"most_mentioned_given_name"	TEXT,
	"most_mentioned_received_name"	TEXT,
	"most_mentioned_given_id"	INTEGER,
	"most_mentioned_received_id"	INTEGER,
	"most_mentioned_given_count"	INTEGER,
	"most_mentioned_received_count"	INTEGER,
	"emoji_data" BLOB,
	"year" INTEGER,
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_attachment_id_discord_id" ON "likes" (
	"attachment_id",
	"discord_id"
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_attachments_id" ON "attachments" (
	"id"
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_message_id_discord_id" ON "message_likes" (
	"message_id",
	"discord_id"
);
CREATE INDEX IF NOT EXISTS "idx_messages_content" ON "messages" (
	"content"
);
CREATE INDEX IF NOT EXISTS "idx_messages_total_reactions" ON "messages" (
	"total_reactions"
);
CREATE INDEX IF NOT EXISTS "idx_messages_year" ON "messages" (
	"year"
)
COMMIT;
