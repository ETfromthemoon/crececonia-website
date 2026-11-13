"""One-shot, outbound-only qualification importer. Disabled unless --apply is passed."""
from __future__ import annotations

import argparse
from contextlib import contextmanager
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import secrets
import stat
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
    try:
        parsed = urlsplit(value)
        hostname = parsed.hostname
        port = parsed.port
    except ValueError:
        raise SyncError("invalid_crm_origin" if local else "invalid_site_origin") from None
    valid_host = hostname in ("localhost", "127.0.0.1") if local else hostname in (
        "crececonia.cl", "www.crececonia.cl",
    )
    if (parsed.scheme != ("http" if local else "https") or not valid_host
            or parsed.username or parsed.password or parsed.path not in ("", "/")
            or parsed.query or parsed.fragment or (not local and port not in (None, 443))):
        raise SyncError("invalid_crm_origin" if local else "invalid_site_origin")
    return f"{parsed.scheme}://{hostname}" + (f":{port}" if port is not None else "")


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


def _is_reparse_point(path: Path) -> bool:
    try:
        mode = path.lstat().st_mode
    except FileNotFoundError:
        return False
    if stat.S_ISLNK(mode):
        return True
    attributes = getattr(path.lstat(), "st_file_attributes", 0)
    return bool(attributes & getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0x400))


def _assert_no_reparse_components(path: Path) -> None:
    absolute = path.absolute()
    for component in reversed((absolute, *absolute.parents)):
        if _is_reparse_point(component):
            raise SyncError("unsafe_state_path")


def _windows_user_dacl() -> tuple[object, object]:
    """Build a protected DACL granting full access only to the current Windows user."""
    import ctypes
    from ctypes import wintypes

    advapi32 = ctypes.WinDLL("advapi32", use_last_error=True)
    kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
    kernel32.GetCurrentProcess.restype = wintypes.HANDLE
    kernel32.CloseHandle.argtypes = [wintypes.HANDLE]
    kernel32.CloseHandle.restype = wintypes.BOOL
    kernel32.LocalFree.argtypes = [ctypes.c_void_p]
    kernel32.LocalFree.restype = ctypes.c_void_p
    advapi32.OpenProcessToken.argtypes = [wintypes.HANDLE, wintypes.DWORD, ctypes.POINTER(wintypes.HANDLE)]
    advapi32.OpenProcessToken.restype = wintypes.BOOL
    advapi32.GetTokenInformation.argtypes = [wintypes.HANDLE, ctypes.c_int, ctypes.c_void_p,
                                             wintypes.DWORD, ctypes.POINTER(wintypes.DWORD)]
    advapi32.GetTokenInformation.restype = wintypes.BOOL
    advapi32.ConvertSidToStringSidW.argtypes = [ctypes.c_void_p, ctypes.POINTER(wintypes.LPWSTR)]
    advapi32.ConvertSidToStringSidW.restype = wintypes.BOOL
    advapi32.ConvertStringSecurityDescriptorToSecurityDescriptorW.argtypes = [
        wintypes.LPCWSTR, wintypes.DWORD, ctypes.POINTER(ctypes.c_void_p), ctypes.POINTER(wintypes.DWORD),
    ]
    advapi32.ConvertStringSecurityDescriptorToSecurityDescriptorW.restype = wintypes.BOOL
    advapi32.GetSecurityDescriptorDacl.argtypes = [
        ctypes.c_void_p, ctypes.POINTER(wintypes.BOOL), ctypes.POINTER(ctypes.c_void_p),
        ctypes.POINTER(wintypes.BOOL),
    ]
    advapi32.GetSecurityDescriptorDacl.restype = wintypes.BOOL
    token = wintypes.HANDLE()
    if not advapi32.OpenProcessToken(kernel32.GetCurrentProcess(), 0x0008, ctypes.byref(token)):
        raise OSError(ctypes.get_last_error(), "OpenProcessToken failed")
    try:
        needed = wintypes.DWORD()
        advapi32.GetTokenInformation(token, 1, None, 0, ctypes.byref(needed))
        if not needed.value:
            raise OSError(ctypes.get_last_error(), "GetTokenInformation size failed")
        token_user = ctypes.create_string_buffer(needed.value)
        if not advapi32.GetTokenInformation(token, 1, token_user, needed, ctypes.byref(needed)):
            raise OSError(ctypes.get_last_error(), "GetTokenInformation failed")
        sid = ctypes.cast(token_user, ctypes.POINTER(ctypes.c_void_p))[0]
        sid_text = wintypes.LPWSTR()
        if not advapi32.ConvertSidToStringSidW(sid, ctypes.byref(sid_text)):
            raise OSError(ctypes.get_last_error(), "ConvertSidToStringSidW failed")
        try:
            descriptor = ctypes.c_void_p()
            sddl = f"D:P(A;;FA;;;{sid_text.value})"
            if not advapi32.ConvertStringSecurityDescriptorToSecurityDescriptorW(
                sddl, 1, ctypes.byref(descriptor), None,
            ):
                raise OSError(ctypes.get_last_error(), "security descriptor conversion failed")
        finally:
            kernel32.LocalFree(sid_text)
    finally:
        kernel32.CloseHandle(token)

    dacl = ctypes.c_void_p()
    dacl_present = wintypes.BOOL()
    dacl_defaulted = wintypes.BOOL()
    if not advapi32.GetSecurityDescriptorDacl(
        descriptor, ctypes.byref(dacl_present), ctypes.byref(dacl), ctypes.byref(dacl_defaulted),
    ) or not dacl_present.value or not dacl:
        kernel32.LocalFree(descriptor)
        raise OSError(ctypes.get_last_error(), "GetSecurityDescriptorDacl failed")
    return descriptor, dacl


def _windows_file_attributes(handle) -> int:
    import ctypes
    from ctypes import wintypes

    class FILE_ATTRIBUTE_TAG_INFO(ctypes.Structure):
        _fields_ = [("FileAttributes", wintypes.DWORD), ("ReparseTag", wintypes.DWORD)]

    kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
    kernel32.GetFileInformationByHandleEx.argtypes = [wintypes.HANDLE, ctypes.c_int, ctypes.c_void_p,
                                                       wintypes.DWORD]
    kernel32.GetFileInformationByHandleEx.restype = wintypes.BOOL
    info = FILE_ATTRIBUTE_TAG_INFO()
    if not kernel32.GetFileInformationByHandleEx(
        handle, 9, ctypes.byref(info), ctypes.sizeof(info),
    ):
        raise OSError(ctypes.get_last_error(), "GetFileInformationByHandleEx failed")
    return info.FileAttributes


def _close_windows_handle(handle) -> None:
    import ctypes
    from ctypes import wintypes

    kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
    kernel32.CloseHandle.argtypes = [wintypes.HANDLE]
    kernel32.CloseHandle.restype = wintypes.BOOL
    if not kernel32.CloseHandle(handle):
        raise OSError(ctypes.get_last_error(), "CloseHandle failed")


def _set_windows_user_dacl(handle) -> None:
    import ctypes
    from ctypes import wintypes

    descriptor, dacl = _windows_user_dacl()
    try:
        advapi32 = ctypes.WinDLL("advapi32", use_last_error=True)
        advapi32.SetSecurityInfo.argtypes = [
            wintypes.HANDLE, wintypes.DWORD, wintypes.DWORD, ctypes.c_void_p, ctypes.c_void_p,
            ctypes.c_void_p, ctypes.c_void_p,
        ]
        advapi32.SetSecurityInfo.restype = wintypes.DWORD
        # SE_FILE_OBJECT=1, DACL_SECURITY_INFORMATION | PROTECTED_DACL_SECURITY_INFORMATION.
        result = advapi32.SetSecurityInfo(
            handle, 1, 0x00000004 | 0x80000000,
            None, None, dacl, None,
        )
        if result:
            raise OSError(result, "could not restrict state path ACL to current user")
    finally:
        ctypes.WinDLL("kernel32", use_last_error=True).LocalFree(descriptor)


def _open_windows_path(path: Path, *, read_only: bool, directory: bool = False):
    import ctypes
    from ctypes import wintypes

    kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
    kernel32.CreateFileW.argtypes = [
        wintypes.LPCWSTR, wintypes.DWORD, wintypes.DWORD, ctypes.c_void_p,
        wintypes.DWORD, wintypes.DWORD, wintypes.HANDLE,
    ]
    kernel32.CreateFileW.restype = wintypes.HANDLE
    kernel32.CloseHandle.argtypes = [wintypes.HANDLE]
    kernel32.CloseHandle.restype = wintypes.BOOL
    access = (0x80000000 if read_only else 0) | 0x00020000 | 0x00040000  # GENERIC_READ, READ_CONTROL, WRITE_DAC
    flags = 0x00200000 | (0x02000000 if directory else 0)  # OPEN_REPARSE_POINT | BACKUP_SEMANTICS
    handle = kernel32.CreateFileW(str(path), access, 0x7, None, 3, flags, None)
    if handle == wintypes.HANDLE(-1).value:
        raise OSError(ctypes.get_last_error(), "CreateFileW failed")
    try:
        attributes = _windows_file_attributes(handle)
        is_reparse = bool(attributes & 0x400)
        is_directory = bool(attributes & 0x10)
        if is_reparse or is_directory != directory:
            raise SyncError("unsafe_state_file" if not directory else "unsafe_state_path")
        _set_windows_user_dacl(handle)
        return handle
    except Exception:
        kernel32.CloseHandle(handle)
        raise


def _create_windows_private_file(path: Path) -> int:
    import ctypes
    from ctypes import wintypes

    class SECURITY_ATTRIBUTES(ctypes.Structure):
        _fields_ = [("nLength", wintypes.DWORD), ("lpSecurityDescriptor", ctypes.c_void_p),
                    ("bInheritHandle", wintypes.BOOL)]

    descriptor, _ = _windows_user_dacl()
    kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
    kernel32.CreateFileW.argtypes = [
        wintypes.LPCWSTR, wintypes.DWORD, wintypes.DWORD, ctypes.POINTER(SECURITY_ATTRIBUTES),
        wintypes.DWORD, wintypes.DWORD, wintypes.HANDLE,
    ]
    kernel32.CreateFileW.restype = wintypes.HANDLE
    kernel32.CloseHandle.argtypes = [wintypes.HANDLE]
    kernel32.CloseHandle.restype = wintypes.BOOL
    security = SECURITY_ATTRIBUTES(ctypes.sizeof(SECURITY_ATTRIBUTES), descriptor, False)
    handle = kernel32.CreateFileW(str(path), 0x40000000 | 0x00020000 | 0x00040000, 0x7,
                                  ctypes.byref(security), 1, 0x80 | 0x00200000, None)
    try:
        if handle == wintypes.HANDLE(-1).value:
            raise OSError(ctypes.get_last_error(), "CreateFileW for private temp failed")
        attributes = _windows_file_attributes(handle)
        if attributes & 0x400 or attributes & 0x10:
            raise SyncError("unsafe_state_file")
        _set_windows_user_dacl(handle)
        return int(handle)
    except Exception:
        if handle != wintypes.HANDLE(-1).value:
            kernel32.CloseHandle(handle)
        raise
    finally:
        kernel32.LocalFree(descriptor)


def ensure_private_directory(directory: Path) -> None:
    _assert_no_reparse_components(directory)
    directory.mkdir(parents=True, exist_ok=True)
    if _is_reparse_point(directory) or not directory.is_dir():
        raise SyncError("unsafe_state_path")
    if os.name == "nt":
        handle = _open_windows_path(directory, read_only=False, directory=True)
        _close_windows_handle(handle)
    else:
        os.chmod(directory, 0o700)
        info = directory.stat()
        if hasattr(os, "geteuid") and info.st_uid != os.geteuid():
            raise SyncError("unsafe_state_owner")
        if stat.S_IMODE(info.st_mode) & 0o077:
            raise SyncError("unsafe_state_permissions")


def protect_existing_file(path: Path) -> None:
    _assert_no_reparse_components(path)
    if not path.exists():
        return
    if _is_reparse_point(path) or not path.is_file():
        raise SyncError("unsafe_state_file")
    if os.name == "nt":
        handle = _open_windows_path(path, read_only=False)
        _close_windows_handle(handle)
    else:
        os.chmod(path, 0o600)
        info = path.stat()
        if hasattr(os, "geteuid") and info.st_uid != os.geteuid():
            raise SyncError("unsafe_state_owner")
        if stat.S_IMODE(info.st_mode) & 0o077:
            raise SyncError("unsafe_state_permissions")


def read_private_json(path: Path) -> dict:
    protect_existing_file(path)
    try:
        if os.name == "nt":
            import msvcrt
            handle = _open_windows_path(path, read_only=True)
            try:
                descriptor = msvcrt.open_osfhandle(int(handle), os.O_RDONLY | getattr(os, "O_BINARY", 0))
            except Exception:
                _close_windows_handle(handle)
                raise
            handle = None  # ownership transferred to the file descriptor
            with os.fdopen(descriptor, "r", encoding="utf-8") as stream:
                value = json.load(stream)
        else:
            flags = os.O_RDONLY | getattr(os, "O_NOFOLLOW", 0)
            descriptor = os.open(path, flags)
            try:
                info = os.fstat(descriptor)
                if not stat.S_ISREG(info.st_mode) or (hasattr(os, "geteuid") and info.st_uid != os.geteuid()):
                    raise SyncError("unsafe_state_file")
                os.fchmod(descriptor, 0o600)
                with os.fdopen(descriptor, "r", encoding="utf-8") as stream:
                    descriptor = -1
                    value = json.load(stream)
            finally:
                if descriptor >= 0:
                    os.close(descriptor)
    except FileNotFoundError:
        raise
    except (ValueError, UnicodeError, OSError):
        raise SyncError("invalid_private_checkpoint") from None
    if not isinstance(value, dict):
        raise SyncError("invalid_private_checkpoint")
    return value


def atomic_save(path: Path, value: dict) -> None:
    ensure_private_directory(path.parent)
    protect_existing_file(path)
    serialized = json.dumps(value, ensure_ascii=False, allow_nan=False).encode("utf-8")
    temporary = path.with_name(f".{path.name}.{secrets.token_hex(12)}.tmp")
    descriptor = None
    try:
        flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL
        if hasattr(os, "O_NOFOLLOW"):
            flags |= os.O_NOFOLLOW
        if os.name == "nt":
            import msvcrt
            handle = _create_windows_private_file(temporary)
            try:
                descriptor = msvcrt.open_osfhandle(handle, os.O_WRONLY | getattr(os, "O_BINARY", 0))
            except Exception:
                _close_windows_handle(handle)
                raise
        else:
            descriptor = os.open(temporary, flags, 0o600)
            os.fchmod(descriptor, 0o600)
        with os.fdopen(descriptor, "wb") as handle:
            descriptor = None
            handle.write(serialized)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, path)
    finally:
        if descriptor is not None:
            os.close(descriptor)
        import sys
        operation_error = sys.exc_info()[1]
        try:
            temporary.unlink(missing_ok=True)
        except OSError as cleanup_error:
            if operation_error is not None:
                raise cleanup_error from operation_error
            raise


@contextmanager
def single_instance(directory: Path):
    ensure_private_directory(directory)
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
        ensure_private_directory(directory)
        identity = directory / "identity.json"
        if not identity.exists():
            atomic_save(identity, {"workerId": str(uuid4())})
        self.worker_id = canonical_uuid(read_private_json(identity)["workerId"])

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
        checkpoint = read_private_json(path) if path.exists() else {}
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
    parser.add_argument("--site", default="https://www.crececonia.cl",
                        help="Origen del sitio (sólo https://crececonia.cl o https://www.crececonia.cl)")
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
