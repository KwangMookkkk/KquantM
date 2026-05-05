#!/bin/bash

FRONTEND_DIR=~/quant-project/frontend

echo "=== [quality-gate] tsc 타입 체크 ==="
cd "$FRONTEND_DIR" && npx tsc --noEmit
if [ $? -ne 0 ]; then
  echo "FAILED: tsc 타입 오류가 있습니다. 수정 후 다시 시도하세요."
  exit 1
fi

echo "=== [quality-gate] ESLint 검사 ==="
cd "$FRONTEND_DIR" && npm run lint
if [ $? -ne 0 ]; then
  echo "FAILED: ESLint 오류가 있습니다. 수정 후 다시 시도하세요."
  exit 1
fi

echo "=== [quality-gate] 모든 검사 통과 ==="
exit 0
