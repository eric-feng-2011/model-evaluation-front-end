
/*
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import React from 'react';
import PropTypes from "prop-types";

import FileUploader, {ErrorReasons} from '../../input/FileUploader';
import ImageRenderer, {RendererError} from '../../output/ImageRenderer';

import {MainContext} from '../../ModelEvaluationApp';

import styles from './ImageBasedInference.scss';
import ResultsTable from "../../output/ResultsTable";

const Statuses = Object.freeze({
    INITIAL: "initial",
    UPLOADING: "uploading",
    FAILED: "failed",
    INFERENCE_COMPLETE: "inferenceComplete"
});

const ErrorSource = Object.freeze({
    IMAGE_RENDERER: "Image renderer",
    FILE_UPLOADER: "File uploader"
});

export default class ImageBasedInference extends React.PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            file: null,
            status: Statuses.INITIAL,
            failReason: null,
            failSource: null
        };

        this.fileSelectorRef = React.createRef();

        this.triggerFileSelector = this.triggerFileSelector.bind(this);
        this.handleFileSelect = this.handleFileSelect.bind(this);
        this.handleUploadResponse = this.handleUploadResponse.bind(this);
        this.handleUploadFailed = this.handleUploadFailed.bind(this);
        this.handleBitmapError = this.handleBitmapError.bind(this);
    }

    getOverlay() {
        //TODO: Improve error messages
        switch (this.state.status) {
            //no overlay
            case Statuses.INITIAL:
            case Statuses.INFERENCE_COMPLETE:
                return null;

            //show uploading
            case Statuses.UPLOADING:
                return <span>Uploading</span>;

            //something failed
            case Statuses.FAILED:
            default:
                switch (this.state.failReason) {
                    case ErrorReasons.BAD_REQUEST:
                    case ErrorReasons.FILE_CONSTRAINTS_ERROR:
                        return <>The provided image is not supported by this model. Try using a different one.</>;

                    case ErrorReasons.MODEL_ERROR:
                        return <>The model could not process your image, try using a different one.</>;

                    case ErrorReasons.FILE_TOO_LARGE:
                        return <>The selected image is too large.<br />Please check file size.</>;

                    case ErrorReasons.RATE_LIMITED:
                        return <>You have reached the maximum number of requests allowed for this demo.<br />Please try again later.</>;

                    case ErrorReasons.UNAUTHENTICATED:
                        return <>Your session has expired, please reload the page</>;

                    case ErrorReasons.SERVER_ERROR:
                        return <>Request failed.  Please try again later</>;

                    case ErrorReasons.NETWORK_ERROR:
                        return <>Could not upload image due to a network error. Please check your connection and try again.</>;

                    case RendererError.BITMAP_PARSE_ERROR:
                        return <>The selected image is not supported by your browser.<br />You may still see results below.</>;

                    case ErrorReasons.PARSING_ERROR:
                    case ErrorReasons.OTHER:
                    default:
                        return <>Upload or inference failed. Please try again later</>;
                }
        }
    }

    handleFileSelect(file) {
        this.context.updateResponse(null);
        this.setState({ file, status: Statuses.UPLOADING, failReason: null, failSource: null });
        return true;
    }

    handleUploadResponse(response) {
        this.context.updateResponse(response);
        this.setState((prevState) => {
            //Keep other errors if present
            if(prevState.failSource && prevState.failSource !== ErrorSource.FILE_UPLOADER) {
                return null;
            }
            return { status: Statuses.INFERENCE_COMPLETE, failReason: null };
        });
    }

    handleUploadFailed(reason) {
        this.setState({
            status: Statuses.FAILED,
            failReason: reason,
            failSource: ErrorSource.FILE_UPLOADER
        });
    }

    handleBitmapError(reason) {
        this.setState((prevState) => {
            //Server errors take precedence
            if(prevState.failSource === ErrorSource.FILE_UPLOADER) {
                return null;
            }
            return {
                status: Statuses.FAILED,
                failReason: reason,
                failSource: ErrorSource.IMAGE_RENDERER
            };
        });
    }

    triggerFileSelector() {
        this.fileSelectorRef.current.triggerSelectFile();
    }

    render() {
        const ctx = this.context;
        const overlay = this.getOverlay();

        //This simple pseudo-hash is enough to re-render when necessary.
        const reRenderKey = `response:${!!ctx.response}|selected:${this.props.selectedResult}`;

        const imageRenderer =
            <ImageRenderer
                placeholder={
                    <>
                        {/* Dont't need Aria features for secondary redundant button */}
                        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
                        To get started, <span className="action-link" onClick={this.triggerFileSelector}>upload an image</span>
                    </>
                }
                overlay={overlay}
                imageFile={this.state.file}
                onDraw={this.props.onDraw}
                onBitmapError={this.handleBitmapError}
                onMouseMove={this.props.onMouseMove}
                reRenderKey={reRenderKey}
            />;

        //Any non-null value (even empty string) is considered as a response.
        //This is to display the "no results" UI in case the model has an empty response
        //and the standard inference failed to provide a default value.
        const receivedResponse = !!ctx.response && (
            ctx.response.rawResponse !== null || ctx.response.standardInference !== null
        );

        console.log("Received Response bool: ", receivedResponse);

        const results = receivedResponse &&
            <ResultsTable
                title={this.props.resultsTitle}
                className="awsui-util-mt-m"
                onResultSelect={this.props.onResultSelect}
                selectedResult={this.props.selectedResult}
            />;

        return (
            <div className={styles["image-inference"]}>
                <FileUploader typeName="image"
                    ref={this.fileSelectorRef}
                    onFileSelect={this.handleFileSelect}
                    onUploadResponse={this.handleUploadResponse}
                    onUploadFailed={this.handleUploadFailed}
                />

                {this.props.contextArea
                    ? (
                        <div className="image-and-context">
                            <div className="main-area">
                                {imageRenderer}
                                {results}
                            </div>
                            <div className="context-area">{this.props.contextArea}</div>
                        </div>
                    ) : (
                        <>
                            {imageRenderer}
                            {results}
                        </>
                    )
                }
                <span> Image based inference </span>
            </div>
        );
    }
}

ImageBasedInference.contextType = MainContext;

ImageBasedInference.defaultProps = {
    contextArea: null,
    resultsTitle: "Inference results",
    selectedResult: false,
    onDraw: () => {},
    onMouseMove: null,
    onResultSelect: () => {}
};

ImageBasedInference.propTypes = {
    contextArea: PropTypes.node,
    resultsTitle: PropTypes.string,
    selectedResult: PropTypes.oneOfType([
        PropTypes.number, //Set to a result index to select it or null if none is selected
        PropTypes.oneOf([false]) //Set to false to disable selection functionality
    ]),
    onDraw: PropTypes.func, //Invoked with (context, imageData={x, y, width, height, scale})
    onMouseMove: PropTypes.func, //Invoked with (mouseX, mouseY, imageData={x, y, width, height, scale})
    onResultSelect: PropTypes.func //Invoked with (resultIndex)
};
