"""Synthetic HTTP-client contract tests; never connects to a running CRM or site."""
import copy
from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
import tempfile
import unittest
from uuid import uuid4

from sync import ApiError, JsonApi, SyncError, Worker, actions_for, single_instance


def job():
    return {"id": str(uuid4()), "leaseToken": str(uuid4()),
            "leaseExpiresAt": (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat(),
            "qualification": {"id": str(uuid4()), "service": "mentoria", "name": "Synthetic Person",
                              "email": "synthetic@example.test", "company": "Example Test",
                              "role": "Owner", "result": "A synthetic test objective", "budget": "test",
                              "availability": "2–4 horas", "context": "", "decision": ""}}


class Site:
    base = "https://example.test"

    def __init__(self, value):
        self.job = value
        self.acks = []
        self.fail_ack = False

    def request(self, path, data):
        if path.endswith("/claim"):
            return {"jobs": [copy.deepcopy(self.job)] if self.job else []}
        self.acks.append(data)
        if self.fail_ack:
            raise SyncError("timeout")
        return {"ok": True}


class Crm:
    def __init__(self):
        self.clients = []
        self.receipts = {}
        self.revision = 0
        self.applies = 0
        self.fail_after_commit = False
        self.fail_before_commit = False
        self.preview_error = None
        self.receipt_down = False

    def state(self):
        return {"revision": self.revision, "clients": self.clients}

    def request(self, path, data=None):
        if data is None:
            if self.receipt_down:
                raise SyncError("unavailable")
            if path.rsplit("/", 1)[-1] not in self.receipts:
                raise ApiError(404)
            return self.receipts[path.rsplit("/", 1)[-1]]
        if self.preview_error:
            raise self.preview_error
        if data["expected_revision"] != self.revision:
            raise ApiError(409, {"current_revision": self.revision})
        if path.endswith("preview"):
            return {"status": "preview"}
        if self.fail_before_commit:
            raise SyncError("timeout")
        self.applies += 1
        prospect = str(uuid4())
        changes = []
        for action in data["actions"]:
            after = {key: prospect if value == "$prospect" else value.strip() if isinstance(value, str) else value
                     for key, value in action["data"].items()}
            changes.append({"action": "create", "entity": action["entity"], "after": after})
        self.receipts[data["operation_id"]] = {"status": "committed", "operation_id": data["operation_id"],
                                                "source": data["source"], "refs": {"prospect": prospect}, "changes": changes}
        self.revision += 1
        if self.fail_after_commit:
            raise SyncError("timeout")
        return self.receipts[data["operation_id"]]


class WorkerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.path = Path(self.temp.name)
        self.site, self.crm = Site(job()), Crm()
        self.worker = Worker(self.site, self.crm, self.path)

    def tearDown(self):
        self.temp.cleanup()

    def test_create_prospect_and_entry_only_then_ack(self):
        self.assertEqual(self.worker.run_once(), "synced")
        self.assertEqual(self.crm.applies, 1)
        self.assertEqual(self.site.acks[-1]["outcome"], "synced")
        self.assertEqual([a["entity"] for a in actions_for(self.site.job)], ["clients", "entries"])
        saved = json.loads((self.path / f"{self.site.job['id']}.json").read_text())
        self.assertNotIn("prepared", saved)

    def test_timeout_after_commit_verifies_receipt(self):
        self.crm.fail_after_commit = True
        self.assertEqual(self.worker.run_once(), "synced")
        self.assertEqual(self.crm.applies, 1)

    def test_timeout_before_commit_keeps_identical_operation(self):
        self.crm.fail_before_commit = True
        with self.assertRaises(SyncError):
            self.worker.run_once()
        path = self.path / f"{self.site.job['id']}.json"
        prepared = json.loads(path.read_text())["prepared"]
        self.assertEqual(self.site.acks, [])
        self.crm.fail_before_commit = False
        self.site.job["leaseToken"] = str(uuid4())
        self.assertEqual(Worker(self.site, self.crm, self.path).run_once(), "synced")
        self.assertIn(prepared["operation_id"], self.crm.receipts)

    def test_ack_timeout_and_new_lease_never_reapply(self):
        self.site.fail_ack = True
        with self.assertRaises(SyncError):
            self.worker.run_once()
        self.site.fail_ack = False
        self.site.job["leaseToken"] = str(uuid4())
        self.assertEqual(Worker(self.site, self.crm, self.path).run_once(), "synced")
        self.assertEqual(self.crm.applies, 1)

    def test_deleted_checkpoint_recovers_by_deterministic_receipt(self):
        self.worker.run_once()
        (self.path / f"{self.site.job['id']}.json").unlink()
        self.assertEqual(self.worker.run_once(), "synced")
        self.assertEqual(self.crm.applies, 1)

    def test_archived_or_normalized_duplicate_quarantined(self):
        self.crm.clients = [{"name": "Different", "email": "SYNTHETIC@example.test", "archived": True}]
        self.assertEqual(self.worker.run_once(), "needs_review")
        self.assertEqual(self.crm.applies, 0)
        self.assertEqual(self.site.acks[-1]["reasonCode"], "duplicate_candidate")

    def test_duplicate_appearing_at_preview_quarantined(self):
        self.crm.preview_error = ApiError(409, {"candidates": [{"id": "test"}]})
        self.assertEqual(self.worker.run_once(), "needs_review")
        self.assertEqual(self.site.acks[-1]["reasonCode"], "duplicate_candidate")

    def test_stale_revision_is_not_force_updated(self):
        self.crm.fail_before_commit = True
        with self.assertRaises(SyncError):
            self.worker.run_once()
        self.crm.revision += 1
        self.crm.fail_before_commit = False
        self.assertEqual(self.worker.run_once(), "needs_review")
        self.assertEqual(self.crm.applies, 0)
        self.assertEqual(self.site.acks[-1]["reasonCode"], "revision_conflict")

    def test_mismatched_receipt_not_acked(self):
        self.worker.run_once()
        self.site.acks.clear()
        next(iter(self.crm.receipts.values()))["changes"][0]["after"]["email"] = "other@example.test"
        with self.assertRaisesRegex(SyncError, "receipt_not_verified"):
            self.worker.run_once()
        self.assertEqual(self.site.acks, [])

    def test_receipt_unavailable_never_applies(self):
        self.crm.receipt_down = True
        with self.assertRaises(SyncError):
            self.worker.run_once()
        self.assertEqual(self.crm.applies, 0)
        self.assertEqual(self.site.acks, [])

    def test_payload_changed_after_checkpoint_stops(self):
        self.worker.run_once()
        self.site.job["qualification"]["email"] = "changed@example.test"
        with self.assertRaisesRegex(SyncError, "job_payload_changed"):
            self.worker.run_once()

    def test_invalid_email_length_quarantines_without_truncating(self):
        self.site.job["qualification"]["email"] = "a" * 210 + "@example.test"
        self.assertEqual(self.worker.run_once(), "needs_review")
        self.assertEqual(self.crm.applies, 0)

    def test_expired_lease_stops_before_crm(self):
        self.site.job["leaseExpiresAt"] = "2000-01-01T00:00:00Z"
        with self.assertRaisesRegex(SyncError, "invalid_or_expired_lease"):
            self.worker.run_once()
        self.assertEqual(self.crm.applies, 0)

    def test_empty_batch(self):
        self.site.job = None
        self.assertEqual(self.worker.run_once(), "idle")

    def test_single_instance_lock_releases(self):
        with single_instance(self.path):
            with self.assertRaisesRegex(SyncError, "worker_already_running"):
                with single_instance(self.path):
                    self.fail("lock accepted twice")
        with single_instance(self.path):
            pass


class BoundaryTests(unittest.TestCase):
    def test_local_api_cannot_target_external_host(self):
        for url in ("https://127.0.0.1:8777", "http://evil.test", "http://127.0.0.1@evil.test"):
            with self.subTest(url=url), self.assertRaises(SyncError):
                JsonApi(url, local=True)

    def test_website_requires_https_origin_without_credentials(self):
        for url in ("http://example.test", "https://user:secret@example.test", "https://example.test/path"):
            with self.subTest(url=url), self.assertRaises(SyncError):
                JsonApi(url, key="test")


if __name__ == "__main__":
    unittest.main()
