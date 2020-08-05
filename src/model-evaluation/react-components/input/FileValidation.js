
import _ from 'lodash-es';

const isSet = _.negate(_.isNil);

export function validateFile(file, constraints = {}) {
    let valid = true;

    if(isSet(constraints.maxLength)) {
        valid = valid && (file.size <= constraints.maxLength);
    }

    if(isSet(constraints.minLength)) {
        valid = valid && (file.size >= constraints.minLength);
    }

    return valid;
}

export { validateFile as default };
