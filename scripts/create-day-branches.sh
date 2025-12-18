#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./scripts/create-day-branches.sh
#   BASE=main DAYS=21 PREFIX=day ./scripts/create-day-branches.sh
#   BASE=main PUSH=1 ./scripts/create-day-branches.sh

BASE="${BASE:-main}"         # base branch to branch off
DAYS="${DAYS:-21}"           # number of days
PREFIX="${PREFIX:-day}"      # branch name prefix
PUSH="${PUSH:-0}"            # set to 1 to push branches to origin
REMOTE="${REMOTE:-origin}"   # remote name

# Ensure working tree is clean
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Working tree is not clean. Commit/stash changes first."
  exit 1
fi

# Fetch and ensure base exists locally
git fetch "$REMOTE" --prune

# Checkout base and make sure it's up to date
git checkout "$BASE"
git pull --ff-only "$REMOTE" "$BASE"

# Create branches
for i in $(seq 1 "$DAYS"); do
  name="${PREFIX}/$(printf '%02d' "$i")"
  if git show-ref --verify --quiet "refs/heads/$name"; then
    echo "Exists: $name (skipping)"
  else
    git branch "$name" "$BASE"
    echo "Created: $name"
  fi

  if [[ "$PUSH" == "1" ]]; then
    if git ls-remote --exit-code --heads "$REMOTE" "$name" >/dev/null 2>&1; then
      echo "Remote exists: $REMOTE/$name (skipping push)"
    else
      git push -u "$REMOTE" "$name"
      echo "Pushed: $REMOTE/$name"
    fi
  fi
done

echo "Done."