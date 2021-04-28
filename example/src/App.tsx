import * as React from 'react';
import {StyleSheet, View, Text} from 'react-native';
import {
  benchmarkAsyncStorage,
  benchmarkLeveldb,
  BenchmarkResults,
  BenchmarkResultsView
} from "./benchmark";
import {leveldbExample} from "./example";

interface BenchmarkState {
  leveldb?: BenchmarkResults;
  leveldbExample?: boolean;
  asyncStorage?: BenchmarkResults;
  error?: string;
}

export default class App extends React.Component<{}, BenchmarkState> {
  state = {} as BenchmarkState;

  componentDidMount() {
    try {
      this.setState({
        leveldb: benchmarkLeveldb(),
        leveldbExample: leveldbExample(),
      });

      benchmarkAsyncStorage().then(res => this.setState({asyncStorage: res}));
    } catch (e) {
      console.error('Error running benchmark:', e);
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <Text>Example validity: {this.state.leveldbExample == undefined ? '' : this.state.leveldbExample ? 'passed' : 'failed'}</Text>
        {this.state.leveldb && <BenchmarkResultsView title="LevelDB" {...this.state.leveldb} />}
        {this.state.asyncStorage && <BenchmarkResultsView title="AsyncStorage" {...this.state.asyncStorage} />}
        {this.state.error && <Text>ERROR RUNNING: {this.state.error}</Text>}
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
