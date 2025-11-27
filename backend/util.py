import os
import aiohttp
from fastapi import HTTPException
from consts import (
    AVATAR_URL_BASE,
    CLIENT_ID,
    CLIENT_SECRET,
    DISCORD_API_ENDPOINT,
    REDIRECT_URI,
)

USER_DEBUG_OVERRIDE = (
    int(os.environ["USER_DEBUG_OVERRIDE"])
    if "USER_DEBUG_OVERRIDE" in os.environ
    else None
)

if USER_DEBUG_OVERRIDE:
    print(f"USER_DEBUG_OVERRIDE is set to {USER_DEBUG_OVERRIDE}")


async def verify_token(session: aiohttp.ClientSession, token: str):
    guild_ids = {guild["id"] for guild in await get_guilds(session, token)}
    # check if in sail
    if "169611319501258753" not in guild_ids:
        return False
    return True


async def exchange_code(session: aiohttp.ClientSession, code: str):
    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT_URI,
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    async with session.post(
        f"{DISCORD_API_ENDPOINT}/oauth2/token",
        data=data,
        headers=headers,
        auth=aiohttp.BasicAuth(CLIENT_ID, CLIENT_SECRET),
    ) as r:
        r.raise_for_status()
        return await r.json()


async def get_token_info(session: aiohttp.ClientSession, token: str):
    headers = {"Authorization": f"Bearer {token}"}
    async with session.get(f"{DISCORD_API_ENDPOINT}/oauth2/@me", headers=headers) as r:
        r.raise_for_status()
        return await r.json()


async def get_guilds(session: aiohttp.ClientSession, token: str):
    headers = {"Authorization": f"Bearer {token}"}
    async with session.get(
        f"{DISCORD_API_ENDPOINT}/users/@me/guilds", headers=headers
    ) as r:
        r.raise_for_status()
        return await r.json()


async def revoke_access_token(session: aiohttp.ClientSession, token: str):
    data = {"token": token, "token_type_hint": "access_token"}
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    await session.post(
        f"{DISCORD_API_ENDPOINT}/oauth2/token/revoke",
        data=data,
        headers=headers,
        auth=aiohttp.BasicAuth(CLIENT_ID, CLIENT_SECRET),
    )


async def refresh_token(session: aiohttp.ClientSession, refresh_token: str):
    data = {"grant_type": "refresh_token", "refresh_token": refresh_token}
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    async with session.post(
        f"{DISCORD_API_ENDPOINT}/oauth2/token",
        data=data,
        headers=headers,
        auth=aiohttp.BasicAuth(CLIENT_ID, CLIENT_SECRET),
    ) as r:
        r.raise_for_status()
        return await r.json()


def check_token(token_cache: dict, token: str):
    if token not in token_cache:
        raise HTTPException(
            status_code=401, detail="Token expired or missing. Please login again."
        )


def get_user_from_token(token_cache: dict, token: str) -> int:
    if USER_DEBUG_OVERRIDE:
        return USER_DEBUG_OVERRIDE
    return token_cache[token]


def get_avatar_url(year: int, username: str) -> str:
    if year >= 2025:
        return AVATAR_URL_BASE.format(year, username)

    return get_default_discord_avatar_url(username)


def get_default_discord_avatar_url(username: str) -> str:
    default_avatar_num = int.from_bytes(username.encode()) % 5
    return f"https://cdn.discordapp.com/embed/avatars/{default_avatar_num}.png"
