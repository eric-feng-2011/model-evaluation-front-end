
//TODO: Use dynamic imports.
// Probably best to define separate entry points and load from server-side,
// also extract common chunk to reduce JS load size.

import ImageClassification from './ImageClassification';
import ObjectDetection from './ObjectDetection';
import RawInference from './RawInference';

export default {
    ImageClassification,
    ObjectDetection,
    RawInference
};
