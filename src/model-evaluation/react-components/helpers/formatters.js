/*
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import {isInteger} from 'lodash-es';

export function formatScore(score) {
    let num = Number.parseFloat(score);
    return Number.isNaN(num) ? null : `${(100 * num).toFixed(2)}%`;
}

const dataUnits = [
    "bytes",
    "KB",
    "MB",
    "GB",
    "TB",
    "PB",
    "EB"
];

export function humanFriendlyFilesize(bytes) {
    if(!isInteger(bytes)) {
        return null;
    }
    let value = bytes;
    let unit = 0;
    while(value >= 1024 && (unit < dataUnits.length - 1)) {
        value /= 1024;
        unit++;
    }
    return `${+value.toFixed(2)} ${dataUnits[unit]}`;
}
