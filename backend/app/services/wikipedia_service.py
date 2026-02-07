"""Wikipedia article fetching service for knowledge base ingestion."""

import logging
import re

import httpx

logger = logging.getLogger(__name__)


class WikipediaService:
    """Fetches and cleans Wikipedia articles for knowledge ingestion."""

    # machinery_id → {ko: [article titles], en: [article titles]}
    WIKIPEDIA_TOPICS: dict[str, dict[str, list[str]]] = {
        "V4_Engine": {
            "ko": ["V형 엔진", "4행정 기관", "내연기관"],
            "en": ["V engine", "Four-stroke engine", "Internal combustion engine"],
        },
        "Drone": {
            "ko": ["쿼드콥터", "무인항공기"],
            "en": ["Quadcopter", "Unmanned aerial vehicle"],
        },
        "Suspension": {
            "ko": ["현가장치"],
            "en": ["Car suspension"],
        },
        "Leaf Spring": {
            "ko": ["판스프링"],
            "en": ["Leaf spring"],
        },
        "Machine Vice": {
            "ko": ["바이스 (공구)"],
            "en": ["Vise (tool)"],
        },
        "Robot Arm": {
            "ko": ["산업용 로봇", "로봇팔"],
            "en": ["Industrial robot", "Robotic arm"],
        },
        "Robot Gripper": {
            "ko": ["로봇 그리퍼"],
            "en": ["Robot end effector"],
        },
    }

    API_URL_TEMPLATE = "https://{lang}.wikipedia.org/w/api.php"
    TIMEOUT = 15.0
    HEADERS = {"User-Agent": "SimVex/1.0 (educational machinery learning app; https://github.com/doric9/simvex_3Dviewer)"}

    async def fetch_article(self, title: str, lang: str = "ko") -> str | None:
        """
        Fetch a Wikipedia article as plain text using the MediaWiki API.

        Args:
            title: The article title
            lang: Language code ("ko" or "en")

        Returns:
            Plain text content or None if not found
        """
        url = self.API_URL_TEMPLATE.format(lang=lang)
        params = {
            "action": "query",
            "titles": title,
            "prop": "extracts",
            "explaintext": "true",
            "format": "json",
        }

        try:
            async with httpx.AsyncClient(timeout=self.TIMEOUT, headers=self.HEADERS) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()

            pages = data.get("query", {}).get("pages", {})
            for page_id, page in pages.items():
                if page_id == "-1":
                    logger.warning(f"Wikipedia article not found: {title} ({lang})")
                    return None
                return page.get("extract", "")

        except Exception as e:
            logger.error(f"Failed to fetch Wikipedia article '{title}' ({lang}): {e}")
            return None

    async def fetch_all_articles(self) -> list[dict]:
        """
        Fetch all configured Wikipedia articles for all machinery.

        Returns:
            List of dicts: [{title, content, lang, machinery_id}, ...]
        """
        results = []

        async with httpx.AsyncClient(timeout=self.TIMEOUT, headers=self.HEADERS) as client:
            for machinery_id, langs in self.WIKIPEDIA_TOPICS.items():
                for lang, titles in langs.items():
                    for title in titles:
                        url = self.API_URL_TEMPLATE.format(lang=lang)
                        params = {
                            "action": "query",
                            "titles": title,
                            "prop": "extracts",
                            "explaintext": "true",
                            "format": "json",
                        }
                        try:
                            response = await client.get(url, params=params)
                            response.raise_for_status()
                            data = response.json()

                            pages = data.get("query", {}).get("pages", {})
                            for page_id, page in pages.items():
                                if page_id == "-1":
                                    logger.warning(f"Wikipedia article not found: {title} ({lang})")
                                    continue
                                content = page.get("extract", "")
                                if content:
                                    cleaned = self.clean_content(content)
                                    if cleaned:
                                        results.append({
                                            "title": title,
                                            "content": cleaned,
                                            "lang": lang,
                                            "machinery_id": machinery_id,
                                        })
                                        logger.info(f"Fetched: {title} ({lang}) - {len(cleaned)} chars")

                        except Exception as e:
                            logger.error(f"Failed to fetch '{title}' ({lang}): {e}")
                            continue

        logger.info(f"Fetched {len(results)} Wikipedia articles total")
        return results

    @staticmethod
    def clean_content(text: str) -> str:
        """Remove references, see-also, external links sections."""
        # Remove common section headers and everything after
        cut_sections = [
            r"\n== 같이 보기 ==.*",
            r"\n== 각주 ==.*",
            r"\n== 외부 링크 ==.*",
            r"\n== 참고 문헌 ==.*",
            r"\n== See also ==.*",
            r"\n== References ==.*",
            r"\n== External links ==.*",
            r"\n== Further reading ==.*",
            r"\n== Bibliography ==.*",
        ]
        for pattern in cut_sections:
            text = re.split(pattern, text, flags=re.DOTALL)[0]

        # Remove citation markers like [1], [2], etc.
        text = re.sub(r"\[\d+\]", "", text)

        # Collapse multiple newlines
        text = re.sub(r"\n{3,}", "\n\n", text)

        return text.strip()
