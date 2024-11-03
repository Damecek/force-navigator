
# Manual: Extracting Salesforce Setup Page URLs

This guide will help you capture the network request containing Salesforce setup page data and process the JSON response to extract both Lightning and Classic URLs. The goal is to produce a JSON mapping of setup pages similar to the following format:

```json
{
  "setup.groupLayout": {
    "lightning": "/lightning/setup/CollaborationGroupLayouts/home",
    "classic": "/ui/setup/layout/PageLayouts?type=CollaborationGroup&retURL=%2Fsetup%2Fhome"
  }
}
```

---

## Table of Contents

1. [Prepare Your Salesforce Developer Org](#step-1-prepare-your-salesforce-developer-org)
2. [Capture the Network Request](#step-2-capture-the-network-request)
3. [Run the Script](#step-3-run-the-script)

---

## Step 1: Prepare Your Salesforce Developer Org

- Go to [https://developer.salesforce.com/signup](https://developer.salesforce.com/signup) and register for a new Developer Edition org.

---

## Step 2: Capture the Network Request

### 2.1 Access Salesforce Setup

- Log in to your Salesforce Developer org.
- Navigate to **Setup**.

### 2.2 Open Developer Tools and Filter Requests

- Open your browser's Developer Tools (e.g., `Ctrl+Shift+I` on Chrome).
- Navigate to the **Network** tab.
- In the filter bar, filter for following url params:

  ```
  getSetupTreeNodes - returns classic setup pages
  getMenuNodes - returns lightning setup pages
  ```

### 2.3 Refresh the Page and Locate the Request

- Refresh the Setup page to reload network activity.
- Look for a **POST** request to `/aura` with parameters including:

  ```
  ...getSetupTreeNodes...
  ```

### 2.4 Copy the Response Data

- Click on the request to view its details.
- Go to the **Response** tab.
- Copy the response data.
- Save it into a file named `response.json`.

---

## Step 3: Run the Script

- Ensure Node.js is installed on your system.
- Open a terminal and navigate to your working directory containing `response.json` and the script `extractSetupUrls.js`.
- Run the script using:

  ```bash
  node extractSetupUrls.js
  ```

---

By following this manual, you can extract the setup page URLs from Salesforce's setup menu and generate a JSON mapping for both Classic and Lightning experiences. This process is concise and tailored for experienced Salesforce developers.
