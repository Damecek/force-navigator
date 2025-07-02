# MVP Backlog

Below are the main steps to achieve the MVP of the Command Palette for the Salesforce extension.  
Mark each line with [x] when the task is completed.

- [ ] Error Handling: centralized input validation and error reporting in the UI
- [ ] Command `Login as <username>` (User Switcher)
- [x] Add SObject-specific submenu (fields, layout, etc.)
- [ ] Theme Engine with support for themes (Default, Dark, Unicorn, Solarized)
- [ ] Implement Lightning navigation instead of page redirection refer to https://github.com/tprouvot/Salesforce-Inspector-reloaded/blob/main/addon/inject.js
- [ ] Implement record search using `?` prefix
- [ ] performance: instantiate commands only on click/select in the command item class, now it is instantiated on command list load
- [ ] [internationalize](https://developer.chrome.com/docs/extensions/reference/api/i18n#concepts_and_usage) the
      extension
- [ ] support experience setup
      domains https://carvago--devas.sandbox.builder.salesforce-experience.com/, https://carvago.builder.salesforce-experience.com/
