var currentEle = null;
var mouseStart = null;
var newWidth = null;

function calculateWidth(event) {
    var childObj = event.target;
    mouseStart = event.clientX;
    currentEle = childObj;

    event.stopPropagation();
    event.preventDefault();
}

function setNewWidth(event) {
    if (currentEle && currentEle.tagName) {
        var parObj = currentEle;
        while (parObj.parentNode.tagName !== "TH") {
            if (parObj.className === "slds-resizable__handle") {
                currentEle = parObj;
            }
            parObj = parObj.parentNode;
        }

        var oldWidth = parObj.offsetWidth;
        newWidth = oldWidth + (event.clientX - mouseStart);
        currentEle.style.right = oldWidth - newWidth + "px";
    }
}

function resetColumn(event) {
    if (currentEle) {
        var currentEleDiv = currentEle.parentNode.parentNode;
        var parObj = currentEleDiv.parentNode;
        parObj.style.width = newWidth + "px";
        currentEleDiv.style.width = newWidth + "px";
        currentEle.style.right = 0;
        currentEle = null;
    }
}
