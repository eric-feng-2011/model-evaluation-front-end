import React from 'react';
import PropTypes from 'prop-types';
import RawResponse from "../output/RawResponse";

import { MainContext } from '../ModelEvaluationApp';
import styles from './MainLayout.scss';

export default class MainLayout extends React.Component {
    constructor() {
        super();

        this.state = {
        };
    }

    render() {
        const {model: ctxModel, response} = this.context;

        const refParam = "_ref=modelEvaluation";
        const detailPageUrl = `/marketplace/pp/${ctxModel.listingId}?${refParam}`;
        const subscribePageUrl = `/marketplace/ai/procurement?productId=${ctxModel.productId}&${refParam}`;

        const renderResponse = response
            ? <RawResponse value={response.rawResponse} />
            : null;

        return (
        <div className={styles.mainLayout}>

            <div className="overview">
                <div className="text">
                    <h1>Product demo</h1>

                    <p className="description">
                        {this.props.description || <>
                            Try a product demo of the capabilities of <b>{ctxModel.productTitle}</b>.
                        </>}
                    </p>
                </div>
                <div className="buttons">
                    <button href={subscribePageUrl}>Continue to subscribe</button>
                    <button href={detailPageUrl}>Return to detail page</button>
                </div>
            </div>

            <div className="awsui-util-container awsui-util-mt-l">
                <div className="awsui-util-container-header">
                    {this.props.contentTitle || "Add inference input"}
                </div>
                <div>
                    {this.props.children || "No content :("}

                    <p className="disclaimer">
                        This demo may not accurately represent the actual response times of the product.
                    </p>
                </div>
            </div>
            {renderResponse}
        </div>
        );
    }
}

MainLayout.contextType = MainContext;

MainLayout.defaultProps = {
    description: null,
    contentTitle: null,
    children: null
};

MainLayout.propTypes = {
    description: PropTypes.node,
    contentTitle: PropTypes.node,
    children: PropTypes.node
};
