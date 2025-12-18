#!/usr/bin/env bash
set -euo pipefail

DAY="${1:-}"
BASE="${BASE:-main}"
REMOTE="${REMOTE:-origin}"
PREFIX="${PREFIX:-day}"

if [[ -z "$DAY" ]]; then
  echo "Usage: ./scripts/start-day.sh 2   (or 02)"
  exit 1
fi

DAY_NUM="$(printf '%02d' "$DAY")"
DAY_DISPLAY="$((10#$DAY))"  # Remove leading zeros for display/paths
BRANCH="${PREFIX}/${DAY_NUM}"

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Working tree is not clean. Commit/stash changes first."
  exit 1
fi

git fetch "$REMOTE" --prune

git checkout "$BASE"
git pull --ff-only "$REMOTE" "$BASE"

# Checkout day branch
if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  git checkout "$BRANCH"
else
  git checkout -b "$BRANCH" "$BASE"
fi

# Bring latest main into it (merge commit only if needed)
git merge --no-ff "$BASE" -m "Sync ${BASE} into Day ${DAY_NUM}" || true

# ====== Auto-generate Day Scaffold ======
REPO_ROOT="$(git rev-parse --show-toplevel)"
PAGE_DIR="${REPO_ROOT}/apps/web/src/app/dashboard/day/${DAY_DISPLAY}"
COMP_DIR="${REPO_ROOT}/apps/web/src/components/day-${DAY_DISPLAY}"

# Create page.tsx if it doesn't exist
if [[ ! -f "${PAGE_DIR}/page.tsx" ]]; then
  mkdir -p "$PAGE_DIR"
  cat > "${PAGE_DIR}/page.tsx" <<EOF
import { DayProgress } from "@/components/day-progress";
import { DayCard } from "@/components/day-${DAY_DISPLAY}";

export default function Day${DAY_DISPLAY}Page() {
  return (
    <div className="grid gap-4">
      <DayProgress day={${DAY_DISPLAY}} />
      <DayCard />
    </div>
  );
}
EOF
  echo "Created ${PAGE_DIR}/page.tsx"
else
  echo "Page already exists: ${PAGE_DIR}/page.tsx"
fi

# Create component folder if it doesn't exist
if [[ ! -d "${COMP_DIR}" ]]; then
  mkdir -p "$COMP_DIR"
  
  # Create DayCard.tsx
  cat > "${COMP_DIR}/DayCard.tsx" <<'EOF'
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DayCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Day ${DAY_NUM} - TODO</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          Implement your day ${DAY_NUM} component here.
        </div>
      </CardContent>
    </Card>
  );
}
EOF
  
  # Replace ${DAY_NUM} placeholders in DayCard.tsx
  sed -i '' "s/\${DAY_NUM}/${DAY_DISPLAY}/g" "${COMP_DIR}/DayCard.tsx"
  
  # Create index.ts
  cat > "${COMP_DIR}/index.ts" <<'EOF'
export { DayCard } from "./DayCard";
EOF
  
  echo "Created component folder: ${COMP_DIR}"
else
  echo "Component folder already exists: ${COMP_DIR}"
fi

echo "Ready on $BRANCH."