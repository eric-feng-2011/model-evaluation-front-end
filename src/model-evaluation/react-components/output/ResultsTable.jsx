
/*
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import _ from 'lodash-es';
import React from 'react';
import PropTypes from 'prop-types';
// import { Table, TableSelection } from 'AWS-UI-Components-React';
import {emitClickEventAsync} from '../helpers/CommonClickLogging';
import {formatScore} from '../helpers/formatters';

import {MainContext} from "../ModelEvaluationApp";

import './ResultsTable.scss';

const NO_VALUE_CHAR = '−';

export default class ResultsTable extends React.PureComponent {
    constructor(props) {
        super(props);

        this.handleResultSelect = this.handleResultSelect.bind(this);
        this.handleTableResultSelect = this.handleTableResultSelect.bind(this);
    }

    /**
     * Retrieves a display name from any inference item.
     * Multi-valued tags should define a _MAIN property to be displayed.
     *
     * Schema details: https://quip-amazon.com/PcwoAcOSVJjY#DDM9CAD9tYX
     */
    getTagName(item) {
        if(!item) return null;
        let tags = item.tags ? item.tags : item;
        if(typeof tags === 'string') {
            return tags;
        }
        let value;
        if("_MAIN" in tags) { //Read designated label if present
            value = tags._MAIN;
        } else if("value" in tags) { //Use value in key/value tags
            value = tags.value;
        } else {
            value = tags;
        }

        if(value === null) return null;
        if(typeof value === "string") {
            return value.trim();
        }
        return JSON.stringify(value);
    }

    //Handler for the highlight links
    handleResultSelect(index) {
        this.props.onResultSelect(index);
    }

    handleResultSelectWithLogger(index) {
        this.props.onResultSelect(index);
        emitClickEventAsync("Usage", "Highlight In Image");
    }

    //Handler for Polaris TableSelection onSelectionChange event
    handleTableResultSelect({detail: {selectedItems}}) {
        const newIndex = _.get(selectedItems, ['0', 'index'], null);
        if(newIndex !== null) { //Don't allow table to unselect
            this.props.onResultSelect(newIndex);
        }
    }

    render() {
        const standardInference = _.get(this.context, ['response', 'standardInference']) || {};
        const inferenceTags = standardInference.objects || standardInference.tags || [];
        const indexedItems = inferenceTags.map((item, index) => ({item, index}));

        const hasScores = !inferenceTags.length || inferenceTags.some(item => item.hasOwnProperty('score'));
        const hasKeys = inferenceTags.some(item => item.hasOwnProperty('key'));
        const hasResultSelector = (this.props.selectedResult !== false); //must do strict comparison

        return <div className={`results-table ${this.props.className}`}>
            <h4>{this.props.title}</h4>
{/*             <Table */}
{/*                 empty="No results" */}
{/*                 items={indexedItems} */}
{/*                 features={hasResultSelector ? ['selection'] : []} */}
{/*                 columnDefinitions={[ */}
{/*                     hasKeys && { */}
{/*                         id: 'tagKey', */}
{/*                         header: 'Class', */}
{/*                         cell: ({item}) => item.key || NO_VALUE_CHAR */}
{/*                     }, */}
{/*                     { */}
{/*                         id: 'tagValue', */}
{/*                         header: hasKeys ? 'Value' : 'Tag', */}
{/*                         cell: ({item}) => this.getTagName(item) || NO_VALUE_CHAR */}
{/*                     }, */}
{/*                     hasScores && { */}
{/*                         id: 'score', */}
{/*                         header: 'Confidence', */}
{/*                         cell: ({item}) => formatScore(item.score) || NO_VALUE_CHAR */}
{/*                     }, */}
{/*                     hasResultSelector && { */}
{/*                         id: 'actions', */}
{/*                         header: 'Actions', */}
{/*                         cell: ({index}) => */}
{/*                             //eslint-disable-next-line jsx-a11y/anchor-is-valid */}
{/*                             <a role="button" tabIndex="-1" */}
{/*                                 onMouseOver={() => this.handleResultSelect(index)} */}
{/*                                 onFocus={() => this.handleResultSelectWithLogger(index)} */}
{/*                             > */}
{/*                                 Highlight in image */}
{/*                             </a> */}
{/*                     } */}
{/*                 ].filter(Boolean)} */}
{/*             > */}
{/*                 {hasResultSelector && <TableSelection */}
{/*                     selectionType="single" */}
{/*                     selectedItems={this.props.selectedResult === null ? [] : [indexedItems[this.props.selectedResult]]} */}
{/*                     onSelectionChange={this.handleTableResultSelect} */}
{/*                 />} */}
{/*             </Table> */}
        </div>;
    }
}

ResultsTable.contextType = MainContext;

ResultsTable.defaultProps = {
    title: 'Results',
    className: null,
    selectedResult: false,
    onResultSelect: () => {}
};

ResultsTable.propTypes = {
    title: PropTypes.string,
    className: PropTypes.string,
    selectedResult: PropTypes.oneOfType([
        PropTypes.number, //Set to a result index to select it or null if none is selected
        PropTypes.oneOf([false]) //Set to false to disable selection functionality
    ]),
    onResultSelect: PropTypes.func //Invoked with (resultIndex)
};
