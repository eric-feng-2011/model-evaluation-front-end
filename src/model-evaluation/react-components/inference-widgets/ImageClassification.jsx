
import React from 'react';

import MainLayout from '../layout/MainLayout';
import ImageBasedInference from './traits/ImageBasedInference';

import {MainContext} from '../ModelEvaluationApp';

export default class ImageClassification extends React.PureComponent {
    //TODO: Enable detail selection

    // constructor(props) {
    //     super(props);
    //
    //     this.state = {
    //         selectedResult: null
    //     };
    //
    //     this.handleResultSelect = this.handleResultSelect.bind(this);
    // }
    //
    // componentDidUpdate() {
    //     //Clear the selected result when responses are cleared
    //     if(!this.context.response && this.state.selectedResult !== null) {
    //         this.setState({ selectedResult: null });
    //     }
    // }
    //
    // handleResultSelect(resultIndex) {
    //     this.setState({ selectedResult: resultIndex });
    // }

    render() {
        const ctxModel = this.context.model;

        return (
            <MainLayout
                contentTitle="Image classification"
                description={
                    <>
                        Try a product demo of the image classification capabilities of <b>{ctxModel.productTitle}</b> by uploading your own image below.
                    </>
                }
            >
                <ImageBasedInference />
                {/*<ImageBasedInference
                    selectedResult={this.state.selectedResult}
                    onResultSelect={this.handleResultSelect}
                />*/}
            </MainLayout>
        );
    }
}

ImageClassification.contextType = MainContext;
