import React from 'react';
import PropTypes from 'prop-types';
import { ConnectedRouter } from 'connected-react-router';
import routes from '../config/routes';


const App = ({ history }) => (
  <ConnectedRouter history={history}>
    {routes}
  </ConnectedRouter>
);

App.propTypes = {
  history: PropTypes.objectOf(PropTypes.any).isRequired,
};

export default App;
