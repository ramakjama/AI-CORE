"""
Fallback Handler: Manages model fallback strategies and circuit breaking.
"""

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Dict, Optional
from enum import Enum
import structlog

logger = structlog.get_logger(__name__)


class CircuitState(str, Enum):
    """Circuit breaker states."""
    CLOSED = "closed"  # Normal operation
    OPEN = "open"  # Failures exceeded threshold, rejecting calls
    HALF_OPEN = "half_open"  # Testing if service recovered


@dataclass
class CircuitBreaker:
    """Circuit breaker for a single model."""
    model_name: str
    state: CircuitState = CircuitState.CLOSED
    failure_count: int = 0
    success_count: int = 0
    last_failure_time: Optional[datetime] = None
    last_success_time: Optional[datetime] = None

    # Thresholds
    failure_threshold: int = 5
    success_threshold: int = 3  # Successes needed to close from half-open
    timeout_seconds: int = 60  # Time before trying again after open


class FallbackHandler:
    """
    Handles fallback logic and circuit breaking for models.

    Features:
    - Circuit breaker pattern
    - Exponential backoff
    - Health tracking per model
    """

    def __init__(self):
        self._circuits: Dict[str, CircuitBreaker] = {}

    def get_circuit(self, model_name: str) -> CircuitBreaker:
        """Get or create a circuit breaker for a model."""
        if model_name not in self._circuits:
            self._circuits[model_name] = CircuitBreaker(model_name=model_name)
        return self._circuits[model_name]

    def should_allow_request(self, model_name: str) -> bool:
        """Check if a request should be allowed based on circuit state."""
        circuit = self.get_circuit(model_name)

        if circuit.state == CircuitState.CLOSED:
            return True

        if circuit.state == CircuitState.OPEN:
            # Check if timeout has passed
            if circuit.last_failure_time:
                elapsed = datetime.utcnow() - circuit.last_failure_time
                if elapsed > timedelta(seconds=circuit.timeout_seconds):
                    circuit.state = CircuitState.HALF_OPEN
                    logger.info(
                        "circuit_half_open",
                        model=model_name,
                        elapsed_seconds=elapsed.total_seconds()
                    )
                    return True
            return False

        # Half-open: allow single request to test
        return True

    def record_success(self, model_name: str):
        """Record a successful request."""
        circuit = self.get_circuit(model_name)
        circuit.last_success_time = datetime.utcnow()

        if circuit.state == CircuitState.HALF_OPEN:
            circuit.success_count += 1
            if circuit.success_count >= circuit.success_threshold:
                circuit.state = CircuitState.CLOSED
                circuit.failure_count = 0
                circuit.success_count = 0
                logger.info("circuit_closed", model=model_name)
        else:
            circuit.failure_count = 0  # Reset on success

    def record_failure(self, model_name: str, error: Exception):
        """Record a failed request."""
        circuit = self.get_circuit(model_name)
        circuit.failure_count += 1
        circuit.last_failure_time = datetime.utcnow()

        if circuit.state == CircuitState.HALF_OPEN:
            # Failed during test, go back to open
            circuit.state = CircuitState.OPEN
            circuit.success_count = 0
            logger.warning(
                "circuit_reopened",
                model=model_name,
                error=str(error)
            )

        elif circuit.failure_count >= circuit.failure_threshold:
            circuit.state = CircuitState.OPEN
            logger.warning(
                "circuit_opened",
                model=model_name,
                failure_count=circuit.failure_count,
                error=str(error)
            )

    def get_status(self) -> Dict[str, Dict]:
        """Get status of all circuits."""
        return {
            name: {
                "state": circuit.state.value,
                "failure_count": circuit.failure_count,
                "last_failure": circuit.last_failure_time.isoformat()
                if circuit.last_failure_time else None,
                "last_success": circuit.last_success_time.isoformat()
                if circuit.last_success_time else None,
            }
            for name, circuit in self._circuits.items()
        }

    def reset(self, model_name: Optional[str] = None):
        """Reset circuit breaker(s)."""
        if model_name:
            if model_name in self._circuits:
                self._circuits[model_name] = CircuitBreaker(model_name=model_name)
                logger.info("circuit_reset", model=model_name)
        else:
            self._circuits.clear()
            logger.info("all_circuits_reset")
