import React from 'react';
import PropTypes from 'prop-types';

/* global model */

export const MainContext = React.createContext({
    //Placeholder values
    model: {
        productId: null,
        widget: null
    },
    response: {
        rawResponse: '',
        standardInference: []
    },
    updateResponse: () => {}
});

export default class ModelEvaluationApp extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            response: null
        };

        this.updateResponse = this.updateResponse.bind(this);
    }

    updateResponse(new_response) {
        console.debug("Old response: ", this.state.response);
        console.debug("Inference response: ", new_response);
        this.setState({
            response: new_response
        });
    }

    render() {
        const WidgetComponent = this.props.widget;

        const context = {
            model: this.props.model,
            response: this.state.response,
            updateResponse: this.updateResponse
        };

        return <MainContext.Provider value={context}>
            <div className="model-evaluation-app">
                {/* Header */}
                <div className="header">
                    <div className="page-container">
                        <section className="logo">
                            <img alt="Product logo" src={this.props.productLogoUrl} />
                        </section>
                        <section className="title">
                            <h2>{this.props.productTitle}</h2>
                        </section>
                    </div>
                </div>

                {/* Content */}
                <div className="awsui-util-pt-m page-container">
                    <WidgetComponent />
                </div>
            </div>
        </MainContext.Provider>;
    }
}

ModelEvaluationApp.defaultProps = {
    productTitle: null,
    productLogoUrl: null
};

ModelEvaluationApp.propTypes = {
    productTitle: PropTypes.string,
    productLogoUrl: PropTypes.string,

    widget: PropTypes.elementType.isRequired
};
