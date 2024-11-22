import { AppRegistry } from 'react-native';
import App from './App'; // Đảm bảo đường dẫn đến file App đúng
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);