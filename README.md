# React Native Pullable View

[![npm](https://img.shields.io/npm/v/react-native-pullable-view.svg)](https://www.npmjs.com/package/react-native-pullable-view)
[![GitHub issues](https://img.shields.io/github/issues/xotahal/react-native-pullable-view.svg)](https://github.com/xotahal/react-native-pullable-view/issues)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/xotahal/react-native-pullable-view/master/LICENSE)

Implements component similar to calendar that you know from Calendar App by Google - you can pull down this calendar from toolbar. 


## Install

```
npm i react-native-pullable-view --save
```

## Usage

```js
<Pullable pullView={() => <View><Text>This view will be pulled down!</Text></View>}>
  <View>
    <Text>This view will be always shown on the screen</Text>
  </View>
</Pullable>
```
