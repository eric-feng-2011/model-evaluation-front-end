export function emitClickEvent(clickFeat, clickObj, clickSelec = '000', clickAct = "Select", purpose = "BusinessReporting") {
    // Doc explaining these values:
    // https://quip-amazon.com/AvaBACDiMsIA
    window.awsmpue
        .setDimensions([
            {name: "ClickFeat", value: clickFeat},
            {name: "ClickObj", value: clickObj},
            {name: "ClickSelec", value: clickSelec},
            {name: "ClickAct", value: clickAct},
            {name: "Purpose", value: purpose}
        ])
        .metric("Click", "Count", 1);
}

export function logBreadcrumbClick(event) {
    setTimeout(() => {
        emitClickEvent("Breadcrumbs", event.detail.text);
    });
}

export function getSelectChangeLogger(clickFeat, clickObj) {
    return (event) => {
        setTimeout(() => {
            emitClickEvent(clickFeat, clickObj, event.detail.selectedOption.id);
        });
    };
}

export function emitClickEventAsync(clickFeat, clickObj, clickSelec = '000') {
    // Doc explaining these values:
    // https://quip-amazon.com/AvaBACDiMsIA
    setTimeout(() => {
        emitClickEvent(clickFeat, clickObj, clickSelec);
    });
}

export function getAsyncClickLogger(clickFeat, clickObj) {
    return () => {
        setTimeout(() => {
            emitClickEvent(clickFeat, clickObj);
        });
    };
}
