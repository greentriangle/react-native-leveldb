const g = global as any;

export interface LevelDBIteratorI {
  // Position at the first key in the source.  The iterator is Valid()
  // after this call iff the source is not empty.
  seekToFirst(): LevelDBIteratorI;

  // Position at the last key in the source.  The iterator is
  // Valid() after this call iff the source is not empty.
  seekLast(): LevelDBIteratorI;

  // Position at the first key in the source that is at or past target.
  // The iterator is Valid() after this call iff the source contains
  // an entry that comes at or past target.
  seek(target: ArrayBuffer | string): LevelDBIteratorI;

  // An iterator is either positioned at a key/value pair, or
  // not valid.  This method returns true iff the iterator is valid.
  valid(): boolean;

  // Moves to the next entry in the source.  After this call, Valid() is
  // true iff the iterator was not positioned at the last entry in the source.
  // REQUIRES: Valid()
  next(): void;

  // Moves to the previous entry in the source.  After this call, Valid() is
  // true iff the iterator was not positioned at the first entry in source.
  // REQUIRES: Valid()
  prev(): void;
  close(): void;

  // Return the key for the current entry.  The underlying storage for
  // the returned slice is valid only until the next modification of
  // the iterator.
  // REQUIRES: Valid()
  keyStr(): string;
  keyBuf(): ArrayBuffer;

  // Return the value for the current entry.  The underlying storage for
  // the returned slice is valid only until the next modification of
  // the iterator.
  // REQUIRES: Valid()
  valueStr(): string;
  valueBuf(): ArrayBuffer;
}

export interface LevelDBI {
  close(): void;

  // Set the database entry for "k" to "v".  Returns OK on success, throws an exception on error.
  put(k: ArrayBuffer | string, v: ArrayBuffer | string): void;

  // Remove the database entry (if any) for "key". Throws an exception on error.
  // It is not an error if "key" did not exist in the database.
  delete(k: ArrayBuffer | string): void;

  // Returns the corresponding value for "key", if the database contains it; returns null otherwise.
  // Throws an exception if there is an error.
  // The *Str and *Buf methods help with geting the underlying data as a utf8 string or a byte buffer.
  getStr(k: ArrayBuffer | string): null | string;
  getBuf(k: ArrayBuffer | string): null | ArrayBuffer;

  // Returns an iterator over the contents of the database.
  // The result of newIterator() is initially invalid (caller must
  // call one of the seek methods on the iterator before using it).
  //
  // Caller should delete the iterator when it is no longer needed.
  // The returned iterator should be closed before this db is closed.
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

  // The native module may load asynchronously, in which case we have to wait for it. This method waits for the native
  // module to appear, and returns true. If we were not able to obtain the native module, returns false.
  public static async waitNativeModuleInitialized(): Promise<boolean> {
    for (let i = 0; i < 2000; ++i) {
      if (g.leveldbOpen) {
        return true;
      }

      await new Promise(resolve => setTimeout(resolve, 20));  // Sleep for 20 milliseconds.
    }

    return false;
  }

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
    g.leveldbDelete(this.ref, k);
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
