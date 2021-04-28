import type {LevelDBI, LevelDBIteratorI} from "./index";

// Return the position at the first key in the source that is at or past `k`.
function getIdx(kv: null | [ArrayBuffer, ArrayBuffer][], k: ArrayBuffer | string, start?: number, end?: number): number {
  if (!kv) {
    throw new Error('FakeLevelDB was closed!');
  }

  k = toArraybuf(k);
  start = start || 0;
  end = end || kv.length;

  const pivot: number = Math.floor(start + (end - start) / 2);
  if (end - start <= 1) {
    if (pivot < kv.length && arraybufGt(k, kv[pivot][0])) {
      return end;
    } else {
      return pivot;
    }
  }
  if (!arraybufGt(kv[pivot][0], k) && !arraybufGt(k, kv[pivot][0])) { // equality check, done as the inverse of <>
    return pivot;
  }
  if (arraybufGt(kv[pivot][0], k)) {
    return getIdx(kv, k, start, pivot);
  } else {
    return getIdx(kv, k, pivot, end);
  }
}

export class FakeLevelDBIterator implements LevelDBIteratorI {
  private kv: [ArrayBuffer, ArrayBuffer][];
  private pos: undefined|number;

  constructor(db: FakeLevelDB) {
    if (!db.kv) {
      throw new Error(`Could't make FakeLevelDBIterator: DB was closed!`);
    }

    this.kv = [...db.kv];  // This creates a snapshot, like LevelDB would!
    this.pos = undefined;
  }

  seekToFirst(): LevelDBIteratorI {
    this.pos = 0;
    return this;
  }

  seekLast(): LevelDBIteratorI {
    this.pos = this.kv.length - 1;
    return this;
  }

  seek(target: ArrayBuffer | string): LevelDBIteratorI {
    this.pos = getIdx(this.kv, target);
    return this;
  }

  valid(): boolean {
    return this.pos !== undefined && this.pos >= 0 && this.pos < this.kv.length;
  }

  next(): void {
    this.pos!++;
  }

  prev(): void {
    this.pos!--;
  }

  close() {
    this.pos = undefined;
  }

  keyStr(): string {
    return toString(this.kv[this.pos!][0]);
  }

  keyBuf(): ArrayBuffer {
    return toArraybuf(this.kv[this.pos!][0]);
  }

  valueStr(): string {
    return toString(this.kv[this.pos!][1]);
  }

  valueBuf(): ArrayBuffer {
    return toArraybuf(this.kv[this.pos!][1]);
  }
}

// `global as any` is a hack to get around this issue:
//  https://github.com/microsoft/TypeScript/issues/31535
var decoder = new (global as any).TextDecoder();
var encoder = new (global as any).TextEncoder();

export function toString(buf: string | ArrayBuffer): string {
  if (typeof buf == 'string') {
    return buf;
  }

  return decoder.decode(new Uint8Array(buf));
}

export function toArraybuf(str: string | ArrayBuffer): ArrayBuffer {
  if (str instanceof ArrayBuffer) {
    return str;
  }
  var uint8Arr: Uint8Array = encoder.encode(str);
  return uint8Arr.buffer;
}

export function arraybufGt(a: ArrayBuffer, b: ArrayBuffer): boolean {
  var keyA = new Uint8Array(a);
  var keyB = new Uint8Array(b);
  for (var i = 0 ; i < keyA.byteLength && i < keyB.byteLength ; ++i) {
    if (keyA[i] > keyB[i]) {
      return true;
    }
    if (keyA[i] < keyB[i]) {
      return false;
    }
  }

  return keyA.byteLength > keyB.byteLength;
}

export class FakeLevelDB implements LevelDBI {
  // The in-mem storage, as a sorted Array of KVs. The keys & values are stored as ArrayBuffers, which has the advantage
  // that it's very close to how LevelDB works.
  public kv: null|[ArrayBuffer, ArrayBuffer][];

  constructor() {
    this.kv = [];
  }

  close() {
    this.kv = null;
  }

  put(k: ArrayBuffer | string, v: ArrayBuffer | string) {
    const curIdx = getIdx(this.kv, k);
    // curIdx is the position at the first key in the source that is at or past `k`:
    if (curIdx == this.kv!.length) {
      this.kv!.push([toArraybuf(k), toArraybuf(v)]);
    } else if (arraybufGt(this.kv![curIdx][0], toArraybuf(k))) {
      // When curIdx's key is past `k`, we add a new element at position. For example, given keys b, d, f:
      // k='a' should return 0; k='c' should return 1; k='f' should return 3.
      this.kv!.splice(curIdx, 0, [toArraybuf(k), toArraybuf(v)]);
    } else {
      this.kv![curIdx][1] = toArraybuf(v);
    }
  }

  delete(k: ArrayBuffer | string) {
    k = toArraybuf(k);
    const curIdx = getIdx(this.kv, k);
    if (curIdx < this.kv!.length && !arraybufGt(this.kv![curIdx][0], k) && !arraybufGt(k, this.kv![curIdx][0])) {
      this.kv!.splice(curIdx, 1);
    }
  }

  getStr(k: ArrayBuffer | string): null | string {
    const curIdx = getIdx(this.kv, k);
    if (curIdx == null) {
      return null;
    } else {
      return toString(this.kv![curIdx][1]);
    }
  }

  getBuf(k: ArrayBuffer | string): null | ArrayBuffer {
    const curIdx = getIdx(this.kv, k);
    if (curIdx == null) {
      return null;
    } else {
      return toArraybuf(this.kv![curIdx][1]);
    }
  }

  newIterator(): LevelDBIteratorI {
    return new FakeLevelDBIterator(this);
  }
}
