from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from src.blueprints.api_response import error_response


@dataclass(frozen=True)
class ServiceResult:
    payload: Any = None
    error_message: str | None = None
    status_code: int = 200

    @property
    def is_error(self) -> bool:
        return self.error_message is not None

    def to_response(self):
        if self.is_error:
            return error_response(self.error_message, self.status_code)
        return self.payload, self.status_code


def service_ok(payload: Any, status_code: int = 200) -> ServiceResult:
    return ServiceResult(payload=payload, status_code=status_code)


def service_error(message: str, status_code: int) -> ServiceResult:
    return ServiceResult(error_message=message, status_code=status_code)


def ensure_service_result(value) -> ServiceResult:
    if isinstance(value, ServiceResult):
        return value
    if isinstance(value, tuple) and len(value) == 3:
        payload, error_message, status_code = value
        if error_message is not None:
            return service_error(error_message, status_code or 500)
        return service_ok(payload, status_code or 200)
    return service_ok(value)
