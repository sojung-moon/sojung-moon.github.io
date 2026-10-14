#!/usr/bin/env python3
"""thumbnail 이 비어 있는 글에 TMDB 포스터 주소를 자동으로 채웁니다.

- 대상: _posts/*.md 중 front matter 의 thumbnail 이 없거나 비어 있는 글
- categories 가 '영화'면 영화 검색, 그 외(시리즈 등)는 TV 검색
- 제목(title) → 원제(original_title) 순서로, 연도(year) 기준 ±1년 범위에서 검색
- 이미지를 내려받지 않고 TMDB 이미지 주소만 thumbnail 에 적습니다.
- 직접 thumbnail 을 적어 둔 글은 건드리지 않습니다.

필요한 환경 변수: TMDB_API_KEY (API 키 또는 API Read Access Token)
"""
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

API = os.environ.get("TMDB_API_BASE", "https://api.themoviedb.org/3").rstrip("/")
IMG = os.environ.get("TMDB_IMAGE_BASE", "https://image.tmdb.org/t/p/w500").rstrip("/")
KEY = os.environ.get("TMDB_API_KEY", "").strip()
POSTS = Path(os.environ.get("POSTS_DIR", "_posts"))

auth_failed = False


def get(fm, key):
    """front matter 에서 한 줄짜리 값을 읽습니다. 없으면 None."""
    m = re.search(rf"^{re.escape(key)}:[ \t]*(.*?)[ \t]*$", fm, re.M)
    if not m:
        return None
    v = m.group(1).strip()
    if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
        v = v[1:-1]
    return v


def category(fm):
    c = get(fm, "categories")
    if c:
        return c.strip("[] ").split(",")[0].strip(" \"'")
    m = re.search(r"^categories:[ \t]*\r?\n[ \t]*-[ \t]*(.+)$", fm, re.M)
    return m.group(1).strip(" \"'") if m else ""


def call(path, params):
    """TMDB 호출. 실패하면 None (키는 로그에 남기지 않습니다)."""
    global auth_failed
    query = dict(params)
    headers = {"Accept": "application/json"}
    if KEY.startswith("eyJ"):
        headers["Authorization"] = "Bearer " + KEY
    else:
        query["api_key"] = KEY
    url = API + path + "?" + urllib.parse.urlencode(query)
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=20) as res:
                return json.load(res)
        except urllib.error.HTTPError as e:
            if e.code == 401:
                auth_failed = True
                print("    TMDB 인증 실패(401): TMDB_API_KEY 값을 확인하세요.")
                return None
            if e.code == 429 and attempt < 2:
                time.sleep(2 * (attempt + 1))
                continue
            print(f"    TMDB 응답 오류 {e.code} ({path})")
            return None
        except (urllib.error.URLError, TimeoutError, ValueError) as e:
            print(f"    TMDB 연결 실패 ({path}): {type(e).__name__}")
            return None
    return None


def find_poster(kind, titles, year):
    path = "/search/movie" if kind == "movie" else "/search/tv"
    year_key = "year" if kind == "movie" else "first_air_date_year"
    years = [year, year - 1, year + 1] if year else [None]
    for title in titles:
        for y in years:
            params = {"query": title, "language": "ko-KR", "include_adult": "false"}
            if y:
                params[year_key] = str(y)
            data = call(path, params)
            if auth_failed:
                return None
            for item in (data or {}).get("results", []):
                if item.get("poster_path"):
                    return IMG + item["poster_path"]
    return None


def set_thumbnail(fm, url):
    line = f"thumbnail: {url}"
    if re.search(r"^thumbnail:.*$", fm, re.M):
        return re.sub(r"^thumbnail:.*$", lambda m: line, fm, count=1, flags=re.M)
    if re.search(r"^title:.*$", fm, re.M):
        return re.sub(r"^(title:.*)$", lambda m: m.group(1) + "\n" + line, fm, count=1, flags=re.M)
    return fm + "\n" + line


def main():
    if not KEY:
        print("TMDB_API_KEY 가 설정되어 있지 않아 건너뜁니다.")
        return 0
    filled = missed = 0
    for path in sorted(POSTS.glob("*.md")):
        text = path.read_text(encoding="utf-8")
        m = re.match(r"^(---\r?\n)(.*?)(\r?\n---)(.*)$", text, re.S)
        if not m:
            continue
        fm = m.group(2)
        if get(fm, "thumbnail"):
            continue

        title = get(fm, "title") or ""
        original = get(fm, "original_title") or ""
        titles = [t for i, t in enumerate([title, original]) if t and t not in [title, original][:i]]
        ym = re.search(r"\d{4}", get(fm, "year") or "")
        year = int(ym.group(0)) if ym else None
        kind = "movie" if category(fm) == "영화" else "tv"

        print(f"- {path.name}: '{title}' ({year or '연도 없음'}, {kind}) 검색")
        if not titles:
            print("    제목이 없어 건너뜁니다.")
            continue
        url = find_poster(kind, titles, year)
        if auth_failed:
            return 1
        if not url:
            missed += 1
            print("    포스터를 찾지 못했습니다. (제목·연도를 확인하거나 thumbnail 을 직접 지정하세요)")
            continue
        new_fm = set_thumbnail(fm, url)
        path.write_text(m.group(1) + new_fm + m.group(3) + m.group(4), encoding="utf-8")
        filled += 1
        print(f"    채움: {url}")

    print(f"완료: {filled}개 채움, {missed}개 못 찾음")
    return 0


if __name__ == "__main__":
    sys.exit(main())
