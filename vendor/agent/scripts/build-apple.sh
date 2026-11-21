#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IOS_DIR="${ROOT_DIR}/../ghost_ai-ios"
BUILD_DIR="${ROOT_DIR}/build/apple"
BINDINGS_DIR="${BUILD_DIR}/bindings"
HEADERS_DIR="${BUILD_DIR}/headers"
XCFRAMEWORK_PATH="${IOS_DIR}/Vendor/Ghost AIAgentFFI.xcframework"
SWIFT_BINDINGS_DIR="${IOS_DIR}/Sources/Ghost AIAgentBridge/Generated"
LIB_NAME="libghost_ai_agent_ffi.a"

export IPHONEOS_DEPLOYMENT_TARGET=17.0
export CMAKE_OSX_DEPLOYMENT_TARGET=17.0

rm -rf "${BUILD_DIR}" "${XCFRAMEWORK_PATH}"
mkdir -p "${BINDINGS_DIR}" "${HEADERS_DIR}" "${SWIFT_BINDINGS_DIR}" "${IOS_DIR}/Vendor"

cd "${ROOT_DIR}"
cargo build -p ghost-ai-agent-ffi --release
cargo run -p ghost-ai-agent-ffi --bin uniffi-bindgen -- \
    generate \
    --library "${ROOT_DIR}/target/release/libghost_ai_agent_ffi.dylib" \
    --language swift \
    --out-dir "${BINDINGS_DIR}"

cp "${BINDINGS_DIR}/ghost_ai_agent_ffiFFI.h" "${HEADERS_DIR}/"
cp "${BINDINGS_DIR}/ghost_ai_agent_ffiFFI.modulemap" "${HEADERS_DIR}/module.modulemap"
cp "${BINDINGS_DIR}/ghost_ai_agent_ffi.swift" "${SWIFT_BINDINGS_DIR}/"

cargo build -p ghost-ai-agent-ffi --release --target aarch64-apple-ios
cargo build -p ghost-ai-agent-ffi --release --target aarch64-apple-ios-sim
cargo build -p ghost-ai-agent-ffi --release --target x86_64-apple-ios

lipo -create \
    "${ROOT_DIR}/target/aarch64-apple-ios-sim/release/${LIB_NAME}" \
    "${ROOT_DIR}/target/x86_64-apple-ios/release/${LIB_NAME}" \
    -output "${BUILD_DIR}/${LIB_NAME}"

xcodebuild -create-xcframework \
    -library "${ROOT_DIR}/target/aarch64-apple-ios/release/${LIB_NAME}" \
    -headers "${HEADERS_DIR}" \
    -library "${BUILD_DIR}/${LIB_NAME}" \
    -headers "${HEADERS_DIR}" \
    -output "${XCFRAMEWORK_PATH}"

echo "Generated ${XCFRAMEWORK_PATH}"
