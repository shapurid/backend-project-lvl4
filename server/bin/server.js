#!/usr/bin/env node
import Rollbar from 'rollbar';
import getApp from '..';

const { ROLLBAR: accessToken, PORT: port = 5000 } = process.env;

const rollbar = new Rollbar({
  accessToken,
  captureUncaught: true,
  captureUnhandledRejections: true,
});

const address = '0.0.0.0';

getApp().listen(port, address, (err) => {
  console.log(`Server is running on port: ${port}`);
  if (err) {
    rollbar.log(err);
  }
});
