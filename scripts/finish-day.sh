#!/usr/bin/env bash
set -euo pipefail

DAY="${1:-}"
BASE="${BASE:-main}"
REMOTE="${REMOTE:-origin}"
PREFIX="${PREFIX:-day}"

if [[ -z "$DAY" ]]; then
  echo "Usage: ./scripts/finish-day.sh 2   (or 02)"
  exit 1
fi

# Normalize to 2-digit
DAY_NUM="$(printf '%02d' "$DAY")"
BRANCH="${PREFIX}/${DAY_NUM}"

# Ensure clean working tree
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Working tree is not clean. Commit/stash changes first."
  exit 1
fi

git fetch "$REMOTE" --prune

# Ensure day branch exists
if ! git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  echo "Local branch $BRANCH not found."
  exit 1
fi

# Update base
git checkout "$BASE"
git pull --ff-only "$REMOTE" "$BASE"

# Merge with a merge commit
git merge --no-ff "$BRANCH" -m "Merge Day ${DAY_NUM}"
git push "$REMOTE" "$BASE"

echo "Merged $BRANCH into $BASE and pushed."