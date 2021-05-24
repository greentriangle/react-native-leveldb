function getRandomArrayBuffer(size: number): ArrayBuffer {
  const buffer = new ArrayBuffer(size);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < size; ++i) {
    view[i] = Math.random() * 256;
  }
  return buffer;
}

export function getTestSetArrayBuffer(length: number) {
  const writeKvs: [ArrayBuffer, ArrayBuffer][] = [];
  for (let i = 0; i < length; ++i) {
    writeKvs.push([getRandomArrayBuffer(32), getRandomArrayBuffer(1024)]);
  }

  return writeKvs;
}

const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-';

export function getRandomString(size: number): string {
  let buffer = '';
  for (let i = 0; i < size; ++i) {
    buffer += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return buffer;
}

export function getTestSetString(length: number) {
  const writeKvs: [string, string][] = [];
  for (let i = 0; i < length; ++i) {
    writeKvs.push([getRandomString(32), getRandomString(1024)]);
  }

  return writeKvs;
}

export function compareReadWrite<T>(writeKvs: [T, T][], readKvs: [T, T][]) {
  if (readKvs.length != writeKvs.length) {
    throw new Error(`benchmark: expected ${writeKvs.length} KVs; got: ${readKvs.length}`);
  }
}

export function bufEquals(a_: ArrayBuffer, b_: ArrayBuffer) {
  const a = new Uint8Array(a_), b = new Uint8Array(b_);
  if (a.length != a.length) {
    return false;
  }

  for (let i = 0; i < a.length; ++i) {
    if (a[i]!= b[i]) {
      return false;
    }
  }

  return true;
}