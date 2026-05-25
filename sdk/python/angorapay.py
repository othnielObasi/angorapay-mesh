from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Optional
from urllib.parse import urlencode

import requests

__version__ = "0.1.0"


@dataclass
class AngoraPay:
    base_url: str
    api_key: Optional[str] = None
    timeout: int = 30

    def _headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    def _request(self, method: str, path: str, **kwargs: Any) -> Dict[str, Any]:
        response = requests.request(
            method,
            f"{self.base_url.rstrip('/')}{path}",
            headers=self._headers(),
            timeout=self.timeout,
            **kwargs,
        )
        try:
            payload = response.json()
        except Exception:
            payload = {"raw": response.text}
        if response.status_code >= 400:
            raise RuntimeError(payload.get("error") or f"Angora request failed with {response.status_code}")
        return payload

    def create_mission(self, **payload: Any) -> Dict[str, Any]:
        return self._request("POST", "/v1/angora/missions", json=payload)

    def discover_market_services(self, **params: Any) -> Dict[str, Any]:
        return self._request("GET", f"/v1/angora/services/search?{urlencode(params)}")

    def simulate_route(self, mission_id: Optional[str] = None, max_price: str = "0.01") -> Dict[str, Any]:
        params = {"max_price": max_price}
        if mission_id:
            params["mission_id"] = mission_id
        return self._request("GET", f"/v1/angora/route/simulate?{urlencode(params)}")

    def call_market_service(self, **payload: Any) -> Dict[str, Any]:
        return self._request("POST", "/v1/angora/gateway/call", json=payload)

    def run_demo_market_mission(self, payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        return self._request("POST", "/v1/angora/demo/market-mission", json={"payload": payload or {}})

    def record_user(self, **payload: Any) -> Dict[str, Any]:
        return self._request("POST", "/v1/angora/traction/users", json=payload)

    def record_feedback(self, **payload: Any) -> Dict[str, Any]:
        return self._request("POST", "/v1/angora/traction/feedback", json=payload)

    def execution_history(self, **params: Any) -> Dict[str, Any]:
        return self._request("GET", f"/v1/angora/execution-history?{urlencode(params)}")

    def submission_metrics(self) -> Dict[str, Any]:
        return self._request("GET", "/v1/angora/submission/metrics")

    def production_readiness(self) -> Dict[str, Any]:
        return self._request("GET", "/v1/angora/production/readiness")

    def receipts(self, **params: Any) -> Dict[str, Any]:
        return self._request("GET", f"/v1/angora/receipts?{urlencode(params)}")

    def run_agent_mission(self, **payload: Any) -> Dict[str, Any]:
        return self._request("POST", "/v1/angora/agent-missions/run", json=payload)

    def conversations(self, **params: Any) -> Dict[str, Any]:
        return self._request("GET", f"/v1/angora/conversations?{urlencode(params)}")

    def conversation(self, conversation_id: str) -> Dict[str, Any]:
        return self._request("GET", f"/v1/angora/conversations/{conversation_id}")

    def agent_traces(self, **params: Any) -> Dict[str, Any]:
        return self._request("GET", f"/v1/angora/agent-traces?{urlencode(params)}")

    def run_reconciliation(self, **payload: Any) -> Dict[str, Any]:
        return self._request("POST", "/v1/angora/reconciliation/run", json=payload)

    def reconciliation_runs(self, **params: Any) -> Dict[str, Any]:
        return self._request("GET", f"/v1/angora/reconciliation/runs?{urlencode(params)}")

    def payment_intents(self, **params: Any) -> Dict[str, Any]:
        return self._request("GET", f"/v1/angora/payment-intents?{urlencode(params)}")
