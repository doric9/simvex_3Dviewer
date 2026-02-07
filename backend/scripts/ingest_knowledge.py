"""CLI script for managing knowledge base ingestion.

Usage:
    python -m scripts.ingest_knowledge --all          # Ingest everything (built-in + Wikipedia)
    python -m scripts.ingest_knowledge --machinery    # Only machinery data
    python -m scripts.ingest_knowledge --quiz         # Only quiz knowledge
    python -m scripts.ingest_knowledge --wikipedia    # Only Wikipedia articles
    python -m scripts.ingest_knowledge --pdf PATH     # Ingest a PDF file
    python -m scripts.ingest_knowledge --stats        # Show stats
"""

import argparse
import asyncio
import logging
import sys

from app.models.database import async_session
from app.services.ingestion_service import IngestionService

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)


async def run_ingestion(args: argparse.Namespace) -> None:
    async with async_session() as db:
        service = IngestionService(db)

        if args.stats:
            stats = await service.get_stats()
            print("\n=== Knowledge Base Statistics ===")
            print(f"Total chunks: {stats['total_chunks']}")
            print("\nBy source type:")
            for src, count in sorted(stats["by_source_type"].items()):
                print(f"  {src}: {count}")
            print("\nBy machinery:")
            for mid, count in sorted(stats["by_machinery"].items()):
                print(f"  {mid}: {count}")
            print()
            return

        total = 0

        if args.all or args.machinery:
            logger.info("Ingesting machinery data...")
            count = await service.ingest_machinery_data()
            logger.info(f"  -> {count} chunks")
            total += count

        if args.all or args.quiz:
            logger.info("Ingesting quiz knowledge...")
            count = await service.ingest_quiz_knowledge()
            logger.info(f"  -> {count} chunks")
            total += count

        if args.all or args.wikipedia:
            logger.info("Ingesting Wikipedia articles (this may take a moment)...")
            count = await service.ingest_wikipedia()
            logger.info(f"  -> {count} chunks")
            total += count

        if args.pdf:
            logger.info(f"Ingesting PDF: {args.pdf}")
            source_name = args.pdf.split("/")[-1]
            count = await service.ingest_pdf(
                file_path=args.pdf,
                source_name=source_name,
                machinery_id=args.machinery_id,
            )
            logger.info(f"  -> {count} chunks")
            total += count

        if total > 0:
            logger.info(f"\nTotal ingested: {total} chunks")
            # Print stats after ingestion
            stats = await service.get_stats()
            print(f"\nKnowledge base now has {stats['total_chunks']} total chunks")
        elif not args.stats:
            print("No ingestion flags specified. Use --help for usage.")


def main():
    parser = argparse.ArgumentParser(description="SimVex Knowledge Base Ingestion")
    parser.add_argument("--all", action="store_true", help="Ingest everything")
    parser.add_argument("--machinery", action="store_true", help="Ingest machinery data")
    parser.add_argument("--quiz", action="store_true", help="Ingest quiz knowledge")
    parser.add_argument("--wikipedia", action="store_true", help="Ingest Wikipedia articles")
    parser.add_argument("--pdf", type=str, help="Path to PDF file to ingest")
    parser.add_argument("--machinery-id", type=str, help="Machinery ID for PDF association")
    parser.add_argument("--stats", action="store_true", help="Show knowledge base statistics")

    args = parser.parse_args()
    asyncio.run(run_ingestion(args))


if __name__ == "__main__":
    main()
