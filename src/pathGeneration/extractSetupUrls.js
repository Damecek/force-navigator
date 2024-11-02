const fs = require('fs');
const { jsonStringifyWithSortedKeys, removeAntiCsrfPrefixes } = require('./utils/jsonUtils');

const RESPONSE_FILE_NAME = 'response.json';
const URL_PATHS_FILENAME = '../generatedSetupUrls.json';
const URL_PATHS_LANG_EN_FILENAME = '../languages/generatedEN-US.json';

// Read and parse the JSON response from response.json
const data = fs.readFileSync(RESPONSE_FILE_NAME, 'utf8');

const jsonData = removeAntiCsrfPrefixes(data);

// Parse the JSON data
let response;
try {
    response = JSON.parse(jsonData);
} catch (error) {
    console.error('Failed to parse JSON:', error);
    process.exit(1);
}


// Function to identify and extract Classic and Lightning URLs from actions
function processActions(actions) {
    let classicData = {};
    let lightningData = [];

    actions.forEach(action => {
        if (action.returnValue) {
            // Identify Classic URLs by checking for specific key structure, e.g., 'CollaborationGroupLayouts'
            if (typeof action.returnValue === 'object' && !Array.isArray(action.returnValue)) {
                if (Object.values(action.returnValue).some(item => item.href && item.title)) {
                    console.log('Classic URLs found');
                    classicData = action.returnValue;
                }
            }
            // Identify Lightning URLs by checking if returnValue is an array with objects containing 'href' and 'title'
            if (Array.isArray(action.returnValue) && action.returnValue.some(item => item.href && item.title)) {
                console.log('Lightning URLs found');
                lightningData = action.returnValue;
            }
        }
    });

    // Process Classic URLs and map them to titles
    const urls = {};
    const langEn = {};
    Object.values(classicData).forEach(item => {
        if (!item.href) return;
        const id = item.data.Id;
        urls[id] = {
            classic: item.href,
        };
        langEn[id] = item.title;
    });

    // Process Lightning URLs and map them to titles
    const processChildren = (parent) => {
        if (!parent.children) return;
        parent.children.forEach(child => {
            processLightningItem(parent.title, child);
        });
    };

    function processLightningItem(prefix, item) {
        if (!item.href) return processChildren(item);
        const id = item.data.id;
        const existingItem = urls[id];
        if (existingItem) {
            existingItem.lightning = item.href;
        } else {
            urls[id] = {
                lightning: item.href,
            };
        }
        // if prefix is null, use just item.title, otherwise use prefix > item.title
        langEn[id] = prefix ? `${prefix} > ${item.title}` : item.title;
    }

    Object.values(lightningData).forEach(item => {
        processLightningItem(null, item);
    });

    return [urls, langEn];
};

// Process actions array from the response
if (response && response.actions) {
    const [urls, langEn] = processActions(response.actions);

    // Output the results to the console and save them to setupUrls.json
    fs.writeFileSync(URL_PATHS_FILENAME, jsonStringifyWithSortedKeys(urls), 'utf8');
    console.log('Extracted URLs saved to ', URL_PATHS_FILENAME);
    fs.writeFileSync(URL_PATHS_LANG_EN_FILENAME, jsonStringifyWithSortedKeys(langEn), 'utf8');
    console.log('Extracted URLs in English saved to ', URL_PATHS_LANG_EN_FILENAME);
} else {
    console.error('No actions found in response');
    process.exit(1);
}

