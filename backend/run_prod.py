#!/usr/bin/env python
"""Production server with configurable workers."""

import argparse
import multiprocessing
import uvicorn


def get_optimal_workers(target_users: int) -> int:
    """
    Calculate optimal worker count based on target user count.

    Guidelines:
    - 20-30 users: 4 workers
    - 30-50 users: 6 workers
    - 50-100 users: 8 workers

    Also considers CPU count as upper bound.
    """
    cpu_count = multiprocessing.cpu_count()

    if target_users <= 30:
        recommended = 4
    elif target_users <= 50:
        recommended = 6
    else:
        recommended = 8

    # Don't exceed (2 * cpu_count) + 1 (uvicorn recommendation)
    max_workers = (2 * cpu_count) + 1
    return min(recommended, max_workers)


def main():
    """Run the production server."""
    parser = argparse.ArgumentParser(description="Run SimVex production server")
    parser.add_argument(
        "--workers",
        type=int,
        default=None,
        help="Number of worker processes (default: auto based on --users)",
    )
    parser.add_argument(
        "--users",
        type=int,
        default=30,
        help="Target number of concurrent users (default: 30)",
    )
    parser.add_argument(
        "--host",
        type=str,
        default="0.0.0.0",
        help="Host to bind to (default: 0.0.0.0)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8000,
        help="Port to bind to (default: 8000)",
    )
    parser.add_argument(
        "--log-level",
        type=str,
        default="info",
        choices=["debug", "info", "warning", "error", "critical"],
        help="Log level (default: info)",
    )

    args = parser.parse_args()

    # Determine worker count
    if args.workers is not None:
        workers = args.workers
    else:
        workers = get_optimal_workers(args.users)

    print(f"Starting SimVex production server")
    print(f"  Host: {args.host}")
    print(f"  Port: {args.port}")
    print(f"  Workers: {workers}")
    print(f"  Target users: {args.users}")
    print(f"  Log level: {args.log_level}")

    uvicorn.run(
        "app.main:app",
        host=args.host,
        port=args.port,
        workers=workers,
        log_level=args.log_level,
        access_log=True,
    )


if __name__ == "__main__":
    main()
