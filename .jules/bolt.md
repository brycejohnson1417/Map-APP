## 2026-05-05 - Parallelize I/O-bound operations
**Learning:** Parallelizing I/O-bound operations like attachment uploads using `Promise.all` in `ChangeRequestService` can yield significant performance improvements (approximately 10x for 10 concurrent uploads compared to sequential processing).
**Action:** Use `Promise.all` to parallelize I/O bounds when possible
