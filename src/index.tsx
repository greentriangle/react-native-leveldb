import { NativeModules } from 'react-native';

type LeveldbType = {
  multiply(a: number, b: number): Promise<number>;
};

const { Leveldb } = NativeModules;

export default Leveldb as LeveldbType;
