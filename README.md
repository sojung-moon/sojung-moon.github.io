# Midnight Reel

영화·드라마·애니메이션 감상 기록용 GitHub Pages(Jekyll) 블로그입니다.
파란색 계열의 라이트/다크 테마, 포스터 그리드, 카테고리, 아카이브, 통계, 검색이 들어 있습니다.

## 1. 내 정보로 바꾸기

`_config.yml` 맨 위쪽만 고치면 됩니다.

| 항목 | 설명 |
|---|---|
| `title`, `handle`, `tagline` | 상단 프로필 카드에 나오는 이름 / 아이디 / 한 줄 문구 |
| `url`, `baseurl` | 배포 주소 (아래 3번 참고) |
| `links` | 사이드바 External Links (GitHub, 이메일 등) |
| `menu` | 상단 Menu 버튼과 사이드바 Menu 항목 |
| `paginate` | 메인 화면에 한 페이지당 보여줄 글 수 (기본 12) |

아바타는 `assets/img/avatar.svg`를 같은 이름의 이미지(`avatar.png`)로 바꾼 뒤 `_includes/profile.html`의 경로를 맞춰 주세요.

## 2. 로컬에서 미리보기

Ruby가 설치되어 있어야 합니다.

```bash
bundle install
bundle exec jekyll serve
```

브라우저에서 http://localhost:4000 을 열면 됩니다.

## 3. GitHub Pages로 배포

1. GitHub에서 `<유저명>.github.io` 이름의 저장소를 만듭니다. (이 경우 `baseurl`은 `""` 그대로)
   다른 이름의 저장소를 쓰면 `baseurl: "/저장소이름"`으로 바꿔야 합니다.
2. 이 폴더의 내용을 저장소에 push 합니다.
3. 저장소 **Settings → Pages**에서 Source를 `Deploy from a branch`, Branch를 `main` / `(root)`로 지정합니다.
4. 1~2분 뒤 `https://<유저명>.github.io`에서 확인합니다.

`_config.yml`의 `url`도 본인 주소로 바꿔 주세요.

## 4. 글 쓰는 법

1. `_templates/post-template.md`를 `_posts/`로 복사하고 파일명을 `YYYY-MM-DD-영문-제목.md`로 바꿉니다.
2. 맨 위 front matter를 채웁니다.
3. 포스터 이미지를 `assets/posters/`에 넣고 `thumbnail`에 경로를 적습니다.
4. 본문에 감상을 쓰고, 스포일러는 `<details>`로 접습니다.

| 필드 | 값 |
|---|---|
| `categories` | `영화` / `드라마` / `애니메이션` |
| `rating` | 0.5 단위, 5점 만점 (예: `4.5`) |
| `status` | `완료` / `시청중` / `하차` (완료가 아니면 포스터에 배지 표시) |
| `episodes`, `progress` | 드라마·애니메이션 전체 화수 / 현재까지 본 화수 |
| `rewatch` | 다시 본 작품이면 `true` |

`assets/posters/`의 샘플 SVG와 `_posts/`의 샘플 글 3개는 확인용이니 지우고 시작하세요.

## 5. 카테고리 추가·변경

1. `_data/categories.yml`에 `name`, `slug`, `icon`을 추가합니다.
2. `category/` 폴더에 기존 파일(`movie.md`)을 복사해서 `category_name`, `category_slug`, `permalink`를 바꿉니다.
3. 글의 `categories` 값을 `name`과 똑같이 적습니다.

사용할 수 있는 아이콘: `film`, `tv`, `spark`, `home`, `archive`, `chart`, `list`, `search`, `github`, `mail`, `link`. 새 아이콘은 `_includes/icon.html`에 추가하면 됩니다.

## 6. 색상 바꾸기

`assets/css/style.css` 맨 위의 `:root`(라이트)와 `[data-theme="dark"]`(다크) 변수를 수정하세요.
메인 포인트 색은 `--accent`, 사이드바 색은 `--side`입니다.

## 7. 알아둘 점

- 포스터 이미지는 작품의 저작권자에게 권리가 있습니다. 개인 기록용으로 작은 크기(가로 400~600px)만 쓰고, 공개 블로그라면 출처 표기를 권장합니다.
- 포스터 정보를 자동으로 채우고 싶다면 [TMDB API](https://www.themoviedb.org/)를 쓸 수 있고, 이 경우 TMDB 출처 표기가 필요합니다.
- 검색은 빌드 때 만들어지는 `search.json`을 브라우저에서 읽어 동작합니다. 제목, 원제, 카테고리, 태그가 대상입니다.
- 글이 매우 많아지면(수백 개) 아카이브와 통계 페이지가 느려질 수 있습니다.
