
import React from 'react';
import PropTypes from 'prop-types';
// import { Button } from 'AWS-UI-Components-React';

import {MainContext} from "../ModelEvaluationApp";

import styles from './RawResponse.scss';

export default class RawResponse extends React.PureComponent {
    render() {
        //Try to pretty-print JSON
        let displayValue = this.props.value;
        try {
            displayValue = JSON.stringify(JSON.parse(displayValue), null, 2);
        } catch (e) {
            console.warn("Raw inference response could not be parsed as JSON", this.props.value);
        }

        return <div className={`${styles.rawResponse} awsui-util-container awsui-util-mt-l`}>
            <div className="awsui-util-container-header">
                Detailed model response
            </div>
            <div>
                {this.context.model.productTitle} response:
                <div className={`responseValue ${displayValue ? '' : 'empty'}`}>
                    <textarea rows="13" wrap="off" readOnly value={displayValue} />
                </div>
            </div>
        </div>;
    }
}

RawResponse.contextType = MainContext;

RawResponse.defaultProps = {
    value: null
};

RawResponse.propTypes = {
    value: PropTypes.string
};
