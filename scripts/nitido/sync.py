"""One-shot, outbound-only qualification importer. Disabled unless --apply is passed."""
from __future__ import annotations

import argparse
from contextlib import contextmanager
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import unicodedata
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, ProxyHandler, Request, build_opener
from uuid import NAMESPACE_URL, UUID, uuid4, uuid5


class SyncError(Exception):
    """Only sanitized, machine-readable codes escape the adapter."""


class ApiError(SyncError):
    def __init__(self, status: int, details: dict | None = None):
        super().__init__(f"http_{status}")
        self.status = status
        self.details = details or {}


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def origin(value: str, *, local: bool = False) -> str:
    parsed = urlsplit(value)
    valid_host = parsed.hostname in ("localhost", "127.0.0.1") if local else bool(parsed.hostname)
    if (parsed.scheme != ("http" if local else "https") or not valid_host
            or parsed.username or parsed.password or parsed.path not in ("", "/")
            or parsed.query or parsed.fragment):
        raise SyncError("invalid_crm_origin" if local else "invalid_site_origin")
    return value.rstrip("/")


class JsonApi:
    def __init__(self, base: str, *, local: bool = False, key: str | None = None):
        self.base = origin(base, local=local)
        self.local = local
        self.key = key
        self.token: str | None = None
        self.opener = build_opener(ProxyHandler({}), NoRedirect())

    def request(self, path: str, data: dict | None = None):
        headers = {"Accept": "application/json"}
        if self.key:
            headers["Authorization"] = f"Bearer {self.key}"
        if self.local and data is not None:
            if not self.token:
                self.state()
            headers["X-CRM-Token"] = self.token
        body = None
        if data is not None:
            headers["Content-Type"] = "application/json"
            body = json.dumps(data, ensure_ascii=False, allow_nan=False).encode()
        try:
            with self.opener.open(Request(self.base + path, body, headers), timeout=20) as response:
                raw = response.read(8_000_001)
                if len(raw) > 8_000_000:
                    raise SyncError("response_too_large")
                return json.loads(raw)
        except HTTPError as error:
            try:
                payload = json.loads(error.read(100_000))
                details = payload.get("details", {})
            except (ValueError, AttributeError):
                details = {}
            raise ApiError(error.code, details) from None
        except (URLError, TimeoutError, ConnectionError, OSError):
            raise SyncError("transport_unavailable_or_uncertain") from None
        except (ValueError, UnicodeError):
            raise SyncError("invalid_json_response") from None

    def state(self) -> dict:
        result = self.request("/api/state")
        self.token = result.pop("token", None)
        if not self.token or type(result.get("revision")) is not int:
            raise SyncError("unsupported_crm_state")
        return result


def canonical_uuid(value: str) -> str:
    try:
        result = str(UUID(value))
    except (ValueError, TypeError, AttributeError):
        raise SyncError("invalid_uuid") from None
    if result != value:
        raise SyncError("invalid_uuid")
    return result


def fingerprint(value: dict) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False,
                                     separators=(",", ":"), allow_nan=False).encode()).hexdigest()


def atomic_save(path: Path, value: dict) -> None:
    temporary = path.with_suffix(".tmp")
    with temporary.open("w", encoding="utf-8") as handle:
        json.dump(value, handle, ensure_ascii=False, allow_nan=False)
        handle.flush()
        os.fsync(handle.fileno())
    os.replace(temporary, path)


@contextmanager
def single_instance(directory: Path):
    directory.mkdir(parents=True, exist_ok=True)
    with (directory / "worker.lock").open("a+b") as handle:
        if os.fstat(handle.fileno()).st_size == 0:
            handle.write(b"0")
            handle.flush()
        handle.seek(0)
        try:
            if os.name == "nt":
                import msvcrt
                msvcrt.locking(handle.fileno(), msvcrt.LK_NBLCK, 1)
            else:
                import fcntl
                fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except OSError:
            raise SyncError("worker_already_running") from None
        try:
            yield
        finally:
            handle.seek(0)
            if os.name == "nt":
                msvcrt.locking(handle.fileno(), msvcrt.LK_UNLCK, 1)
            else:
                fcntl.flock(handle, fcntl.LOCK_UN)


def normalized(value: str) -> str:
    return " ".join("".join(c for c in unicodedata.normalize("NFKD", value)
                            if not unicodedata.combining(c)).casefold().split())


def actions_for(job: dict) -> list[dict]:
    q = job.get("qualification", {})
    if not isinstance(q, dict) or q.get("service") not in ("mentoria", "implementacion"):
        raise SyncError("invalid_payload")
    canonical_uuid(q.get("id"))
    limits = {"name": 160, "email": 200, "company": 160, "role": 160,
              "result": 2000, "budget": 80, "availability": 40, "context": 2000, "decision": 80}
    for key, maximum in limits.items():
        value = q.get(key, "")
        if not isinstance(value, str) or len(value) > maximum:
            raise SyncError("invalid_payload")
    if not all(q.get(key, "").strip() for key in ("name", "email", "company", "result")):
        raise SyncError("invalid_payload")
    if "@" not in q["email"]:
        raise SyncError("invalid_payload")
    details = "\n".join(f"{key}: {q.get(key, '')}" for key in
                        ("role", "result", "budget", "availability", "context", "decision"))
    return [
        {"action": "create", "entity": "clients", "ref": "prospect", "data": {
            "name": q["name"], "email": q["email"], "company": q["company"],
            "service": "Mentoría IA" if q["service"] == "mentoria" else "Implementación IA",
            "stage": "Prospecto", "notes": f"Postulación web {q['id']}. Interés declarado, no contrato ni identidad verificada.",
        }},
        {"action": "create", "entity": "entries", "data": {
            "client_id": "$prospect", "kind": "information", "title": "Postulación web CrececonIA",
            "body": details.strip(),
        }},
    ]


def duplicate_in_state(state: dict, client: dict) -> bool:
    return any(normalized(row.get("email", "")) == normalized(client["email"])
               or (normalized(row.get("name", "")) == normalized(client["name"])
                   and normalized(row.get("company", "")) == normalized(client["company"]))
               for row in state.get("clients", []))


def receipt_matches(receipt: dict, operation_id: str, source: str, actions: list[dict]) -> bool:
    if (receipt.get("status") != "committed" or receipt.get("operation_id") != operation_id
            or receipt.get("source") != source):
        return False
    changes = receipt.get("changes", [])
    if len(changes) != len(actions):
        return False
    prospect = receipt.get("refs", {}).get("prospect")
    if not prospect:
        return False
    for change, action in zip(changes, actions):
        if change.get("action") != "create" or change.get("entity") != action["entity"]:
            return False
        after = change.get("after") or {}
        for key, value in action["data"].items():
            if after.get(key) != (prospect if value == "$prospect" else value):
                return False
    return True


class Worker:
    def __init__(self, site, crm, directory: Path):
        self.site, self.crm, self.directory = site, crm, directory
        self.directory.mkdir(parents=True, exist_ok=True)
        identity = directory / "identity.json"
        if not identity.exists():
            atomic_save(identity, {"workerId": str(uuid4())})
        self.worker_id = canonical_uuid(json.loads(identity.read_text())["workerId"])

    def receipt(self, operation_id: str):
        try:
            return self.crm.request("/api/operations/" + operation_id)
        except ApiError as error:
            if error.status == 404:
                return None
            raise

    def run_once(self) -> str:
        claimed = self.site.request("/api/integrations/nitido/claim", {"workerId": self.worker_id, "limit": 1})
        jobs = claimed.get("jobs")
        if not isinstance(jobs, list) or len(jobs) > 1:
            raise SyncError("invalid_claim_response")
        if not jobs:
            return "idle"
        job = jobs[0]
        job_id, lease = canonical_uuid(job.get("id")), canonical_uuid(job.get("leaseToken"))
        try:
            expires = datetime.fromisoformat(job["leaseExpiresAt"].replace("Z", "+00:00"))
            if expires.tzinfo is None or expires <= datetime.now(timezone.utc):
                raise ValueError()
        except (KeyError, ValueError, TypeError, AttributeError):
            raise SyncError("invalid_or_expired_lease") from None
        path = self.directory / f"{job_id}.json"
        checkpoint = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
        payload_hash = fingerprint(job.get("qualification", {}))
        if checkpoint and checkpoint.get("payloadHash") != payload_hash:
            raise SyncError("job_payload_changed")
        operation_id = str(uuid5(NAMESPACE_URL, self.site.base + "/nitido/" + job_id))
        source = f"CrececonIA web qualification {job_id}"
        ack = {"jobId": job_id, "leaseToken": lease}
        try:
            actions = actions_for(job)
        except SyncError:
            self.site.request("/api/integrations/nitido/ack", {**ack, "outcome": "needs_review", "reasonCode": "invalid_payload"})
            return "needs_review"
        receipt = self.receipt(operation_id)
        if receipt is None:
            if not checkpoint.get("prepared"):
                state = self.crm.state()
                if duplicate_in_state(state, actions[0]["data"]):
                    self.site.request("/api/integrations/nitido/ack", {**ack, "outcome": "needs_review", "reasonCode": "duplicate_candidate"})
                    return "needs_review"
                checkpoint = {"payloadHash": payload_hash, "prepared": {
                    "operation_id": operation_id, "source": source,
                    "expected_revision": state["revision"], "actions": actions,
                }}
                atomic_save(path, checkpoint)
            prepared = checkpoint["prepared"]
            if prepared.get("operation_id") != operation_id or prepared.get("actions") != actions or prepared.get("source") != source:
                raise SyncError("checkpoint_mismatch")
            try:
                self.crm.request("/api/operations/preview", prepared)
                self.crm.request("/api/operations/apply", prepared)
            except ApiError as error:
                receipt = self.receipt(operation_id)
                if receipt is None:
                    reason = ("duplicate_candidate" if error.details.get("candidates") else "revision_conflict")
                    if error.status not in (400, 409):
                        raise
                    self.site.request("/api/integrations/nitido/ack", {**ack, "outcome": "needs_review",
                                                                      "reasonCode": "invalid_payload" if error.status == 400 else reason})
                    return "needs_review"
            except SyncError:
                # An apply timeout is not permission to construct another operation.
                receipt = self.receipt(operation_id)
                if receipt is None:
                    raise
            receipt = receipt or self.receipt(operation_id)
        if not receipt or not receipt_matches(receipt, operation_id, source, actions):
            raise SyncError("receipt_not_verified")
        # Keep the immutable operation until remote ACK is confirmed, then remove PII.
        self.site.request("/api/integrations/nitido/ack", {**ack, "outcome": "synced", "operationId": operation_id})
        atomic_save(path, {"payloadHash": payload_hash, "operationId": operation_id, "status": "acked"})
        return "synced"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="Enable one claim and import; no background installation")
    parser.add_argument("--site", default="https://www.crececonia.cl")
    parser.add_argument("--crm", default="http://127.0.0.1:8777")
    parser.add_argument("--state-dir", type=Path, default=Path(os.environ.get("LOCALAPPDATA", str(Path.home()))) / "Nitido" / "crececonia-sync")
    args = parser.parse_args()
    try:
        key = os.environ.get("NITIDO_SYNC_KEY", "").strip()
        if len(key) < 32:
            raise SyncError("missing_sync_key")
        site, crm = JsonApi(args.site, key=key), JsonApi(args.crm, local=True)
        health = crm.request("/api/health")
        if health.get("app") != "nitido-crm" or health.get("operator_api") != 1:
            raise SyncError("unsupported_crm")
        if not args.apply:
            print(json.dumps({"status": "ready_not_activated"}))
            return 0
        with single_instance(args.state_dir):
            status = Worker(site, crm, args.state_dir).run_once()
        print(json.dumps({"status": status}))
        return 0
    except (SyncError, OSError, ValueError, KeyError, TypeError):
        # No response bodies, client fields, URLs or credentials in task logs.
        print(json.dumps({"status": "failed", "action": "inspect_private_checkpoint_and_retry"}))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
