import * as React from 'react';
import { StyleSheet, View, TextInput } from 'react-native';
import { LevelDB } from 'react-native-leveldb';

export default class App extends React.Component {
  private db: LevelDB = new LevelDB('test.db', true, false);

  render() {
    return (
      <View style={styles.container}>
        <TextInput />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
