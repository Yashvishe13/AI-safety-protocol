import os
import subprocess
import json
from typing import Any, Dict, Optional


class GracefulGuard:
    """
    Thin wrapper to invoke GraCeFul (https://github.com/ZrW00/GraCeFul)
    as a pre-execution guard. This uses the repository's CLI entry point
    via Python subprocess. It expects GraCeFul to be available in the
    environment (installed via requirements or available on PYTHONPATH).

    Usage:
        guard = GracefulGuard()
        decision = guard.assess(sample={"input": prompt, "meta": {...}})
        if decision.get("block"):
            raise RuntimeError("Blocked by GraCeFul: " + decision.get("reason", ""))
    """

    def __init__(self,
                 config_path: Optional[str] = None,
                 target_model: Optional[str] = None,
                 dataset: Optional[str] = None,
                 poisoner: Optional[str] = None,
                 weight_base_path: Optional[str] = None):
        self.config_path = config_path or os.getenv("GRACEFUL_CONFIG_PATH")
        self.target_model = target_model or os.getenv("GRACEFUL_TARGET_MODEL", "llama")
        self.dataset = dataset or os.getenv("GRACEFUL_DATASET", "webqa")
        self.poisoner = poisoner or os.getenv("GRACEFUL_POISONER", "genbadnets_question")
        self.weight_base_path = weight_base_path or os.getenv("GRACEFUL_WEIGHT_BASE_PATH")

    def _build_command(self) -> Any:
        # Prefer running casualDefense.py directly. Assumes it is importable.
        python_bin = os.getenv("GRACEFUL_PYTHON", "python")
        base_cmd = [
            python_bin,
            "-m",
            "casualDefense"
        ]
        # Fallback: try module path inside GraCeFul repo structure if needed
        # Users can set PYTHONPATH to include the cloned repo root.
        graceful_root = os.getenv("GRACEFUL_ROOT")
        env = os.environ.copy()
        if graceful_root:
            # Prepend graceful_root to PYTHONPATH so that modules resolve
            env["PYTHONPATH"] = graceful_root + (":" + env["PYTHONPATH"] if env.get("PYTHONPATH") else "")
        self._env = env
        args = []
        if self.config_path:
            args += ["--config_path", self.config_path]
        if self.target_model:
            args += ["--target_model", self.target_model]
        if self.dataset:
            args += ["--dataset", self.dataset]
        if self.poisoner:
            args += ["--poisoner", self.poisoner]
        if self.weight_base_path:
            args += ["--weight_base_path", self.weight_base_path]
        return base_cmd + args

    def assess(self, sample: Dict[str, Any]) -> Dict[str, Any]:
        """
        Send a minimal probe to GraCeFul. Since GraCeFul is built as a
        research training/defense runner, we simulate a check by invoking
        the defense pipeline with configured args. If the process exits
        cleanly, we return allow=True. If it fails or flags risk, return block.

        Note: For production, integrate directly with `openbackdoor.defenders.graceful_defender`
        and load the model/defender once, then feed features from your task.
        """
        cmd = self._build_command()
        try:
            proc = subprocess.run(
                cmd,
                input=json.dumps(sample).encode("utf-8"),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                check=False,
                env=getattr(self, "_env", None),
            )
        except FileNotFoundError:
            return {
                "allow": False,
                "block": True,
                "reason": "GraCeFul not found. Ensure the repo is installed and PYTHONPATH set.",
                "error": "python executable or module not found"
            }

        if proc.returncode == 0:
            return {
                "allow": True,
                "block": False,
                "reason": "GraCeFul defense run completed without error",
                "stdout": proc.stdout.decode("utf-8", errors="ignore")
            }

        return {
            "allow": False,
            "block": True,
            "reason": "GraCeFul reported an error or flagged risk",
            "stdout": proc.stdout.decode("utf-8", errors="ignore"),
            "stderr": proc.stderr.decode("utf-8", errors="ignore"),
            "returncode": proc.returncode
        }


__all__ = ["GracefulGuard"]


