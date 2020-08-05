import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import FileUpload from './FileUpload';
import ModelEvaluationApp from './model-evaluation/react-components/ModelEvaluationApp'
import widgets from './model-evaluation/react-components/inference-widgets';
import * as serviceWorker from './serviceWorker';

/* global model */

console.log("Update 10")

const model = {
    productId: "random productId",
    widget: "ObjectDetection"
};

const WidgetComponent = widgets[model.widget];

ReactDOM.render(
  <ModelEvaluationApp model={model} widget={WidgetComponent}/>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
