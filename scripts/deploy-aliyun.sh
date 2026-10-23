#!/usr/bin/env bash
# Run on the development machine. No remote npm install/build or container build.
set -euo pipefail
cd "$(dirname "$0")/.."
lock_dir=".deploy-card.lock"
if ! mkdir "$lock_dir" 2>/dev/null; then
  echo 'Another card deployment is running. Wait for it to finish.' >&2
  exit 1
fi
package_dir="$(mktemp -d -t tenka-card)"
trap 'rm -f "$package_dir/site.tar.gz"; rmdir "$package_dir" "$lock_dir"' EXIT
npm run build
release_id="$(date -u +%Y%m%dT%H%M%SZ)-$(git rev-parse --short HEAD)"
python3 - "$package_dir/site.tar.gz" <<'PY'
import gzip, sys, tarfile
from pathlib import Path
root=Path('dist')
for path in root.rglob('*'):
    if path.is_file() and path.suffix in ('.html','.css','.js','.json','.svg') and path.stat().st_size>=1024:
        path.with_name(path.name+'.gz').write_bytes(gzip.compress(path.read_bytes(),compresslevel=6,mtime=0))
with tarfile.open(sys.argv[1], 'w:gz') as archive:
    archive.add(root, arcname='.')
PY
scp "$package_dir/site.tar.gz" "aliyun:/tmp/card-$release_id.tar.gz"
ssh aliyun bash -s -- "$release_id" <<'REMOTE'
set -euo pipefail
release_id="$1"
base=/root/nginx-proxy-manager/data/static/card
mkdir -p "$base/releases/$release_id"
tar -xzf "/tmp/card-$release_id.tar.gz" -C "$base/releases/$release_id"
test -s "$base/releases/$release_id/index.html"
if [ -L "$base/current" ]; then readlink "$base/current" > "$base/previous-release"; fi
ln -s "releases/$release_id" "$base/.current-$release_id"
mv -Tf "$base/.current-$release_id" "$base/current"
rm -f "/tmp/card-$release_id.tar.gz"
echo "Published $release_id; previous release retained."
REMOTE
printf 'Published https://card.umi-cv.com/\n'
