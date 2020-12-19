import * as React from 'react';
import {StyleSheet, View} from 'react-native';
import {benchmarkAsyncStorage, benchmarkLeveldb, BenchmarkResults, BenchmarkResultsView} from "./benchmark";

interface BenchmarkState {
  leveldb?: BenchmarkResults;
  asyncStorage?: BenchmarkResults;
}

export default class App extends React.Component<{}, BenchmarkState> {
  state = {} as BenchmarkState;

  componentDidMount() {
    try {
      this.setState({
        leveldb: benchmarkLeveldb()
      });

      benchmarkAsyncStorage().then(res => this.setState({asyncStorage: res}));
    } catch (e) {
      console.error('Error running benchmark:', e);
    }
  }

  render() {
    return (
      <View style={styles.container}>
        {this.state.leveldb && <BenchmarkResultsView title="LevelDB" {...this.state.leveldb} />}
        {this.state.asyncStorage && <BenchmarkResultsView title="AsyncStorage" {...this.state.asyncStorage} />}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
});
