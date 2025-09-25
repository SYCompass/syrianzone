import asyncio
import aiohttp
import json
import uvloop
import os
import pytz
import sys
import re

from datetime import datetime

# Fetching 500 users now, can be 1000
PAGES = 5
PER_PAGE = 100
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN")

if GITHUB_TOKEN is None:
    print("GITHUB_TOKEN env required.")
    sys.exit(1)

HEADERS = {
    "Accept": "application/vnd.github+json",
    "Authorization": f"Bearer {GITHUB_TOKEN}",
}


def analyze_contributions(data):
    syria_tz = pytz.timezone("Asia/Damascus")
    now = datetime.now(syria_tz)
    total_day = total_month = total_year = total_all_time = 0

    for entry in data.get("contributions", []):
        try:
            date = datetime.strptime(entry["date"], "%Y-%m-%d")
        except Exception:
            continue
        count = entry["count"]
        total_all_time += count

        if date.year == now.year:
            total_year += count
            if date.month == now.month:
                total_month += count
                if date.day == now.day:
                    total_day += count

    return total_day, total_month, total_year, total_all_time


async def get_with_retries(session, url, headers=None, max_retries=3, delay=1):
    for _ in range(max_retries):
        try:
            async with session.get(url, headers=headers) as res:
                if res.status == 200:
                    return await res.json()
                else:
                    print(f"[!] Error {res.status} for {url}")
        except Exception as e:
            print(f"[!] Exception on {url}: {e}")
        await asyncio.sleep(delay)
    return None


async def get_users_in_syria(session, page, semaphore):
    url = f"https://api.github.com/search/users?q=location:Syria&type=Users&per_page={PER_PAGE}&page={page}"
    async with semaphore:
        data = await get_with_retries(session, url, headers=HEADERS)
        if not data:
            return []
        users_only = [
            item for item in data.get("items", []) if item.get("type") == "User"
        ]
        return users_only


async def get_contributions(session, username, semaphore):
    url = f"https://github-contributions-api.jogruber.de/v4/{username}"
    async with semaphore:
        data = await get_with_retries(session, url)
        if not data:
            return 0, 0, 0, 0
        return analyze_contributions(data)


def filtering_automated_commits(user_id: str, total_commits: int):
    automated_commits_users = {"30838534": 23933}
    return (
        total_commits - automated_commits_users[user_id]
        if user_id in automated_commits_users
        else total_commits
    )


async def fetch_user_data(session, username, avatar_url, semaphore):
    print(f"🔍 Processing {username}...")
    daily, monthly, yearly, lifetime = await get_contributions(
        session, username, semaphore
    )
    return {
        "username": username,
        "daily_contributions": daily,
        "monthly_contributions": monthly,
        "yearly_contributions": yearly,
        "total_contributions": filtering_automated_commits(
            re.search(r"/u/(\d+)(?=[/?]|$)", avatar_url).group(1), lifetime
        ),
        "avatar_url": avatar_url,
    }


async def update_loop():
    semaphore = asyncio.Semaphore(5)

    async with aiohttp.ClientSession() as session:
        while True:
            all_users = []
            print("⏳ Fetching users...")

            tasks = [
                get_users_in_syria(session, page, semaphore)
                for page in range(1, PAGES + 1)
            ]
            pages = await asyncio.gather(*tasks)

            for page in pages:
                all_users.extend(page or [])

            print(f"✅ Got {len(all_users)} users.")

            tasks = [
                fetch_user_data(
                    session, user["login"], user.get("avatar_url"), semaphore
                )
                for user in all_users
            ]

            results = await asyncio.gather(*tasks)
            results = [r for r in results if r]  # remove None

            # Keep backup
            if os.path.exists("./public/contributors.json"):
                os.rename(
                    "./public/contributors.json", "./public/contributors_backup.json"
                )

            with open("./public/contributors.json", "w", encoding="utf-8") as f:
                json.dump(results, f, ensure_ascii=False, indent=2)

            print("✅ Data written to file. Waiting 2 hours...")
            await asyncio.sleep(7200)


if __name__ == "__main__":
    uvloop.install()
    asyncio.run(update_loop())
