/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */

import { Environment } from './config/Environment';
import ExpressServer from './server/ExpressServer';

// the starting point of the application
const expressServer = new ExpressServer();
expressServer.start(Environment.getPort());
