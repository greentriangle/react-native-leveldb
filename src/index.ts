const g = global as any;

export interface LevelDBIteratorI {
  seekToFirst(): LevelDBIteratorI;
  seekLast(): LevelDBIteratorI;
  seek(target: ArrayBuffer | string): LevelDBIteratorI;
  valid(): boolean;
  next(): void;
  prev(): void;
  close(): void;
  keyStr(): string;
  keyBuf(): ArrayBuffer;
  valueStr(): string;
  valueBuf(): ArrayBuffer;
}

export interface LevelDBI {
  close(): void;
  put(k: ArrayBuffer | string, v: ArrayBuffer | string): void;
  delete(k: ArrayBuffer | string): void;
  getStr(k: ArrayBuffer | string): null | string;
  getBuf(k: ArrayBuffer | string): null | ArrayBuffer;
  newIterator(): LevelDBIteratorI;
}

export class LevelDBIterator implements LevelDBIteratorI {
  private ref: number;

  constructor(dbRef: number) {
    this.ref = g.leveldbNewIterator(dbRef);
  }

  seekToFirst(): LevelDBIterator {
    g.leveldbIteratorSeekToFirst(this.ref);
    return this;
  }

  seekLast(): LevelDBIterator {
    g.leveldbIteratorSeekToLast(this.ref);
    return this;
  }

  seek(target: ArrayBuffer | string): LevelDBIterator {
    g.leveldbIteratorSeek(this.ref, target);
    return this;
  }

  valid(): boolean {
    return g.leveldbIteratorValid(this.ref);
  }

  next(): void {
    g.leveldbIteratorNext(this.ref);
  }

  prev(): void {
    g.leveldbIteratorPrev(this.ref);
  }

  close() {
    g.leveldbIteratorDelete(this.ref);
    this.ref = -1;
  }

  keyStr(): string {
    return g.leveldbIteratorKeyStr(this.ref);
  }

  keyBuf(): ArrayBuffer {
    return g.leveldbIteratorKeyBuf(this.ref);
  }

  valueStr(): string {
    return g.leveldbIteratorValueStr(this.ref);
  }

  valueBuf(): ArrayBuffer {
    return g.leveldbIteratorValueBuf(this.ref);
  }
}

export class LevelDB implements LevelDBI {
  // Keep references to already open DBs here to facilitate RN's edit-refresh flow.
  // Note that when editing this file, this won't work, as RN will reload it and the openPathRefs
  // will be lost.
  private static openPathRefs: { [name: string]: undefined | number } = {};
  private ref: undefined | number;

  constructor(name: string, createIfMissing: boolean, errorIfExists: boolean) {
    if (LevelDB.openPathRefs[name] !== undefined) {
      this.ref = LevelDB.openPathRefs[name];
    } else {
      LevelDB.openPathRefs[name] = this.ref = g.leveldbOpen(name, createIfMissing, errorIfExists);
    }
  }

  close() {
    g.leveldbClose(this.ref);
    for (const name in LevelDB.openPathRefs) {
      if (LevelDB.openPathRefs[name] === this.ref) {
        delete LevelDB.openPathRefs[name];
      }
    }
    this.ref = undefined;
  }

  put(k: ArrayBuffer | string, v: ArrayBuffer | string) {
    g.leveldbPut(this.ref, k, v);
  }

  delete(k: ArrayBuffer | string) {
    g.leveldbPut(this.ref, k);
  }

  getStr(k: ArrayBuffer | string): null | string {
    return g.leveldbGetStr(this.ref, k);
  }

  getBuf(k: ArrayBuffer | string): null | ArrayBuffer {
    return g.leveldbGetBuf(this.ref, k);
  }

  newIterator(): LevelDBIterator {
    if (this.ref === undefined) {
      throw new Error('LevelDB.newIterator: could not create iterator, the DB was closed!');
    }
    return new LevelDBIterator(this.ref);
  }

  static destroyDB(name: string) {
    if (LevelDB.openPathRefs[name] !== undefined) {
      throw new Error('DB is open! Cannot destroy');
    } else {
      g.leveldbDestroy(name);
    }
  }
}
