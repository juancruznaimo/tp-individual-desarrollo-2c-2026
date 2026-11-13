import { AppRegistry } from 'react-native';

import App from './App';

// Punto de entrada al estilo React Native: react-native-web monta la app en #root.
AppRegistry.registerComponent('AITicketIt', () => App);
AppRegistry.runApplication('AITicketIt', {
  rootTag: document.getElementById('root'),
});
