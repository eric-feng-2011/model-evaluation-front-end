import React from 'react';

import ClientSideMetric from './ClientSideMetric';

const ClickToCf = props => <ClientSideMetric {...props} eventName="cf" />;

export default ClickToCf;
