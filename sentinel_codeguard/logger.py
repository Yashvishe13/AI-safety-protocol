import os
import logging


logging.basicConfig(
    level=os.getenv("SENTINEL_LOG_LEVEL", "INFO"),
    format="%(asctime)s - %(levelname)s - %(message)s"
)

log = logging.getLogger("sentinel.codeguard")


