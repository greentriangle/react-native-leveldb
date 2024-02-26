import {LevelDB, LevelDBWriteBatch} from "react-native-leveldb";
import {bufEquals, getRandomString} from "./test-util";

export function leveldbExample(): boolean {
  // Open a potentially new database.
  const name = 'example.db';
  const createIfMissing = true;
  const errorIfExists = false;
  const db = new LevelDB(name, createIfMissing, errorIfExists);

  // Insert something into the database. Note that the key and the
  // value can either be strings or ArrayBuffers.
  // Strings are read & written in utf8.
  db.put('key', 'value');

  // You can also use ArrayBuffers as input, containing binary data.
  const key = new Uint8Array([1, 2, 3]);
  const value = new Uint32Array([654321]);
  db.put(key.buffer, value.buffer);

  // Get values as string or as an ArrayBuffer (useful for binary data).
  const readStringValue = db.getStr('key');
  const readBufferValue = new Uint32Array(db.getBuf(key.buffer)!);
  console.log(readStringValue, readBufferValue);  // logs: value [654321]

  // Iterate over a range of values (here, from key "key" to the end.)
  let iter = db.newIterator();
  for (iter.seek('key'); iter.valid(); iter.next()) {
    // There are also *Buf version to access iterators' keys & values.
    console.log(`iterating: "${iter.keyStr()}" / "${iter.valueStr()}"`);
  }

  // You need to close iterators when you are done with them.
  // Iterators will throw an error if used after this.
  iter.close();

  db.close();  // Same for databases.

  return readStringValue == 'value' &&
    readBufferValue.length == 1 && readBufferValue[0] == 654321;
}

export function leveldbTestMerge(batchMerge: boolean) {
  let nameDst = getRandomString(32) + '.db';
  console.info('leveldbTestMerge: Opening DB', nameDst);
  const dbDst = new LevelDB(nameDst, true, true);
  dbDst.put('key1', 'value1');
  dbDst.put('key2', 'value2');

  const key3 = new Uint8Array([1, 2, 3]);
  const value3 = new Uint8Array([4, 5, 6]);
  dbDst.put(key3.buffer, value3.buffer);

  let nameSrc = getRandomString(32) + '.db';
  console.info('leveldbTestMerge: Opening DB', nameSrc);
  const dbSrc = new LevelDB(nameSrc, true, true);
  dbSrc.put('keep', 'value');
  dbSrc.put('key2', 'valueNew');
  const value3New = new Uint8Array([7, 8, 9]);
  dbSrc.put(key3.buffer, value3New.buffer);

  dbDst.merge(dbSrc, batchMerge);
  dbSrc.close();

  const errors: string[] = [];
  if (dbDst.getStr('key1') != 'value1') {
    errors.push(`key1 didn't have expected value: ${dbDst.getStr('key1')}`);
  }
  if (dbDst.getStr('key2') != 'valueNew') {
    errors.push(`key2 didn't have expected value: ${dbDst.getStr('key2')}`);
  }
  if (!bufEquals(dbDst.getBuf(key3.buffer)!, value3New)) {
    errors.push(`key3 (buf) didn't have expected value: ${new Uint8Array(dbDst.getBuf(key3.buffer)!)}`);
  }
  if (dbDst.getStr('keep') != 'value') {
    errors.push(`keep didn't have expected value: ${dbDst.getStr('keep')}`);
  }

  dbDst.close();
  return errors;
}

function leveldbTestWriteBatch() {
  let nameDst = getRandomString(32) + '.db';
  console.info('leveldbTestWriteBatch: Opening DB', nameDst);
  const dbDst = new LevelDB(nameDst, true, true);

  const writeBatch = new LevelDBWriteBatch();
  const key1 = new Uint8Array([1, 2, 3]);
  const value1 = new Uint8Array([4, 5, 6]);
  const key2 = new Uint8Array([3, 2, 1]);
  const value2 = new Uint8Array([6, 5, 4]);

  writeBatch.put(key1.buffer, value1.buffer);
  writeBatch.put(key2.buffer, value2.buffer);
  dbDst.write(writeBatch);
  writeBatch.close();

  const errors: string[] = []
  if (!bufEquals(dbDst.getBuf(key1.buffer)!, value1)) {
    errors.push(`leveldbTestWriteBatch: key1 didn't have expected value: ${new Uint8Array(dbDst.getBuf(key1.buffer)!)}`);
  }
  if (!bufEquals(dbDst.getBuf(key2.buffer)!, value2)) {
    errors.push(`leveldbTestWriteBatch: key2 didn't have expected value: ${new Uint8Array(dbDst.getBuf(key2.buffer)!)}`);
  }

  try {
    writeBatch.put(key2.buffer, value2.buffer);
    errors.push(`leveldbTestWriteBatch: FAILED! No exception after close.`);
  } catch(e: any) {
    // Expected an exception
  }

  const writeBatchDelete = new LevelDBWriteBatch();
  writeBatchDelete.delete(key1.buffer);
  writeBatchDelete.delete(key2.buffer);
  dbDst.write(writeBatchDelete);
  writeBatchDelete.close();

  if (dbDst.getBuf(key1.buffer) !== null) {
    errors.push(`leveldbTestWriteBatch: key1 didn't have expected value: ${new Uint8Array(dbDst.getBuf(key1.buffer)!)}`);
  }
  if (dbDst.getBuf(key2.buffer) !== null) {
    errors.push(`leveldbTestWriteBatch: key2 didn't have expected value: ${new Uint8Array(dbDst.getBuf(key2.buffer)!)}`);
  }

  try {
    writeBatch.delete(key2.buffer);
    errors.push(`leveldbTestWriteBatch: FAILED! No exception after close.`);
  } catch(e: any) {
    // Expected an exception
  }

  return errors
}


export function leveldbTests() {
  let s: string[] = [];

  try {
    const res = leveldbTestWriteBatch();
    if (res.length) {
      s.push('leveldbTestWriteBatch() failed with:' + res.join('; '));
    } else {
      s.push('leveldbTestWriteBatch() succeeded');
    }
  } catch (e: any) {
    s.push('leveldbTestWriteBatch() threw: ' + e.message);
  }

  try {
    (global as any).leveldbTestException();
    s.push('leveldbTestException: FAILED! No exception.');
  } catch (e: any) {
    s.push('leveldbTestException: ' + e.message.slice(0, 20));
  }

  try {
    (global as any).leveldbPut(-1);
    s.push('leveldbPut exception (out of range): FAILED! No exception.');
  } catch (e: any) {
    s.push('leveldbPut exception (out of range): ' + e.message.slice(0, 100));
  }

  try {
    const res = leveldbTestMerge(true);
    if (res.length) {
      s.push('leveldbTestMerge(true) failed with:' + res.join('; '));
    } else {
      s.push('leveldbTestMerge(true) succeeded');
    }
  } catch (e: any) {
    s.push('leveldbTestMerge(true) threw: ' + e.message);
  }

  try {
    const res = leveldbTestMerge(false);
    if (res.length) {
      s.push('leveldbTestMerge(false) failed with:' + res.join('; '));
    } else {
      s.push('leveldbTestMerge(false) succeeded');
    }
  } catch (e: any) {
    s.push('leveldbTestMerge(false) threw: ' + e.message);
  }

  return s;
}
