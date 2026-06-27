#!/bin/bash
set -euo pipefail

# Run this ONCE on the DB VM, inside ~/db-stack/
# Generates the keyfile + keyfile.key used by MariaDB TDE (file_key_management plugin)

ENC_DIR="./mysql-encryption"
mkdir -p "$ENC_DIR"

if [ -f "$ENC_DIR/keyfile.key" ]; then
  echo "ERROR: $ENC_DIR/keyfile.key already exists. Refusing to overwrite an existing key."
  echo "If you really want to rotate, see ENKRIPSI_GUIDE.md section 4 (key rotation) first."
  exit 1
fi

# 1. Generate the actual 256-bit encryption key (used to encrypt the keyfile itself)
openssl rand -hex 32 > "$ENC_DIR/keyfile.key"
chmod 600 "$ENC_DIR/keyfile.key"

# 2. Generate the keyfile content: "<key_id>;<hex_encryption_key>"
#    key_id = 1 is the default InnoDB encryption key id referenced in docker-compose
KEY_HEX=$(openssl rand -hex 32)
echo "1;${KEY_HEX}" > "$ENC_DIR/keyfile"
chmod 600 "$ENC_DIR/keyfile"

echo "Generated:"
echo "  $ENC_DIR/keyfile       (contains the actual encryption key, id=1)"
echo "  $ENC_DIR/keyfile.key   (key used to encrypt the keyfile above)"
echo ""
echo "IMPORTANT: Back up both files somewhere safe OUTSIDE this VM (password manager / vault)."
echo "If you lose these, encrypted data on disk becomes permanently unreadable."
