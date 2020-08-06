import React from 'react';
import PropTypes from 'prop-types';
import {kebabCase, isNumber} from "lodash-es";

import styles from './FileUploader.scss';
import {MainContext} from "../ModelEvaluationApp";
import {validateFile} from './FileValidation.js';
import {humanFriendlyFilesize} from "../helpers/formatters";

//Used as a type to distinguish from unhandled exceptions
const Reason = function Reason(name) {
    this.name = name;
    this.toString = () => this.name;
};

export const ErrorReasons = Object.freeze({
    BAD_REQUEST:                new Reason("Bad request"),
    FILE_TOO_LARGE:             new Reason("File is too large"),
    FILE_CONSTRAINTS_ERROR:     new Reason("File constraints error"),
    RATE_LIMITED:               new Reason("Rate limited"),
    UNAUTHENTICATED:            new Reason("Unauthenticated"),
    MODEL_ERROR:                new Reason("Internal model error"),
    SERVER_ERROR:               new Reason("Server error"),
    NETWORK_ERROR:              new Reason("Network error"),
    PARSING_ERROR:              new Reason("Error parsing response"),
    OTHER:                      new Reason("Unknown error")
});

const errorReasonsByCode = Object.freeze({
    400: ErrorReasons.BAD_REQUEST,
    401: ErrorReasons.UNAUTHENTICATED,
    413: ErrorReasons.FILE_TOO_LARGE,
    424: ErrorReasons.MODEL_ERROR,
    429: ErrorReasons.RATE_LIMITED,
    500: ErrorReasons.SERVER_ERROR
});

const defaultConstraints = {
    maxLength: 5 * 1024 * 1024 //5 MB
};

export default class FileUploader extends React.PureComponent {
    constructor() {
        super();

        this.state = {
            dragOverFileInput: false,
            uploading: false
        };

        this.fileInputRef = React.createRef();
        this.getEndpointUrl = this.getEndpointUrl.bind(this);
        this.triggerSelectFile = this.triggerSelectFile.bind(this);
        this.handleDragEvent = this.handleDragEvent.bind(this);
        this.handleFileSelected = this.handleFileSelected.bind(this);
    }

    getEndpointUrl() {
        return process.env.REACT_APP_API_URL + '/ride';
    }

    getFailedReason(response) {
        console.error("Request failed with HTTP status ", response.status, response.statusText);
        return errorReasonsByCode[response.status] || ErrorReasons.OTHER;
    }

    handleDragEvent(isEnter) {
        this.setState({ dragOverFileInput: isEnter });
    }

    handleFileSelected(event) {
        let {files} = event.target;
        if(!files) {
            throw Error("FileList not found for HTMLInputElement");
        }
        if(files.length < 1) {
            console.warn("No file was selected");
            return false;
        }
        const file = files[0];

        const constraints = Object.assign({}, defaultConstraints, this.context.model.inputConstraints);

        //Perform file size and type validations
        if (!validateFile(file, constraints)) {
            //TODO: Get more specific/accurate validation errors
            this.props.onUploadFailed(ErrorReasons.FILE_TOO_LARGE);
            return false;
        }

        //Cancel upload if event consumer returns false
        if(this.props.onFileSelect(file) !== false) {
            this.setState({ uploading: true });
            this.upload(file)
                .then(
                    //Fetch API always resolves promise regardless of response status code.
                    //All non-200 codes are converted to reasons to display better errors.
                    response => (response.ok
                        ? response
                        : Promise.reject(this.getFailedReason(response))
                    ),

                    //fetch operation could not get a response (e.g. network issue)
                    //Convert to Reason and reject promise
                    () => Promise.reject(ErrorReasons.NETWORK_ERROR)
                )

                /**
                 * CAUTION: for this Promise chain to work correctly, there can only be two root-level
                 * catch/onRejected handlers, positioned at the beginning and end of the chain.
                 * Adding other error handlers will break
                 *
                 * Instead, wrap all validations into a promise and reject with a Reason.
                 **/

                //Process JSON parsing errors
                .then(response => response.json()
                    .catch((e) => {
                        console.error("Could not parse response as JSON", e);
                        return Promise.reject(ErrorReasons.PARSING_ERROR);
                    })
                )

                .then(
                    //Success.  Pass result to external response handler
                    (json) => {
                        const json_string = JSON.stringify(json[0]);
                        const update_response = {
                            rawResponse: json_string,
                            standardInference: json
                        };
                        this.props.onUploadResponse(update_response);
                    },

                    //Pass all Reasons to external fail handler
                    //Convert unhandled exceptions to reasons as well
                    (error) => {
                        let reason = error;
                        if(!(error instanceof Reason)) {
                            console.error("Unhandled exception while uploading file.  Details: ", error);
                            reason = ErrorReasons.OTHER;
                        }
                        this.props.onUploadFailed(reason);
                    }
                )
                .finally(() => this.setState({ uploading: false }));
        }
        return false;
    }

    //Can be invoked by consumers of this component: ref.current.triggerSelectFile()
    triggerSelectFile() {
        this.fileInputRef.current.click();
    }

    upload(file) {
        const url = this.getEndpointUrl();

        console.log(process.env.REACT_APP_MVS_INFO);

        return fetch(url,
            {
                method: 'POST',
                headers: {
                    'endpoint-name': process.env.REACT_APP_ENDPOINT_NAME,
                    'mvs-info': process.env.REACT_APP_MVS_INFO
                },
                body: file
            });
    }

    render() {
        const description = this.context.model.inputDescription;
        const mimeTypes = this.context.model.inputMimeTypes;
        const constraints = Object.assign({}, defaultConstraints, this.context.model.inputConstraints);

        const useN = this.props.typeName
            ? /^[aeio]/i.test(this.props.typeName)
            : false;

        const friendlyFileTypes = mimeTypes && mimeTypes
            .map(mime => mime.replace(/.+\//, ''))
            .map(type => <b>{type}</b>) //make it bold
            .flatMap((e, i, arr) => [(arr.length - i - 1) ? ', ' : ' or ', e]).slice(1)
            //eslint-disable-next-line react/no-array-index-key
            .map((node, index) => <React.Fragment key={index}>{node}</React.Fragment>);

        const friendlySizeConstraints = isNumber(constraints.maxLength) &&
            <> be no larger than <b>{humanFriendlyFilesize(constraints.maxLength)}</b></>;

        const constraintsCount = +!!friendlyFileTypes + !!friendlySizeConstraints;

        return (
            <form onSubmit={() => false} className={`${styles.fileUploader} awsui-util-mb-m`}>
                    <label
                        className={
                            `upload-button awsui-button awsui-button-variant-normal awsui-util-mt-s
                             ${this.state.uploading ? 'awsui-button-disabled' : ''}
                             ${this.state.dragOverFileInput ? 'drag-over' : ''}`
                        }
                    >
                        <input type="file" name="file" accept={mimeTypes && mimeTypes.join(', ')}
                            ref={this.fileInputRef}
                            disabled={this.state.uploading}
                            onChange={this.handleFileSelected}
                            onDragEnter={() => this.handleDragEvent(true)}
                            onDragLeave={() => this.handleDragEvent(false)}
                            onDrop={() => this.handleDragEvent(false)}
                        />
                    </label>
            </form>
        );
    }
}

FileUploader.contextType = MainContext;

FileUploader.defaultProps = {
    typeName: 'file',
    onFileSelect: () => {},
    onUploadResponse: () => {},
    onUploadFailed: () => {}
};

FileUploader.propTypes = {
    typeName: PropTypes.string,
    onFileSelect: PropTypes.func,
    onUploadResponse: PropTypes.func,
    onUploadFailed: PropTypes.func
};
