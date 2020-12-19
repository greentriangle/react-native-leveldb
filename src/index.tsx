const g = global as any;

function isBadResult(x: any) {
  return typeof x === 'number' && x < 0;
}

export class LevelDBIterator {
  private ref: number;

  constructor(dbRef: number) {
    this.ref = g.leveldbNewIterator(dbRef);
    if (isBadResult(this.ref)) {
      if (this.ref == -1) {
        throw new Error(`Unable to create iterator for LevelDB ${dbRef}`);
      }
      throw new Error('Unable to open LevelDB; internal error.');
    }
  }

  seekToFirst(): LevelDBIterator {
    if (isBadResult(g.leveldbIteratorSeekToFirst(this.ref))) {
      throw new Error('LevelDBIterator error');
    }

    return this;
  }

  seekLast(): LevelDBIterator {
    if (isBadResult(g.leveldbIteratorSeekToLast(this.ref))) {
      throw new Error('LevelDBIterator error');
    }

    return this;
  }

  seek(target: ArrayBuffer | string): LevelDBIterator {
    if (isBadResult(g.leveldbIteratorSeek(this.ref, target))) {
      throw new Error('LevelDBIterator error');
    }

    return this;
  }

  valid(): boolean {
    const res = g.leveldbIteratorValid(this.ref);
    if (isBadResult(res)) {
      throw new Error('LevelDBIterator error');
    }
    return res;
  }

  next(): void {
    if (isBadResult(g.leveldbIteratorNext(this.ref))) {
      throw new Error('LevelDBIterator error');
    }
  }

  keyStr(): string {
    const res = g.leveldbIteratorKeyStr(this.ref);
    if (isBadResult(res)) {
      throw new Error('LevelDBIterator error');
    }

    return res;
  }

  keyBuf(): ArrayBuffer {
    const res = g.leveldbIteratorKeyBuf(this.ref);
    if (isBadResult(res)) {
      throw new Error('LevelDBIterator error');
    }

    return res;
  }

  valueStr(): string {
    const res = g.leveldbIteratorValueStr(this.ref);
    if (isBadResult(res)) {
      throw new Error('LevelDBIterator error');
    }

    return res;
  }

  valueBuf(): ArrayBuffer {
    const res = g.leveldbIteratorValueBuf(this.ref);
    if (isBadResult(res)) {
      throw new Error('LevelDBIterator error');
    }

    return res;
  }
}

export class LevelDB {
  // Keep references to already open DBs here to facilitate RN's edit-refresh flow.
  // Note that when editing this file, this won't work, as RN will reload it and the openPathRefs
  // will be lost.
  private static openPathRefs: {[name: string]: number} = {};
  private ref: number;

  constructor(name: string, createIfMissing: boolean, errorIfExists: boolean) {
    if (LevelDB.openPathRefs[name] !== undefined) {
      this.ref = LevelDB.openPathRefs[name];
    } else {
      this.ref = g.leveldbOpen(name, createIfMissing, errorIfExists);
      if (!isBadResult(this.ref)) {
        LevelDB.openPathRefs[name] = this.ref;
      }
    }

    if (isBadResult(this.ref)) {
      if (this.ref == -1) {
        throw new Error(
          `Unable to open LevelDB; invalid constructor arguments: ` +
            `name=${name} createIfMissing=${createIfMissing} errorIfExists=${errorIfExists} `
        );
      }
      if (this.ref == -2) {
        throw new Error(
          'Unable to open LevelDB; internal error. Is the path valid?'
        );
      }
      if (this.ref == -3) {
        throw new Error(
          'Unable to use LevelDB; ref was out of bounds or closed'
        );
      }
      if (this.ref == -100) {
        throw new Error('Unable to use LevelDB; DB has been closed');
      }
      throw new Error('Unable to open LevelDB; internal error.');
    }
  }

  close() {
    const res = g.leveldbClose(this.ref);
    if (isBadResult(res)) {
      throw new Error("Couldn't close LevelDB!");
    }
    this.ref = -100;
  }

  put(k: ArrayBuffer | string, v: ArrayBuffer | string) {
    if (isBadResult(g.leveldbPut(this.ref, k, v))) {
      throw new Error('LevelDB: unable to put()');
    }
  }

  getStr(k: ArrayBuffer | string, v: ArrayBuffer | string) {
    const res = g.leveldbGetStr(this.ref, k, v);
    if (isBadResult(res)) {
      throw new Error('LevelDB: unable to get()');
    }
    return res;
  }

  getBuf(k: ArrayBuffer | string, v: ArrayBuffer | string) {
    const res = g.leveldbGetBuf(this.ref, k, v);
    if (isBadResult(res)) {
      throw new Error('LevelDB: unable to get()');
    }
    return res;
  }

  newIterator(): LevelDBIterator {
    return new LevelDBIterator(this.ref);
  }
}
