"""
Comprehensive Integration Test Suite for Facial Emotion Detection REST API.
Tests all endpoints, error conditions, background workers, and aggregation states.
"""

import subprocess
import sys
import time
import requests

def run_full_suite():
    print("=" * 70)
    print("STARTING FASTAPI REST API INTEGRATION SUITE")
    print("=" * 70)

    proc = subprocess.Popen([
        r".\venv311\Scripts\python.exe", "-m", "uvicorn", "app.main:app",
        "--host", "127.0.0.1", "--port", "8000"
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


    base = "http://127.0.0.1:8000"

    try:
        print("[Setup] Waiting for Uvicorn server startup and CUDA warm-up...")
        time.sleep(5)

        # 1. Root Endpoint
        print("\n[1] Testing GET / ...")
        r = requests.get(f"{base}/")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        assert r.json()["service"] == "Facial Emotion Detection API"
        print(f"    [OK] PASS - {r.json()}")

        # 2. Health Endpoint
        print("\n[2] Testing GET /health ...")
        r = requests.get(f"{base}/health")
        assert r.status_code == 200
        assert r.json()["status"] == "healthy"
        assert r.json()["model_loaded"] is True
        print(f"    [OK] PASS - {r.json()}")

        # 3. Status Endpoint
        print("\n[3] Testing GET /status ...")
        r = requests.get(f"{base}/status")
        assert r.status_code == 200
        assert r.json()["service"] == "running"
        print(f"    [OK] PASS - {r.json()}")

        # 4. Model Info & Classes
        print("\n[4] Testing GET /model/info and /model/classes ...")
        r_info = requests.get(f"{base}/model/info")
        assert r_info.status_code == 200
        assert r_info.json()["model_name"] == "YOLO11n"
        print(f"    [OK] PASS (Info) - {r_info.json()}")

        r_cls = requests.get(f"{base}/model/classes")
        assert r_cls.status_code == 200
        assert "4" in r_cls.json()["classes"] and r_cls.json()["classes"]["4"] == "happy"
        print(f"    [OK] PASS (Classes) - {len(r_cls.json()['classes'])} emotion classes registered")

        # 5. Session Creation
        print("\n[5] Testing POST /sessions and GET /sessions ...")
        r_sess = requests.post(f"{base}/sessions", json={"client_session_id": "test-session-alpha"})
        assert r_sess.status_code == 201
        sid = r_sess.json()["session_id"]
        assert sid == "test-session-alpha"
        print(f"    [OK] PASS (Created) - {r_sess.json()}")

        r_list = requests.get(f"{base}/sessions")
        assert r_list.status_code == 200
        assert any(s["session_id"] == sid for s in r_list.json()["sessions"])
        print(f"    [OK] PASS (List) - {r_list.json()}")

        r_detail = requests.get(f"{base}/sessions/{sid}")
        assert r_detail.status_code == 200
        assert r_detail.json()["status"] == "created"
        print(f"    [OK] PASS (Detail) - {r_detail.json()}")

        # 6. Start Webcam Monitoring (Non-blocking)
        print("\n[6] Testing POST /sessions/{id}/start (Non-blocking) ...")
        t_start = time.time()
        r_start = requests.post(f"{base}/sessions/{sid}/start")
        t_elapsed = time.time() - t_start
        assert r_start.status_code == 200
        assert r_start.json()["status"] == "running"
        assert t_elapsed < 1.0, f"Request took too long ({t_elapsed:.2f}s), should be non-blocking"
        print(f"    [OK] PASS - Returned in {t_elapsed*1000:.1f}ms: {r_start.json()}")

        # 7. Physical Camera Conflict Test (Session Beta attempts to use camera)
        print("\n[7] Testing Camera Ownership Enforcement (Conflict 409) ...")
        requests.post(f"{base}/sessions", json={"client_session_id": "test-session-beta"})
        r_conflict = requests.post(f"{base}/sessions/test-session-beta/start")
        assert r_conflict.status_code == 409
        print(f"    [OK] PASS (Expected 409 Conflict) - {r_conflict.json()}")

        # 8. Duplicate Start Test
        print("\n[8] Testing Duplicate Start on Active Session (Conflict 409) ...")
        r_dup = requests.post(f"{base}/sessions/{sid}/start")
        assert r_dup.status_code == 409
        print(f"    [OK] PASS (Expected 409 Duplicate) - {r_dup.json()}")

        # 9. Real-Time Observation Polling
        print("\n[9] Testing GET /sessions/{id}/current (Live observation) ...")
        time.sleep(1.5)
        r_curr = requests.get(f"{base}/sessions/{sid}/current")
        assert r_curr.status_code == 200
        assert "timestamp" in r_curr.json()
        assert "face_detected" in r_curr.json()
        print(f"    [OK] PASS - {r_curr.json()}")

        # 10. Wait for 8-Second Aggregation Summary
        print("\n[10] Waiting for 8.0s Temporal Window Aggregation...")
        time.sleep(7.5)
        r_latest = requests.get(f"{base}/sessions/{sid}/latest")
        assert r_latest.status_code == 200
        summary = r_latest.json()
        assert summary["window_seconds"] == 8.0
        assert "emotion_distribution" in summary
        assert "face_detected_ratio" in summary
        assert "emotion_trend" in summary
        assert "dominant_emotion_duration_seconds" in summary
        print(f"    [OK] PASS (Latest Summary) - {summary}")

        # Summary alias endpoint
        r_alias = requests.get(f"{base}/sessions/{sid}/summary")
        assert r_alias.status_code == 200
        assert r_alias.json()["timestamp"] == summary["timestamp"]
        print("    [OK] PASS (Summary Alias)")

        # Summaries list endpoint
        r_all_sum = requests.get(f"{base}/sessions/{sid}/summaries?limit=10&offset=0")
        assert r_all_sum.status_code == 200
        assert r_all_sum.json()["count"] >= 1
        print(f"    [OK] PASS (Summaries List) - Count: {r_all_sum.json()['count']}, Total: {r_all_sum.json()['total']}")

        # 11. Configuration API (GET and PUT)
        print("\n[11] Testing GET /config and PUT /config ...")
        r_cfg = requests.get(f"{base}/config")
        assert r_cfg.status_code == 200

        r_cfg_up = requests.put(f"{base}/config", json={"confidence_threshold": 0.65, "window_seconds": 10.0})
        assert r_cfg_up.status_code == 200
        assert r_cfg_up.json()["confidence_threshold"] == 0.65
        assert r_cfg_up.json()["window_seconds"] == 10.0
        print(f"    [OK] PASS (Config Updated) - {r_cfg_up.json()}")

        # Invalid config validation test
        r_invalid_cfg = requests.put(f"{base}/config", json={"confidence_threshold": 2.5})
        assert r_invalid_cfg.status_code == 422
        print(f"    [OK] PASS (Expected 422 for invalid threshold) - {r_invalid_cfg.json()['detail'][0]['msg']}")

        # Reset config back to default
        requests.put(f"{base}/config", json={"confidence_threshold": 0.50, "window_seconds": 8.0})

        # 12. Pause and Resume Controls
        print("\n[12] Testing POST /sessions/{id}/pause and /resume ...")
        r_pause = requests.post(f"{base}/sessions/{sid}/pause")
        assert r_pause.status_code == 200
        assert r_pause.json()["status"] == "paused"
        print(f"    [OK] PASS (Paused) - {r_pause.json()}")

        r_resume = requests.post(f"{base}/sessions/{sid}/resume")
        assert r_resume.status_code == 200
        assert r_resume.json()["status"] == "running"
        print(f"    [OK] PASS (Resumed) - {r_resume.json()}")

        # 13. Stop Webcam Monitoring & Release Camera
        print("\n[13] Testing POST /sessions/{id}/stop ...")
        r_stop = requests.post(f"{base}/sessions/{sid}/stop")
        assert r_stop.status_code == 200
        assert r_stop.json()["status"] == "stopped"
        print(f"    [OK] PASS (Stopped) - {r_stop.json()}")

        # Check status after stop
        r_stat_after = requests.get(f"{base}/status")
        assert r_stat_after.json()["camera_in_use"] is False
        print(f"    [OK] PASS (Camera Released) - camera_in_use: {r_stat_after.json()['camera_in_use']}")

        # 14. Session Deletion & Cleanup
        print("\n[14] Testing DELETE /sessions/{id} ...")
        r_del = requests.delete(f"{base}/sessions/{sid}")
        assert r_del.status_code == 200
        print(f"    [OK] PASS (Deleted) - {r_del.json()}")

        requests.delete(f"{base}/sessions/test-session-beta")

        # 404 for deleted session
        r_404 = requests.get(f"{base}/sessions/{sid}")
        assert r_404.status_code == 404
        print(f"    [OK] PASS (Expected 404 on deleted session) - {r_404.json()}")

        print("\n" + "=" * 70)
        print("ALL 14 REST API TEST SCENARIOS PASSED WITH ZERO ERRORS!")
        print("=" * 70)

    except Exception as e:
        print(f"\n[TEST FAILURE] {e}", file=sys.stderr)
        raise
    finally:
        print("\n[Teardown] Terminating Uvicorn test server...")
        proc.terminate()
        proc.wait(timeout=5)
        print("[Teardown] Clean shutdown complete.")

if __name__ == "__main__":
    run_full_suite()
