# react-native-leveldb
Sponsored by ![GreenTriangle](https://www.green-triangle.com/wp-content/uploads/2018/08/cropped-GreenTriangle-01-4.png)

Superfast React Native bindings for LevelDB:
* 2-7x faster than AsyncStorage or react-native-sqlite-storage - try the benchmarks under example/!
* completely synchronous, blocking API (even on slow devices, a single read or write takes 0.1ms)
* use it with Flatbuffers to turbo charge your app - support for binary data via ArrayBuffers 

## Installation

```sh
yarn add react-native-leveldb
cd ios && pod install
```

## Usage

```ts
import {LevelDB} from "react-native-leveldb";

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

```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT
