#!/bin/bash

COMMAND=$(echo "$HOOK_INPUT" | python3 -c "
import sys, json
print(json.load(sys.stdin).get('tool_input', {}).get('command', ''))
")

# git add -A / git add . 차단
if echo "$COMMAND" | grep -qE "git add \.|git add -A"; then
  echo "BLOCKED: git add -A / git add . 금지. 파일을 명시적으로 지정하세요."
  exit 2
fi

# rm -rf 차단
if echo "$COMMAND" | grep -qE "rm -rf"; then
  echo "BLOCKED: rm -rf 금지. 삭제 대상을 명시적으로 지정하세요."
  exit 2
fi

# force push 차단
if echo "$COMMAND" | grep -qE "git push.*--force|git push.*-f"; then
  echo "BLOCKED: git push --force 금지."
  exit 2
fi

# 프로덕션 DB 직접 접근 차단 (추후 Supabase 연동 시 대비)
if echo "$COMMAND" | grep -qE "DROP TABLE|TRUNCATE|DELETE FROM"; then
  echo "BLOCKED: 직접 DB 조작 금지."
  exit 2
fi

exit 0
