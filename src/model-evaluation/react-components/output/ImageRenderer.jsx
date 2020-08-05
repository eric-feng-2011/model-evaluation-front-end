/*
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import React from 'react';
import PropTypes from 'prop-types';

import Canvas from "./Canvas";

import styles from './ImageRenderer.scss';

export const RendererError = Object.freeze({
    BITMAP_PARSE_ERROR: "Could not parse bitmap file"
});

export default function ImageRenderer(props) {
    const {placeholder, overlay} = props;
    const hasImage = !!props.imageFile;
    const content = overlay || (hasImage ? overlay : placeholder);

    return (
        <div className={styles["image-renderer"]}>
            <Canvas image={props.imageFile}
                maxHeight={800}
                onDraw={props.onDraw}
                onError={ex => props.onBitmapError(RendererError.BITMAP_PARSE_ERROR, ex)}
                onMouseMove={props.onMouseMove}
                reRenderKey={props.reRenderKey}
            />

            {content &&
                <div className={`info-container ${hasImage ? 'overlay' : 'placeholder'}`}>
                    <div className="content">{content}</div>
                </div>
            }
        </div>
    );
}

ImageRenderer.defaultProps = {
    imageFile: null,
    overlay: null,
    placeholder: "(no image)",
    onDraw: () => {},
    onBitmapError: () => {},
    onMouseMove: null,
    reRenderKey: null
};

ImageRenderer.propTypes = {
    imageFile: PropTypes.instanceOf(File),
    overlay: PropTypes.node,
    placeholder: PropTypes.node,
    onDraw: PropTypes.func,
    onBitmapError: PropTypes.func,
    onMouseMove: PropTypes.func,

    //This prop triggers a re-render whenever it changes; the value is not used otherwise.
    //It really needs to be of 'any' type, so we make an exception
    //eslint-disable-next-line react/forbid-prop-types
    reRenderKey: PropTypes.any
};
