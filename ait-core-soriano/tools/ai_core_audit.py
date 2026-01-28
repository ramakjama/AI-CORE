
cd /d "C:\Users\RSORI\CODEX\AIT-CORE-SORIANO"
mkdir tools 2>nul

copy con tools\ai_core_audit.py

py tools\ai_core_audit.py
python tools\ai_core_audit.py
V
dir "_audit_out"
type "_audit_out\audit_report.md"

start "" "_audit_out"
