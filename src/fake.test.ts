import {arraybufGt, FakeLevelDB, toArraybuf, toString} from "./fake";

test('arraybufGt', () => {
  expect(arraybufGt(toArraybuf('dbMeta'), toArraybuf('dbMeta'))).toEqual(false);
  expect(arraybufGt(toArraybuf('db.farm'), toArraybuf('dbMeta'))).toEqual(false);
  expect(arraybufGt(toArraybuf('dbMeta'), toArraybuf('db.farm'))).toEqual(true);
  expect(arraybufGt(toArraybuf('dbMeta'), toArraybuf('dbMetaverse'))).toEqual(false);
  expect(arraybufGt(toArraybuf('dbMetaverse'), toArraybuf('dbMeta'))).toEqual(true);

  expect(toString(toArraybuf('dbMeta'))).toEqual('dbMeta');
});


test('FakeLevelDB', () => {
  const db = new FakeLevelDB();
  db.put('dbMeta', 'a');
  expect(db.kv?.map(x => [toString(x[0]), toString(x[1])])).toEqual([['dbMeta', 'a']]);

  db.put('dbMeta', 'b');
  expect(db.kv?.map(x => [toString(x[0]), toString(x[1])])).toEqual([['dbMeta', 'b']]);

  db.put('db.farm.1', 'c');
  expect(db.kv?.map(x => toString(x[0]))).toEqual(['db.farm.1', 'dbMeta'])

  db.put('dbMeta', 'd');
  expect(db.kv?.map(x => toString(x[0]))).toEqual(['db.farm.1', 'dbMeta']);

  db.put('db.farm.0', 'e');
  expect(db.kv?.map(x => toString(x[0]))).toEqual(['db.farm.0', 'db.farm.1', 'dbMeta'])

  db.put('dbMeta', 'f');
  expect(db.kv?.map(x => toString(x[0]))).toEqual(['db.farm.0', 'db.farm.1', 'dbMeta'])

  db.put('dbMetaverse', 'g');
  expect(db.kv?.map(x => toString(x[0]))).toEqual(['db.farm.0', 'db.farm.1', 'dbMeta', 'dbMetaverse'])
  expect(db.getStr('dbMeta')).toEqual('f');
});
