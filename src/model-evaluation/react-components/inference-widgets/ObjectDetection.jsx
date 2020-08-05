
import React from 'react';

import MainLayout from '../layout/MainLayout';
import ImageBasedInference from './traits/ImageBasedInference';
import {formatScore} from "../helpers/formatters";

import {MainContext} from '../ModelEvaluationApp';

const NO_VALUE_CHAR = '-';
const NO_VALUE_LABEL = '(no tag)';
const NO_VALUE_SCORE = 'N/A';

export default class ObjectDetection extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            selectedResult: null
        };

        this.getContextArea = this.getContextArea.bind(this);
        this.drawInferences = this.drawInferences.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleResultSelect = this.handleResultSelect.bind(this);
    }

    componentDidUpdate() {
        //Clear the selected result when responses are cleared
        if(!this.context.response && this.state.selectedResult !== null) {
            console.warn("Clearing results");
            this.setState({ selectedResult: null });
        }
    }

    getClassColor(className) {
        switch(className) {
            case 'OK':
                return 'lawngreen';
            case 'FAIL':
                return 'red';
            default:
                return null;
        }
    }

    /**
     * Retrieves a display name from any tag type (string or map).
     * In case of a map, the _MAIN key is used.
     *
     * See https://quip-amazon.com/PcwoAcOSVJjY#DDM9CA3pUaf
     */
    getTagName(tagNode) {
        if(!tagNode) return null;
        if(typeof tagNode === 'string') {
            return tagNode;
        }
        return tagNode._MAIN || tagNode.toString();
    }

    getObjects() {
        return (this.context.response && this.context.response.standardInference && this.context.response.standardInference.objects) || [];
    }

    getImageScale(imgData, objects) {
        let scaleX = imgData.scale;
        let scaleY = imgData.scale;
        let isPercentageBased = false;

        if (objects.length && objects.every(o => Math.max(o.left, o.right, o.top, o.bottom) <= 1)) {
            //Inference bounding box is percentage-based
            console.info("Detected percentage-based inference response.  Normalizing values...");
            isPercentageBased = true;
            scaleX = imgData.width;
            scaleY = imgData.height;
        }

        return { scaleX, scaleY, isPercentageBased };
    }

    handleMouseMove(mouseX, mouseY, imgData) {
        const objects = this.getObjects();
        let highlightObject = null;

        if(imgData && objects.length > 0) {
            const { scaleX, scaleY } = this.getImageScale(imgData, objects);

            //Mouse coordinates converted to source bitmap coordinates
            const mouseImageX = (mouseX - imgData.x) / scaleX;
            const mouseImageY = (mouseY - imgData.y) / scaleY;

            //Create a list of the inner distance of cursor to any of the object's borders
            //This both finds if the cursor is inside (distance > 0), and the best match to highlight
            const closestBorders = objects
                .map(o => Math.min(mouseImageX - o.left, o.right - mouseImageX, mouseImageY - o.top, o.bottom - mouseImageY));

            //Best object index to highlight or null
            highlightObject = closestBorders
                .reduce((acc, borderDistance, index) => {
                    if(borderDistance >= 0 && borderDistance < acc.closestBorder) {
                        return {index, closestBorder: borderDistance };
                    }
                    return acc;
                }, { index: null, closestBorder: Infinity })
                .index;
        }

        this.setState({ selectedResult: highlightObject });
    }

    handleResultSelect(resultIndex) {
        this.setState({ selectedResult: resultIndex });
    }

    drawInferences(ctx, imgData) {
        if(this.context.response && this.context.response.standardInference) {
            //Styles
            let lineColor = 'white';
            let shadowColor = '#0076FF';
            let shadowBlur = 10;
            let lineWidth = 1.5; //px
            let fontSize = 14; //px
            let textMargin = 5; //px

            ctx.font = `${fontSize}px "Amazon Ember", "Helvetica Neue", Roboto, Arial, sans-serif`;
            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = lineColor;
            ctx.fillStyle = lineColor;
            ctx.shadowBlur = shadowBlur;
            ctx.shadowColor = shadowColor;
            ctx.save();
            ctx.translate(imgData.x, imgData.y); //Set canvas origin to image origin

            const objects = this.getObjects();
            const { scaleX, scaleY } = this.getImageScale(imgData, objects);

            const highlightedIndex = this.state.selectedResult;

            objects.forEach((obj, index) => {
                if(highlightedIndex !== null) {
                    if(index === highlightedIndex) {
                        ctx.globalAlpha = 1;
                    } else {
                        ctx.globalAlpha = 0.2;
                    }
                }

                let customStyle = this.getClassColor(obj.class);

                //Draw outline
                ctx.lineWidth = lineWidth + 1;
                ctx.strokeStyle = customStyle || shadowColor;
                ctx.shadowColor = customStyle || shadowColor;
                ctx.strokeRect(
                    scaleX * obj.left,
                    scaleY * obj.top,
                    scaleX * (obj.right - obj.left),
                    scaleY * (obj.bottom - obj.top)
                );

                //Draw main line
                ctx.lineWidth = lineWidth;
                ctx.strokeStyle = lineColor;
                ctx.strokeRect(
                    scaleX * obj.left,
                    scaleY * obj.top,
                    scaleX * (obj.right - obj.left),
                    scaleY * (obj.bottom - obj.top)
                );

                //Text
                let textX = scaleX * obj.left;
                let textY = scaleY * obj.top - textMargin;

                //Move text within rect if outside of canvas
                if (textY - fontSize < 0) {
                    textY += (2 * textMargin) + (0.8 * fontSize);
                    textX += textMargin;
                }

                ctx.fillText(this.getTagName(obj.tags) || NO_VALUE_LABEL, textX, textY);
            });
            ctx.restore();
        } else {
            console.debug("Draw inferences skipped because there is no response");
        }
    }

    getContextArea() {
        let details = "Click on a row below or an object in the image to view details about the object.";
        const {selectedResult} = this.state;

        if(selectedResult !== null) {
            const result = this.getObjects()[selectedResult];
            if(result) {
                //See https://quip-amazon.com/PcwoAcOSVJjY#DDM9CA3pUaf for details
                const {tags} = result;

                if(tags && typeof tags === "object") {
                    details = <>
                        Confidence: {formatScore(result.score) || NO_VALUE_SCORE}<br />
                        <ul>
                            {Object.entries(tags)
                                .map(([key, value]) => (
                                    (key === "_MAIN")
                                        ? null
                                        : <li key={key}>{key}: {value || NO_VALUE_CHAR}</li>
                                ))
                                .filter(Boolean)
                            }
                        </ul>
                    </>;
                } else {
                    let label;
                    if(tags === null) {
                        label = null;
                    } else if(typeof tags === "string") {
                        label = tags.trim();
                    } else {
                        label = JSON.stringify(tags); //render primitive values
                    }

                    details = <>
                        <strong>Label: {label || NO_VALUE_LABEL}</strong>
                        <ul>
                            <li>Confidence: {formatScore(result.score) || NO_VALUE_SCORE}</li>
                        </ul>
                    </>;
                }
            }
        }

        return <>
            <h4>Object details</h4>
            <div>{details}</div>
        </>;
    }

    render() {
        const {response, model: ctxModel} = this.context;

        let contextArea = response
            ? this.getContextArea()
            : " "; //Render blank area (instead of no area)

        return (
            <MainLayout
                contentTitle="Object detection"
                description={
                    <>
                        Try a product demo of the object detection capabilities of <b>{ctxModel.productTitle}</b> by uploading your own image below.
                    </>
                }
            >
                <ImageBasedInference
                    resultsTitle="Objects identified in image"
                    contextArea={contextArea}
                    selectedResult={this.state.selectedResult}
                    onResultSelect={this.handleResultSelect}
                    onDraw={this.drawInferences}
                    onMouseMove={this.handleMouseMove}
                />
            </MainLayout>
        );
    }
}

ObjectDetection.contextType = MainContext;
