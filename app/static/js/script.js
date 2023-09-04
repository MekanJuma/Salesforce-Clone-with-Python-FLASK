var isMultiSelectInitialized = false;

var currentData = {
    fields: [],
    records: [],
    sort: null,
    sortAsc: true,
};

const fieldMapping = {
    Account: [
        { label: "Account Name", apiName: "Name", placeholder: "Account Name" },
        {
            label: "Account Number",
            apiName: "AccountNumber",
            placeholder: "Account Number",
        },
        { label: "Phone", apiName: "Phone", placeholder: "Phone" },
        {
            label: "Account Site",
            apiName: "Site",
            placeholder: "Account Site",
        },
    ],
    Contact: [
        {
            label: "First Name",
            apiName: "FirstName",
            placeholder: "First Name",
        },
        { label: "Last Name", apiName: "LastName", placeholder: "Last Name" },
        { label: "Phone", apiName: "Phone", placeholder: "Phone" },
        {
            label: "Account Name",
            apiName: "AccountId",
            placeholder: "Account Name",
        },
    ],
};

function searchSalesforceRecords(objectName, query) {
    const endpoint = `/api/search_records?q=${encodeURIComponent(
        query
    )}&objectname=${encodeURIComponent(objectName)}`;

    fetch(endpoint)
        .then((response) => response.json())
        .then((data) => {
            $("#account-dropwdown").addClass("slds-is-open");

            let dropdownHtml;
            if (data.length > 0) {
                let OBJECT_ICON =
                    objectName == "Account" ? ACCOUNT_SVG_URL : CONTACT_SVG_URL;
                console.log("Query data", data);
                dropdownHtml = data
                    .map(
                        (record) => `
                    <li role="presentation" class="slds-listbox__item">
                        <div id="${
                            record.id
                        }" class="slds-media slds-listbox__option slds-listbox__option_entity slds-listbox__option_has-meta" role="option">
                            <span class="slds-media__figure slds-listbox__option-icon">
                            
                                <span class="slds-icon_container slds-icon-standard-${objectName.toLowerCase()}">
                                    <img
                                        aria-hidden="true"
                                        class="slds-icon slds-icon_small"
                                        src="${OBJECT_ICON}"
                                    />
                                </span>
                            </span>
                            <span class="slds-media__body">
                                <span class="slds-listbox__option-text slds-listbox__option-text_entity">${
                                    record.name
                                }</span>
                                <span class="slds-listbox__option-meta slds-listbox__option-meta_entity">${
                                    record.description
                                }</span>
                            </span>
                        </div>
                    </li>
                `
                    )
                    .join("");
            } else {
                dropdownHtml = `
                    <li role="presentation" class="slds-listbox__item">
                        <div class="slds-media slds-listbox__option slds-listbox__option_plain slds-listbox__option_has-meta" role="option">
                            <span class="slds-media__body">
                                <span class="slds-listbox__option-text slds-listbox__option-text_entity">No result for '${query}'</span>
                            </span>
                        </div>
                    </li>
                `;
            }
            appendToDropdown(dropdownHtml);
        })
        .catch((error) => {
            console.error("Error fetching records:", error);
        });
}

function saveRecord() {
    let objectName = fetchActiveMenuItem();
    values = getFormValues(objectName);
    console.log(values);
    fetch("/api/create_record", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            objectName: objectName,
            fields: values,
        }),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then((data) => {
            console.log(data);
            if (data.status_custom === "success") {
                console.log("Record created with ID:", data.id);
                displayToast("success", data.message);
                fetchDataForObject(objectName);
                closeRecordModal();
            } else {
                let msg =
                    data.message == null || data.message == undefined
                        ? "Failed to create record"
                        : data.message;
                displayToast("error", msg);
                console.error("Failed to create record:", msg);
            }
        })
        .catch((error) => {
            displayToast("error", "An unexpected error occurred.");
            console.error("Error:", error);
        });
}

function displayToast(type, message) {
    $("#success-toast, #error-toast").hide();

    if (type === "success") {
        $("#success-toast").find("#toast-msg").text(message);
        $("#success-toast").fadeIn();
    } else if (type === "error") {
        $("#error-toast").find("#toast-msg").text(message);
        $("#error-toast").fadeIn();
    }

    setTimeout(() => {
        $("#success-toast, #error-toast").fadeOut();
    }, 5000);
}

function getFormValues(objectName) {
    let fields = fieldMapping[objectName];
    let values = {};

    for (let i = 0; i < fields.length; i++) {
        let fieldElement = $("#form-element-" + i);

        if (fields[i].apiName === "AccountId") {
            let accountField = $("#combobox-accountid");
            values["AccountId"] = accountField.attr("data-id");
        } else {
            values[fields[i].apiName] = fieldElement.val();
        }
    }

    return values;
}

function fetchActiveMenuItem() {
    let activeMenuItem = $(
        ".slds-context-bar__item.slds-is-active .menu-items"
    );
    if (activeMenuItem.length) {
        let objectName = activeMenuItem.data("object");
        return objectName;
    }
    return null;
}

function debounce(func, wait, immediate) {
    var timeout;
    return function () {
        var context = this,
            args = arguments;
        var later = function () {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

function appendToDropdown(dropdownHtml) {
    const dropdownContainer = document.querySelector(
        "#listbox-accountid ul.slds-listbox"
    );
    dropdownContainer.innerHTML = dropdownHtml;

    const options = dropdownContainer.querySelectorAll(".slds-media");
    options.forEach((option) => {
        option.addEventListener("click", handleOptionClick);
    });
}

function handleOptionClick(event) {
    const clickedOption = event.currentTarget;
    const accountId = clickedOption.getAttribute("id");
    console.log("Account Id", accountId);
    const accountName = clickedOption.querySelector(
        ".slds-listbox__option-text_entity"
    ).textContent;

    const inputField = document.getElementById("combobox-accountid");
    inputField.value = accountName;
    inputField.setAttribute("data-id", accountId);

    const dropdownContainer = document.querySelector("#account-dropwdown");
    dropdownContainer.classList.remove("slds-is-open");
}

function generateFormContent(objectName) {
    let fields = fieldMapping[objectName];
    let htmlContent =
        '<div class="slds-modal__content slds-p-around_medium" style="height: 400px;" id="modal-content-id-1">';

    for (let i = 0; i < fields.length; i += 2) {
        htmlContent += '<div class="slds-grid slds-gutters">';
        for (let j = 0; j < 2; j++) {
            if (fields[i + j]) {
                if (fields[i + j].apiName === "AccountId") {
                    htmlContent += `
                    <div class="slds-col">
                        <div class="slds-form-element">
                            <label class="slds-form-element__label" for="combobox-id-${
                                i + j
                            }" id="combobox-label-id-${i + j}">Account</label>
                            <div class="slds-form-element__control">
                                <div class="slds-combobox_container">
                                    <div id="account-dropwdown" class="slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click">
                                        <div class="slds-combobox__form-element slds-input-has-icon slds-input-has-icon_right" role="none">
                                            <input type="text" class="slds-input slds-combobox__input" id="combobox-accountid" aria-autocomplete="list" aria-controls="listbox-id-${
                                                i + j
                                            }" aria-expanded="false" aria-haspopup="listbox" autoComplete="off" role="combobox" placeholder="Search..." />
                                            <span class="slds-icon_container slds-icon-utility-search slds-input__icon slds-input__icon_right">
                                                <img
                                                aria-hidden="true"
                                                class="slds-icon slds-icon slds-icon_x-small slds-icon-text-default"
                                                src="${SEARCH_SVG_URL}"
                                            />
                                        </div>
                                        <div id="listbox-accountid" class="slds-dropdown slds-dropdown_length-with-icon-7 slds-dropdown_fluid" role="listbox" aria-label="{{Placeholder for Dropdown Items}}" tabindex="0" aria-busy="false">
                                            <ul class="slds-listbox slds-listbox_vertical" role="presentation">
                                                <!-- This is where you'd populate options dynamically -->
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>`;
                } else {
                    htmlContent += `
                    <div class="slds-col">
                        <span>
                            <div class="slds-form slds-form_stacked">
                                <div class="slds-form-element">
                                    <label class="slds-form-element__label" for="form-element-${
                                        i + j
                                    }">${fields[i + j].label}</label>
                                    <div class="slds-form-element__control">
                                        <input type="text" id="form-element-${
                                            i + j
                                        }" class="slds-input" placeholder="${
                        fields[i + j].placeholder
                    }" />
                                    </div>
                                </div>
                            </div>
                        </span>
                    </div>`;
                }
            }
        }
        htmlContent += "</div>";
    }

    htmlContent += "</div>";
    return htmlContent;
}

//Modal Select Fields - Open
function openModal() {
    $("#backdrop").addClass("slds-backdrop--open");
    $("#modal").addClass("slds-fade-in-open");

    let objectName = fetchActiveMenuItem();
    setFieldOptionValues(objectName);
}

function openRecordModal() {
    $("#record-modal-backdrop").addClass("slds-backdrop--open");
    $("#record-modal").addClass("slds-fade-in-open");

    let objectName = fetchActiveMenuItem();
    console.log(objectName);
    $(document).ready(function () {
        document.getElementById("modal-title").innerText = `New ${objectName}`;
        let formContent = generateFormContent(objectName);
        document.getElementById("modal-fields").innerHTML = formContent;
        $("#combobox-accountid").on(
            "keyup",
            debounce(function () {
                let inputValue = $(this).val();
                if (inputValue.length >= 2) {
                    searchSalesforceRecords(objectName, inputValue);
                }
            }, 500)
        );
    });
}

function closeRecordModal() {
    $("#record-modal").removeClass("slds-fade-in-open");
    $("#record-modal-backdrop").removeClass("slds-backdrop--open");
}

//Modal Select Fields - Close
function closeModal() {
    $("#modal").removeClass("slds-fade-in-open");
    $("#backdrop").removeClass("slds-backdrop--open");
    $("#object-fields-select").multiSelect("destroy");
}

function saveModal() {
    let ulElement = document
        .getElementById("selected-fields")
        .querySelector("ul.slds-picklist__options");

    let selectedFields = [];
    // Iterate over the list items
    for (let li of ulElement.children) {
        selectedFields.push({
            fieldApiName: li.getAttribute("id"),
            fieldLabel: li.textContent.trim(),
        });
    }

    let objectName = fetchActiveMenuItem();
    fetch("/api/update_fields/" + objectName, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(selectedFields),
    })
        .then((response) => response.json())
        .then((data) => {
            console.log(data.message);
            closeModal();
            fetchDataForObject(objectName);
        })
        .catch((error) => {
            console.error("Error updating fields:", error);
        });
}

function setFieldOptionValues(objectName) {
    $.getJSON("/api/get_fields/" + objectName + "?t=" + new Date().getTime())
        .done(function (data) {
            // If already initialized, destroy the previous instance
            if (isMultiSelectInitialized) {
                $("#object-fields-select").multiSelect("destroy");
            }

            $("#object-fields-select").multiSelect({
                unselectedItems: data.available_fields,
                selectedItems: data.visible_fields,
                onSelectItem: function (obj) {
                    console.log(obj);
                },
                onUnselectItem: function (obj) {
                    console.log(obj.getUnselectedItems());
                },
                onMoveItem: function (obj, direction) {
                    console.log(obj, direction);
                },
            });

            // Set the flag to true after initialization
            isMultiSelectInitialized = true;
        })
        .fail(function (jqxhr, textStatus, error) {
            console.error(
                "Error fetching data (option fields):",
                textStatus,
                error
            );
        })
        .always(function () {});
}

function fetchDataForObject(objectName) {
    showSpinner();

    // Fetch the data from the API endpoint
    $.getJSON("/api/get_data/" + objectName)
        .done(function (data) {
            currentData = data;
            populateTable(data);
        })
        .fail(function (jqxhr, textStatus, error) {
            console.error("Error fetching data:", textStatus, error);
        })
        .always(function () {
            hideSpinner();
        });
}

function showSpinner() {
    $("#spinner").show();
    $("#data-table").hide(); // Hide the data table when spinner is shown
}

function hideSpinner() {
    $("#spinner").hide();
    $("#data-table").show(); // Show the data table when spinner is hidden
}

function updateActiveObjectName(objectName) {
    $("#activeObjectName").text(objectName);
}

function populateTable(data) {
    // Populate table headers based on fields
    let headerContent = "";
    $.each(data.fields, function (index, field) {
        headerContent += generateHeaderContent(field.fieldApiName, index);
    });
    $("#data-table thead tr").html(headerContent);

    // Populate table body with record data
    let bodyContent = "";
    $.each(data.records, function (index, record) {
        bodyContent += generateRowContent(data.fields, record);
    });
    $("#data-table tbody").html(bodyContent);

    // Attach event listeners to headers AFTER populating them
    attachHeaderListeners();
}

function attachHeaderListeners() {
    const headers = document.querySelectorAll(".column-header");
    headers.forEach((header) => {
        header.addEventListener("click", handleSort);
    });
}

function generateHeaderContent(field, index) {
    const isSorted = currentData.sort === field;
    const sortDirection = isSorted
        ? currentData.sortAsc
            ? "asc"
            : "desc"
        : "none";
    const sortIconURL = isSorted
        ? currentData.sortAsc
            ? ARROW_DOWN_SVG_URL
            : ARROW_UP_SVG_URL
        : ARROW_DOWN_SVG_URL;

    return `
        <th
            aria-label="${field}"
            class="slds-is-resizable slds-is-sortable column-header"
            scope="col"
            data-sort="${sortDirection}" 
            data-field="${field}" 
            onmousemove="setNewWidth(event)"
        >
            <a class="slds-th__action slds-text-link_reset" href="javascript:void(0);" role="button" tabindex="0">
                <span class="slds-assistive-text">Sort by:</span>
                <div class="slds-grid slds-grid_vertical-align-center slds-has-flexi-truncate">
                    <span class="slds-truncate" title="${field}">${field}</span>
                    <span class="slds-icon_container">
                        <img aria-hidden="true" class="slds-icon slds-icon-text-default slds-is-sortable__icon sort-icons" src="${sortIconURL}" />
                    </span>
                </div>
            </a>
            <div class="slds-resizable">
                <input type="range" aria-label="${field} column width" class="slds-resizable__input slds-assistive-text" id="cell-resize-handle-${index}" max="1000" min="20" tabindex="0" />
                <span class="slds-resizable__handle" onmousedown="calculateWidth(event)">
                    <span class="slds-resizable__divider"></span>
                </span>
            </div>

        </th>`;
}

function generateRowContent(fields, record) {
    let rowContent = '<tr aria-selected="false" class="slds-hint-parent">';
    $.each(fields, function (fieldIndex, field) {
        rowContent += `
                <td class="slds-cell_action-mode" role="gridcell">
                    <div class="slds-truncate" title="${
                        record[field.fieldApiName]
                    }">
                        ${record[field.fieldApiName]}
                    </div>
                </td>`;
    });
    return rowContent + "</tr>";
}

// sort table
function handleSort(event) {
    const header = event.currentTarget;
    const field = header.getAttribute("data-field");
    const currentSort = currentData.sort;
    const currentSortAsc = currentData.sortAsc;

    if (currentSort === field) {
        currentData.sortAsc = !currentSortAsc; // Reverse the sort direction
    } else {
        currentData.sort = field;
        currentData.sortAsc = true; // Default to ascending for a new field
    }

    // Sort the data
    currentData.records.sort((a, b) => {
        if (currentData.sortAsc) {
            return a[field] > b[field] ? 1 : -1;
        } else {
            return a[field] < b[field] ? 1 : -1;
        }
    });

    // Re-render the table
    populateTable(currentData);
}

// Fetch data for the currently active menu item's object
function fetchDataForActiveMenuItem() {
    let objectName = fetchActiveMenuItem();
    if (objectName) {
        updateActiveObjectName(objectName);
        fetchDataForObject(objectName);
    } else {
        console.error("No active menu item found.");
    }
}

$(document).ready(function () {
    fetchDataForActiveMenuItem();

    $(
        "#success-toast .slds-notify__close button, #error-toast .slds-notify__close button"
    ).click(function () {
        $(this).closest(".slds-notify_container").fadeOut();
    });

    $(".menu-items").click(function (e) {
        e.preventDefault();

        $(".slds-context-bar__item").removeClass("slds-is-active");

        $(this).parent().addClass("slds-is-active");

        let objectName = $(this).data("object");
        updateActiveObjectName(objectName);
        fetchDataForObject(objectName);
    });

    $("#refresh-btn").click(function () {
        let activeObjectName = $(
            ".slds-context-bar__item.slds-is-active .menu-items"
        ).data("object");

        if (!activeObjectName) {
            activeObjectName = "Account";
        }

        fetchDataForObject(activeObjectName);
    });

    $("#filter-button").click(function () {
        $(".slds-panel.slds-panel_docked").toggle();
    });

    $(".slds-panel__close").click(function () {
        $(".slds-panel.slds-panel_docked").hide();
    });
});
