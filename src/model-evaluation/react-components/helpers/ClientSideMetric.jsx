import React from 'react';
import PropTypes from 'prop-types';

/* global awsmpue */

class ClientSideMetric extends React.PureComponent {
    componentDidMount() {
        const { eventName } = this.props;

        let clientLoggerEvent = eventName; // check eventName: https://w.amazon.com/index.php/ClientSideMetrics/UserDocs/Formulas

        if (eventName === 'cf') {
            clientLoggerEvent = 'ClickToCF';
        } else if (eventName === 'af') {
            clientLoggerEvent = 'ClickToATF';
        }

        if (awsmpue && typeof awsmpue.timeFromNavigationStart === 'function') {
            awsmpue.timeFromNavigationStart(clientLoggerEvent);
        }
    }

    render() {
        return null;
    }
}

ClientSideMetric.PropsType = {
    eventName: PropTypes.string.isRequired
};

export default ClientSideMetric;
