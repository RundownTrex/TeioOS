import logging
import logging.config
import json
from datetime import datetime, timezone
from app.core.config import settings

class JSONFormatter(logging.Formatter):
    """
    Lightweight standard library JSON Formatter.
    Outputs structured JSON logs for production aggregators.
    """
    def format(self, record: logging.LogRecord) -> str:
        log_obj = {
            "timestamp": datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)
            
        return json.dumps(log_obj)

def setup_logging() -> None:
    """
    Configures the application's logging hierarchy.
    Uses human-readable text in Debug mode, and structured JSON in Production.
    """
    debug = settings.debug
    
    # Choose formatter based on environment
    formatter = "standard" if debug else "json"
    level = "DEBUG" if debug else "INFO"

    logging_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "standard": {
                "format": "%(asctime)s [%(levelname)s] [%(name)s] - %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S",
            },
            "json": {
                "()": JSONFormatter,
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": formatter,
                "stream": "ext://sys.stdout",
            },
        },
        "loggers": {
            "teioos.api": {"level": level, "handlers": ["console"], "propagate": False},
            "teioos.services": {"level": level, "handlers": ["console"], "propagate": False},
            "teioos.repositories": {"level": level, "handlers": ["console"], "propagate": False},
            "teioos.auth": {"level": level, "handlers": ["console"], "propagate": False},
            "teioos.errors": {"level": "WARNING", "handlers": ["console"], "propagate": False},
            
            # Root logger fallback
            "": {"level": "WARNING", "handlers": ["console"]},
        },
    }

    logging.config.dictConfig(logging_config)
