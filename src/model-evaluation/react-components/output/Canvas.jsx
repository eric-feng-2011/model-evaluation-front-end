/*
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import _throttle from "lodash-es/throttle";
import React from 'react';
import PropTypes from 'prop-types';

export default class Canvas extends React.PureComponent {
    constructor(props) {
        super(props);

        //a cache of the bitmap dimensions and calculated scaling
        this.imageRenderData = null;
        this.bitmap = null;
        this.lastWidth = null;
        this.lastMouseX = null;
        this.lastMouseY = null;
        this.lastAnimationFrame = false;

        this.canvasRef = React.createRef();
        this.renderCanvas = this.renderCanvas.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.processMouseMoved = this.processMouseMoved.bind(this);
        this.handleWindowResize = _throttle(this.handleWindowResize.bind(this), 200);
    }

    componentDidMount() {
        this.lastWidth = this.props.width || this.canvasRef.current.clientWidth;
        this.renderCanvas();
        window.addEventListener("resize", this.handleWindowResize);
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.handleWindowResize);
    }

    componentDidUpdate(prevProps) {
        if(prevProps.image !== this.props.image) {
            console.debug("ComponentDidUpdate: rendering canvas because image changed from ", prevProps.image, " to ", this.props.image);
            this.bitmap = null;
        } else if(prevProps.reRenderKey !== this.props.reRenderKey) {
            console.debug("ComponentDidUpdate: rendering canvas because reRenderKey changed from ", prevProps.reRenderKey, " to ", this.props.reRenderKey);
        } else {
            //TODO: Investigate re-renders
            console.warn("Neither file nor reRenderKey have changed; possibly unnecessary render");
        }

        this.renderCanvas();
    }

    handleWindowResize() {
        const newWidth = this.props.width || this.canvasRef.current.clientWidth;
        if(this.lastWidth !== newWidth) {
            console.debug("HandleWindowResize: rendering canvas because its width changed from ", this.lastWidth, " to ", newWidth);
            this.lastWidth = newWidth;
            this.renderCanvas();
        }
    }

    handleMouseMove(e) {
        this.lastMouseX = e.nativeEvent.offsetX;
        this.lastMouseY = e.nativeEvent.offsetY;
        if(this.lastAnimationFrame) {
            cancelAnimationFrame(this.lastAnimationFrame);
        }
        this.lastAnimationFrame = requestAnimationFrame(this.processMouseMoved);
    }

    processMouseMoved() {
        //Only re-render if event consumer returns true.
        if(this.props.onMouseMove(this.lastMouseX, this.lastMouseY, this.imageRenderData)) {
            console.warn("Re-rendered as per consumer event!.  This is fine but unexpected");
            this.renderCanvas();
        }
    }

    toImageBitmap(imageFile) {
        //Can't use createImageBitmap because it doesn't respect image orientation for Files
        //See https://bugs.chromium.org/p/chromium/issues/detail?id=1069965
        return new Promise((resolve) => {
            let dataURL;
            if (imageFile instanceof Blob) {
                dataURL = URL.createObjectURL(imageFile);
            } else {
                throw new Error('Cannot handle the provided image source type');
            }
            const img = document.createElement('img');
            img.addEventListener('load', () => resolve(img));
            img.src = dataURL;
        });
    }

    async renderCanvas() {
        console.debug("Rendering canvas...  Investigate if it seems excessive");
        const canvas = this.canvasRef.current;
        const context = canvas.getContext('2d');

        const canvasWidth = this.props.width || canvas.clientWidth;
        const useMaxHeight = this.props.maxHeight != null;
        let imageRenderData;

        if(this.props.image) {
            try {
                if(!this.bitmap) console.debug("Calculating bitmap...");
                const bitmap = this.bitmap || await this.toImageBitmap(this.props.image);
                this.bitmap = bitmap;
                let imageScale = canvasWidth / bitmap.width;
                let canvasHeight = imageScale * bitmap.height;

                imageRenderData = {
                    x: 0,                 //Left image offset in canvas
                    y: 0,                 //Top image offset in canvas
                    width: canvasWidth,   //Rendered width of the image
                    height: canvasHeight, //Rendered height of the image
                    scale: imageScale     //How large is rendered image compared to source bitmap
                };

                if(useMaxHeight && (imageScale * bitmap.height > this.props.maxHeight)) {
                    //Image is taller than allowed, scale according to height instead
                    imageScale = this.props.maxHeight / bitmap.height;
                    imageRenderData.scale = imageScale;
                    imageRenderData.width = imageScale * bitmap.width;
                    imageRenderData.x = (canvasWidth - imageRenderData.width) / 2;
                    imageRenderData.height = this.props.maxHeight;
                    canvasHeight = imageRenderData.height;
                }

                canvas.width = canvasWidth;
                canvas.height = canvasHeight;

                context.clearRect(0, 0, canvas.width, canvas.height);
                context.drawImage(
                    bitmap,
                    imageRenderData.x,
                    imageRenderData.y,
                    imageRenderData.width,
                    imageRenderData.height
                );
            } catch (e) {
                //Reset canvas
                canvas.width = canvasWidth;
                canvas.height = Math.min(canvasWidth / 2, this.props.maxHeight || canvas.clientHeight);
                context.clearRect(0, 0, canvas.width, canvas.height);
                console.error("Could not parse bitmap from given file.", e);
                this.props.onError(e);
                throw e;
            }
        } else {
            let canvasHeight = Math.min(canvas.clientHeight, this.props.maxHeight || canvas.clientHeight);
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;

            context.clearRect(0, 0, canvas.width, canvas.height);
        }

        //Store imageRenderData for use in mouse move events
        this.imageRenderData = imageRenderData;

        //Draw the rest
        this.props.onDraw(context, imageRenderData);
    }

    render() {
        return <canvas ref={this.canvasRef} onMouseMove={this.props.onMouseMove && this.handleMouseMove} />;
    }
}

Canvas.defaultProps = {
    image: null,
    maxHeight: null,
    width: null,
    onDraw: () => {},
    onError: () => {},
    onMouseMove: null,
    reRenderKey: null
};

Canvas.propTypes = {
    image: PropTypes.instanceOf(Blob),
    maxHeight: PropTypes.number,
    width: PropTypes.number,
    onDraw: PropTypes.func, //Invoked with (context, imageData={x, y, width, height, scale})
    onError: PropTypes.func, //Invoked when bitmap cannot be decoded
    onMouseMove: PropTypes.func, //Invoked with (mouseX, mouseY, imageData={x, y, width, height, scale})

    //This prop triggers a re-render whenever it changes; the value is not used otherwise.
    //It really needs to be of 'any' type, so we make an exception
    //eslint-disable-next-line react/forbid-prop-types
    reRenderKey: PropTypes.any
};
