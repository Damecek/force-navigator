var getServerInstance = ()=>{
	let targetUrl
	let url = location.origin + ""
	if(url.indexOf("lightning.force") != -1)
		targetUrl = url.substring(0, url.indexOf("lightning.force")) + "lightning.force.com"
	else if(url.indexOf("salesforce") != -1)
		targetUrl = url.substring(0, url.indexOf("salesforce")) + "salesforce.com"
	else if(url.indexOf("cloudforce") != -1)
		targetUrl = url.substring(0, url.indexOf("cloudforce")) + "cloudforce.com"
	else if(url.indexOf("visual.force") != -1) {
		let urlParseArray = url.split(".")
		targetUrl = 'https://' + urlParseArray[1] + ''
	}
	return targetUrl
}
var getSessionHash = ()=>{
	try {
		let sId = document.cookie.match(regMatchSid)[1]
		return sId.split('!')[0] + '!' + sId.substring(sId.length - 10, sId.length)
	} catch(e) { if(debug) console.log(e) }
}
let getHTTP = function(targetUrl, type = "json", headers = {}, data = {}, method = "GET") {
	let request = { method: method, headers: headers }
	if(Object.keys(data).length > 0)
		request.body = JSON.stringify(data)
	return fetch(targetUrl, request).then(response => {
		apiUrl = response.url.match(/:\/\/(.*)salesforce.com/)[1] + "salesforce.com"
		switch(type) {
			case "json": return response.clone().json()
			case "document": return response.clone().text()
		}
	}).then(data => {
		if(typeof data == "string")
			return (new DOMParser()).parseFromString(data, "text/html")
		else
			return data
	})
}


const debug = false
const newTabKeys = [ "ctrl+enter", "command+enter", "shift+enter" ]
const regMatchSid = /sid=([a-zA-Z0-9\.\!]+)/
const SFAPI_VERSION = 'v40.0'
const classicToLightingMap = {
	'Fields': "/FieldsAndRelationships/view",
	'Page Layouts': '/PageLayouts/view',
	'Buttons, Links, and Actions': '/ButtonsLinksActions/view',
	'Compact Layouts': '/CompactLayouts/view',
	'Field Sets': '/FieldSets/view',
	'Limits': '/Limits/view',
	'Record Types': '/RecordTypes/view',
	'Related Lookup Filters': '/RelatedLookupFilters/view',
	'Search Layouts': '/SearchLayouts/view',
	'Triggers': '/Triggers/view',
	'Validation Rules': '/ValidationRules/view'
}
const setupLabelsToLightningMap = {
	"Access Policies": "/lightning/setup/SessionLevelPolicyUI/home",
"Account Settings": "/lightning/setup/AccountSettings/home",
"Account Teams": "/lightning/setup/AccountTeamSelling/home",
"Action Link Templates": "/lightning/setup/ActionLinkGroupTemplates/home",
"Actions & Recommendations": "/lightning/setup/GuidedActions/home",
"Activations": "/lightning/setup/ActivatedIpAddressAndClientBrowsersPage/home",
"Activity Custom Fields": "/lightning/setup/ObjectManager/Task/FieldsAndRelationships/view",
"Activity Settings": "/lightning/setup/HomeActivitiesSetupPage/home",
"Adoption Assistance": "/lightning/setup/AdoptionAssistance/home",
"Apex Classes": "/lightning/setup/ApexClasses/home",
"Apex Exception Email": "/lightning/setup/ApexExceptionEmail/home",
"Apex Flex Queue": "/lightning/setup/ApexFlexQueue/home",
"Apex Hammer Test Results": "/lightning/setup/ApexHammerResultStatus/home",
"Apex Jobs": "/lightning/setup/AsyncApexJobs/home",
"Apex Settings": "/lightning/setup/ApexSettings/home",
"Apex Test Execution": "/lightning/setup/ApexTestQueue/home",
"Apex Test History": "/lightning/setup/ApexTestHistory/home",
"Apex Triggers": "/lightning/setup/ApexTriggers/home",
"API Usage Notifications": "/lightning/setup/MonitoringRateLimitingNotification/home",
"API": "/lightning/setup/WebServices/home",
"App Manager": "/lightning/setup/NavigationMenus/home",
"App Menu": "/lightning/setup/AppMenu/home",
"AppExchange Marketplace": "/lightning/setup/AppExchangeMarketplace/home",
"Approval Processes": "/lightning/setup/ApprovalProcesses/home",
"Asset Files": "/lightning/setup/ContentAssets/home",
"Auth. Providers": "/lightning/setup/AuthProviders/home",
"Auto-Association Settings": "/lightning/setup/AutoAssociationSettings/home",
"Automation Home (Beta)": "/lightning/setup/ProcessHome/home",
"Background Jobs": "/lightning/setup/ParallelJobsStatus/home",
"Big Objects": "/lightning/setup/BigObjects/home",
"Bulk Data Load Jobs": "/lightning/setup/AsyncApiJobStatus/home",
"Business Hours": "/lightning/setup/BusinessHours/home",
"Call Centers": "/lightning/setup/CallCenters/home",
"Campaign Influence Settings": "/lightning/setup/CampaignInfluenceSettings/home",
"Canvas App Previewer": "/lightning/setup/CanvasPreviewerUi/home",
"Case Assignment Rules": "/lightning/setup/CaseRules/home",
"Case Auto-Response Rules": "/lightning/setup/CaseResponses/home",
"Case Comment Triggers": "/lightning/setup/CaseCommentTriggers/home",
"Case Escalations": "/lightning/setup/DataManagementManageCaseEscalation/home",
"Case Merge": "/lightning/setup/CaseMerge/home",
"Case Team Roles": "/lightning/setup/CaseTeamRoles/home",
"Certificate and Key Management": "/lightning/setup/CertificatesAndKeysManagement/home",
"Change Data Capture": "/lightning/setup/CdcObjectEnablement/home",
"Channel Menu": "/lightning/setup/ChannelMenuDeployments/home",
"Chatter Settings": "/lightning/setup/CollaborationSettings/home",
"Cisco Webex": "/lightning/setup/SparkSetupPage/home",
"Classic Email Templates": "/lightning/setup/CommunicationTemplatesEmail/home",
"Classic Letterheads": "/lightning/setup/CommunicationTemplatesLetterheads/home",
"Communities Settings": "/lightning/setup/NetworkSettings/home",
"Communities Settings": "/lightning/setup/SparkSetupPage/home",
"Company Information": "/lightning/setup/CompanyProfileInfo/home",
"Compliance BCC Email": "/lightning/setup/SecurityComplianceBcc/home",
"Connected Apps OAuth Usage": "/lightning/setup/ConnectedAppsUsage/home",
"Contact Roles on Cases": "/lightning/setup/CaseContactRoles/home",
"Contact Roles on Contracts": "/lightning/setup/ContractContactRoles/home",
"Contact Roles on Opportunities": "/lightning/setup/OpportunityRoles/home",
"Content Deliveries and Public Links": "/lightning/setup/ContentDistribution/home",
"Contract Settings": "/lightning/setup/ContractSettings/home",
"CORS": "/lightning/setup/CorsWhitelistEntries/home",
"Critical Updates": "/lightning/setup/CriticalUpdates/home",
"CSP Trusted Sites": "/lightning/setup/SecurityCspTrustedSite/home",
"Custom Labels": "/lightning/setup/ExternalStrings/home",
"Custom Metadata Types": "/lightning/setup/CustomMetadata/home",
"Custom Notifications": "/lightning/setup/CustomNotifications/home",
"Custom Permissions": "/lightning/setup/CustomPermissions/home",
"Custom Settings": "/lightning/setup/CustomSettings/home",
"Custom URLs": "/lightning/setup/DomainSites/home",
"Customer Contact Requests": "/lightning/setup/ContactRequestFlows/home",
"Data Classification (Beta)": "/lightning/setup/DataClassificationSettings/home",
"Data Classification Download": "/lightning/setup/DataClassificationDownload/home",
"Data Classification Settings": "/lightning/setup/DataClassificationSettings/home",
"Data Classification Upload": "/lightning/setup/DataClassificationUpload/home",
"Data Export": "/lightning/setup/DataManagementExport/home",
"Data Import Wizard": "/lightning/setup/DataManagementDataImporter/home",
"Data Integration Metrics": "/lightning/setup/XCleanVitalsUi/home",
"Data Integration Rules": "/lightning/setup/CleanRules/home",
"Data Loader": "/lightning/setup/DataLoader/home",
"Data Protection and Privacy": "/lightning/setup/ConsentManagement/home",
"Dataloader.io": "/lightning/setup/DataLoaderIo/home",
"Debug Logs": "/lightning/setup/ApexDebugLogs/home",
"Debug Mode": "/lightning/setup/UserDebugModeSetup/home",
"Delegated Administration": "/lightning/setup/DelegateGroups/home",
"Deliverability": "/lightning/setup/OrgEmailSettings/home",
"Density Settings": "/lightning/setup/DensitySetup/home",
"Deployment Settings": "/lightning/setup/DeploymentSettings/home",
"Deployment Status": "/lightning/setup/DeployStatus/home",
"Dev Hub": "/lightning/setup/DevHub/home",
"Directory Numbers": "/lightning/setup/AdditionalDirectoryNumbers/home",
"DKIM Keys": "/lightning/setup/EmailDKIMList/home",
"Domains": "/lightning/setup/DomainNames/home",
"Duplicate Error Logs": "/lightning/setup/DuplicateErrorLog/home",
"Duplicate Rules": "/lightning/setup/DuplicateRules/home",
"Einstein Intent Sets": "/lightning/setup/EinsteinIntentSets/home",
"Einstein.ai": "/lightning/setup/EinsteinKeyManagement/home",
"Email Alerts": "/lightning/setup/WorkflowEmails/home",
"Email Attachments": "/lightning/setup/EmailAttachmentSettings/home",
"Email Domain Filters": "/lightning/setup/EmailDomainFilter/home",
"Email Footers": "/lightning/setup/EmailDisclaimers/home",
"Email Log Files": "/lightning/setup/EmailLogFiles/home",
"Email Relays": "/lightning/setup/EmailRelay/home",
"Email Services": "/lightning/setup/EmailToApexFunction/home",
"Email Settings": "/lightning/setup/ChatterEmailSettings/home",
"Email Snapshots": "/lightning/setup/EmailCapture/home",
"Email to Salesforce": "/lightning/setup/EmailToSalesforce/home",
"Email-to-Case": "/lightning/setup/EmailToCase/home",
"Embedded Service Deployments": "/lightning/setup/EmbeddedServiceDeployments/home",
"Enhanced Email": "/lightning/setup/EnhancedEmail/home",
"Entitlement Settings": "/lightning/setup/EntitlementSettings/home",
"Escalation Rules": "/lightning/setup/CaseEscRules/home",
"Event Buttons, Links, and Actions": "/lightning/setup/ObjectManager/Event/ButtonsLinksActions/view",
"Event Compact Layouts": "/lightning/setup/ObjectManager/Event/CompactLayouts/view",
"Event Field Sets": "/lightning/setup/ObjectManager/Event/FieldSets/view",
"Event Fields": "/lightning/setup/ObjectManager/Event/FieldsAndRelationships/view",
"Event Limits": "/lightning/setup/ObjectManager/Event/Limits/view",
"Event Manager": "/lightning/setup/EventManager/home",
"Event Monitoring Settings": "/lightning/setup/EventMonitoringSetup/home",
"Event Page Layouts": "/lightning/setup/ObjectManager/Event/PageLayouts/view",
"Event Record Types": "/lightning/setup/ObjectManager/Event/RecordTypes/view",
"Event Related Lookup Filters": "/lightning/setup/ObjectManager/Event/RelatedLookupFilters/view",
"Event Search Layouts": "/lightning/setup/ObjectManager/Event/SearchLayouts/view",
"Event Triggers": "/lightning/setup/ObjectManager/Event/Triggers/view",
"Event Validation Rules": "/lightning/setup/ObjectManager/Event/ValidationRules/view",
"Expire All Passwords": "/lightning/setup/SecurityExpirePasswords/home",
"Export": "/lightning/setup/LabelWorkbenchExport/home",
"External Data Sources": "/lightning/setup/ExternalDataSource/home",
"External Objects": "/lightning/setup/ExternalObjects/home",
"External Services": "/lightning/setup/ExternalServices/home",
"Feed Filters": "/lightning/setup/FeedFilterDefinitions/home",
"Feed Item Actions": "/lightning/setup/FeedItemActions/home",
"Feed Item Layouts": "/lightning/setup/FeedItemLayouts/home",
"Feed Tracking": "/lightning/setup/FeedTracking/home",
"FeedComment Triggers": "/lightning/setup/FeedCommentTriggers/home",
"FeedItem Triggers": "/lightning/setup/FeedItemTriggers/home",
"Field Accessibility": "/lightning/setup/FieldAccessibility/home",
"Field Service Settings": "/lightning/setup/FieldServiceSettings/home",
"Field Updates": "/lightning/setup/WorkflowFieldUpdates/home",
"File Upload and Download Security": "/lightning/setup/FileTypeSetting/home",
"Files Connect": "/lightning/setup/ContentHub/home",
"Fiscal Year": "/lightning/setup/ForecastFiscalYear/home",
"Flow Category": "/lightning/setup/FlowCategory/home",
"Flows": "/lightning/setup/Flows/home",
"Forecasts Hierarchy": "/lightning/setup/Forecasting3Role/home",
"Forecasts Quotas": "/lightning/setup/Forecasting3Quota/home",
"Forecasts Settings": "/lightning/setup/Forecasting3Settings/home",
"General Settings": "/lightning/setup/FilesGeneralSettings/home",
"Getting Started": "/lightning/setup/InsightsSetupGettingStarted/home",
"Global Actions": "/lightning/setup/GlobalActions/home",
"Gmail Integration and Sync": "/lightning/setup/LightningForGmailAndSyncSettings/home",
"Group Layouts": "/lightning/setup/CollaborationGroupLayouts/home",
"Group Member Triggers": "/lightning/setup/CollaborationGroupMemberTriggers/home",
"Group Record Triggers": "/lightning/setup/CollaborationGroupRecordTriggers/home",
"Group Triggers": "/lightning/setup/CollaborationGroupTriggers/home",
"Guided Actions": "/lightning/setup/GuidedActions/home",
"Health Check": "/lightning/setup/HealthCheck/home",
"Help Menu": "/lightning/setup/HelpMenu/home",
"Historical Trending": "/lightning/setup/HistoricalTrendingUI/home",
"Holidays": "/lightning/setup/Holiday/home",
"Home": "/lightning/setup/Home/home",
"Identity Provider Event Log": "/lightning/setup/IdpErrorLog/home",
"Identity Provider": "/lightning/setup/IdpPage/home",
"Identity Verification History": "/lightning/setup/VerificationHistory/home",
"Identity Verification": "/lightning/setup/IdentityVerification/home",
"Import": "/lightning/setup/LabelWorkbenchImport/home",
"In-App Guidance": "/lightning/setup/Prompts/home",
"Inbound Change Sets": "/lightning/setup/InboundChangeSet/home",
"Individual Settings": "/lightning/setup/IndividualSettings/home",
"Influence": "/lightning/setup/InfluenceSettings/home",
"Installed Packages": "/lightning/setup/ImportedPackage/home",
"ISV Hammer Opt Out": "/lightning/setup/IsvHammerSubscriberOptOut/home",
"Language Settings": "/lightning/setup/LanguageSettings/home",
"Lead Assignment Rules": "/lightning/setup/LeadRules/home",
"Lead Auto-Response Rules": "/lightning/setup/LeadResponses/home",
"Lead Gen Fields": "/lightning/setup/LinkedInLeadGenFields/home",
"Lead Processes": "/lightning/setup/LeadProcess/home",
"Lead Settings": "/lightning/setup/LeadSettings/home",
"Letterheads": "/lightning/setup/CommunicationTemplatesLetterheads/home",
"Lightning App Builder": "/lightning/setup/FlexiPageList/home",
"Lightning Bolt Solutions": "/lightning/setup/LightningBolt/home",
"Lightning Components": "/lightning/setup/LightningComponentBundles/home",
"Lightning Email Templates": "/lightning/setup/LightningEmailTemplateSetup/home",
"Lightning Experience on iPad Browsers (Beta)": "/lightning/setup/LexOnIpadSetup/home",
"Lightning Experience Transition Assistant": "/lightning/setup/EnableLightningExperience/home",
"Lightning Extension": "/lightning/setup/LightningExtension/home",
"Lightning Usage": "/lightning/setup/LightningUsageSetup/home",
"LinkedIn Accounts": "/lightning/setup/LinkedInLeadGenAccounts/home",
"LinkedIn Sales Navigator": "/lightning/setup/LinkedInSalesNavigatorPage/home",
"Login Access Policies": "/lightning/setup/LoginAccessPolicies/home",
"Login Flows": "/lightning/setup/LoginFlow/home",
"Login History": "/lightning/setup/OrgLoginHistory/home",
"Macro Settings": "/lightning/setup/MacroSettings/home",
"Mail Merge Templates": "/lightning/setup/CommunicationTemplatesWord/home",
"Manage Connected Apps": "/lightning/setup/ConnectedApplication/home",
"Maps and Location Settings": "/lightning/setup/MapsAndLocationServicesSettings/home",
"Mass Delete Records": "/lightning/setup/DataManagementDelete/home",
"Mass Transfer Approval Requests": "/lightning/setup/DataManagementManageApprovals/home",
"Mass Transfer Records": "/lightning/setup/DataManagementTransfer/home",
"Mass Update Addresses": "/lightning/setup/DataManagementMassUpdateAddresses/home",
"Matching Rules": "/lightning/setup/MatchingRules/home",
"My Domain": "/lightning/setup/OrgDomain/home",
"Named Credentials": "/lightning/setup/NamedCredential/home",
"Network Access": "/lightning/setup/NetworkAccess/home",
"New Salesforce Mobile App QuickStart": "/lightning/setup/SalesforceMobileAppQuickStart/home",
"Next Best Action": "/lightning/setup/NextBestAction/home",
"Notes Settings": "/lightning/setup/NotesSetupPage/home",
"Notification Delivery Settings": "/lightning/setup/NotificationTypesManager/home",
"OAuth Custom Scopes": "/lightning/setup/OauthCustomScope/home",
"Object Manager": "/lightning/setup/ObjectManager/home",
"Office 365": "/lightning/setup/NetworkSettings/home",
"Omni-Channel Settings": "/lightning/setup/OmniChannelSettings/home",
"Opportunity Settings": "/lightning/setup/OpportunitySettings/home",
"Opportunity Team Settings": "/lightning/setup/OpportunityTeamMemberSettings/home",
"Optimizer": "/lightning/setup/SalesforceOptimizer/home",
"Order Settings": "/lightning/setup/OrderSettings/home",
"Organization-Wide Addresses": "/lightning/setup/OrgWideEmailAddresses/home",
"Outbound Change Sets": "/lightning/setup/OutboundChangeSet/home",
"Outbound Messages": "/lightning/setup/WorkflowOmStatus/home",
"Outbound Messages": "/lightning/setup/WorkflowOutboundMessaging/home",
"Outlook Configurations": "/lightning/setup/EmailConfigurations/home",
"Outlook Integration and Sync": "/lightning/setup/LightningForOutlookAndSyncSettings/home",
"Override": "/lightning/setup/LabelWorkbenchOverride/home",
"Package Manager": "/lightning/setup/Package/home",
"Package Usage": "/lightning/setup/PackageUsageSummary/home",
"Password Policies": "/lightning/setup/SecurityPolicies/home",
"Path Settings": "/lightning/setup/PathAssistantSetupHome/home",
"Paused Flow Interviews": "/lightning/setup/Pausedflows/home",
"Permission Set Groups": "/lightning/setup/PermSetGroups/home",
"Permission Sets": "/lightning/setup/PermSets/home",
"Picklist Settings": "/lightning/setup/PicklistSettings/home",
"Picklist Value Sets": "/lightning/setup/Picklists/home",
"Platform Cache": "/lightning/setup/PlatformCache/home",
"Platform Events": "/lightning/setup/EventObjects/home",
"Post Templates": "/lightning/setup/FeedTemplates/home",
"Predefined Case Teams": "/lightning/setup/CaseTeamTemplates/home",
"Process Automation Settings": "/lightning/setup/WorkflowSettings/home",
"Process Builder": "/lightning/setup/ProcessAutomation/home",
"Product Schedules Settings": "/lightning/setup/Product2ScheduleSetup/home",
"Product Settings": "/lightning/setup/Product2Settings/home",
"Profiles": "/lightning/setup/EnhancedProfiles/home",
"Profiles": "/lightning/setup/Profiles/home",
"Public Calendars and Resources": "/lightning/setup/Calendars/home",
"Public Groups": "/lightning/setup/PublicGroups/home",
"Publisher Layouts": "/lightning/setup/GlobalPublisherLayouts/home",
"Queues": "/lightning/setup/Queues/home",
"Quick Text Settings": "/lightning/setup/LightningQuickTextSettings/home",
"Quip": "/lightning/setup/QuipSetupAssistant/home",
"Quote Settings": "/lightning/setup/QuotesSetupPage/home",
"Quote Templates": "/lightning/setup/QuoteTemplateEditor/home",
"Record Page Settings": "/lightning/setup/SimpleRecordHome/home",
"Record Types": "/lightning/setup/CollaborationGroupRecordTypes/home",
"Regenerate Previews": "/lightning/setup/RegeneratePreviews/home",
"Remote Access": "/lightning/setup/RemoteAccess/home",
"Remote Site Settings": "/lightning/setup/SecurityRemoteProxy/home",
"Rename Tabs and Labels": "/lightning/setup/RenameTab/home",
"Report Types": "/lightning/setup/CustomReportTypes/home",
"Reporting Snapshots": "/lightning/setup/AnalyticSnapshots/home",
"Reports and Dashboards Settings": "/lightning/setup/ReportUI/home",
"Roles": "/lightning/setup/Roles/home",
"Sales Cloud Einstein": "/lightning/setup/SalesEinsteinReadinessCheck/home",
"Sales Processes": "/lightning/setup/OpportunityProcess/home",
"Salesforce Branding": "/lightning/setup/Salesforce1Branding/home",
"Salesforce CRM Content": "/lightning/setup/SalesforceCRMContent/home",
"Salesforce Mobile Quick Start": "/lightning/setup/Salesforce1SetupSection/home",
"Salesforce Navigation": "/lightning/setup/ProjectOneAppMenu/home",
"Salesforce Notifications": "/lightning/setup/NotificationsSettings/home",
"Salesforce Offline": "/lightning/setup/MobileOfflineStorageAdmin/home",
"Salesforce Settings": "/lightning/setup/Salesforce1Settings/home",
"Sandboxes": "/lightning/setup/DataManagementCreateTestInstance/home",
"Scheduled Jobs": "/lightning/setup/ScheduledJobs/home",
"Schema Builder": "/lightning/setup/SchemaBuilder/home",
"Schema Settings": "/lightning/setup/SchemaSettings/home",
"Search Layouts": "/lightning/setup/EinsteinSearchLayouts/home",
"Search Settings": "/lightning/setup/EinsteinSearchSettings/home",
"Security Alerts": "/lightning/setup/SecurityUpdates/home",
"Send Actions": "/lightning/setup/SendAction/home",
"Send through External Email Services": "/lightning/setup/EmailTransportServiceSetupPage/home",
"Session Management": "/lightning/setup/SessionManagementPage/home",
"Session Settings": "/lightning/setup/SecuritySession/home",
"Settings": "/lightning/setup/ActivitySyncEngineSettingsMain/home",
"Setup Home": "/lightning/setup/SetupOneHome/home",
"Sharing Settings": "/lightning/setup/SecuritySharing/home",
"Single Sign-On Settings": "/lightning/setup/SingleSignOn/home",
"Sites": "/lightning/setup/CustomDomain/home",
"Skype for Salesforce": "/lightning/setup/SkypeSetupPage/home",
"Snap-ins": "/lightning/setup/Snap-ins/home",
"Social Accounts and Contacts Settings": "/lightning/setup/SocialProfileOrgSettings/home",
"Social Business Rules": "/lightning/setup/SocialCustomerServiceBusinessRules/home",
"Social Customer Service": "/lightning/setup/SocialCustomerManagementAccountSettings/home",
"Softphone Layouts": "/lightning/setup/SoftphoneLayouts/home",
"State and Country/Territory Picklists": "/lightning/setup/AddressCleanerOverview/home",
"Static Resources": "/lightning/setup/StaticResources/home",
"Storage Usage": "/lightning/setup/CompanyResourceDisk/home",
"Support Processes": "/lightning/setup/CaseProcess/home",
"Support Settings": "/lightning/setup/CaseSettings/home",
"Survey Settings": "/lightning/setup/SurveySettings/home",
"Synonyms": "/lightning/setup/ManageSynonyms/home",
"System Overview": "/lightning/setup/SystemOverview/home",
"Tabs": "/lightning/setup/CustomTabs/home",
"Task Buttons, Links, and Actions": "/lightning/setup/ObjectManager/Task/ButtonsLinksActions/view",
"Task Compact Layouts": "/lightning/setup/ObjectManager/Task/CompactLayouts/view",
"Task Field Sets": "/lightning/setup/ObjectManager/Task/FieldSets/view",
"Task Fields": "/lightning/setup/ObjectManager/Task/FieldsAndRelationships/view",
"Task Limits": "/lightning/setup/ObjectManager/Task/Limits/view",
"Task Page Layouts": "/lightning/setup/ObjectManager/Task/PageLayouts/view",
"Task Record Types": "/lightning/setup/ObjectManager/Task/RecordTypes/view",
"Task Related Lookup Filters": "/lightning/setup/ObjectManager/Task/RelatedLookupFilters/view",
"Task Search Layouts": "/lightning/setup/ObjectManager/Task/SearchLayouts/view",
"Task Triggers": "/lightning/setup/ObjectManager/Task/Triggers/view",
"Task Validation Rules": "/lightning/setup/ObjectManager/Task/ValidationRules/view",
"Tasks": "/lightning/setup/WorkflowTasks/home",
"Territory Settings": "/lightning/setup/Territory2Settings/home",
"Test Deliverability": "/lightning/setup/TestEmailDeliverability/home",
"Themes and Branding": "/lightning/setup/ThemingAndBranding/home",
"Time-Based Workflow": "/lightning/setup/DataManagementManageWorkflowQueue/home",
"Tools": "/lightning/setup/ClientDevTools/home",
"Topic Assignment Triggers": "/lightning/setup/TopicAssigmentTriggers/home",
"Topic Triggers": "/lightning/setup/TopicTriggers/home",
"Translate": "/lightning/setup/LabelWorkbenchTranslate/home",
"Translation Language Settings": "/lightning/setup/LabelWorkbenchSetup/home",
"Translation Settings": "/lightning/setup/LabelWorkbenchSetup/home",
"Update Reminders": "/lightning/setup/OpportunityUpdateReminders/home",
"User Interface": "/lightning/setup/UserInterfaceUI/home",
"User Management Settings": "/lightning/setup/UserManagementSettings/home",
"Users": "/lightning/setup/ManageUsers/home",
"View Setup Audit Trail": "/lightning/setup/SecurityEvents/home",
"Visualforce Components": "/lightning/setup/ApexComponents/home",
"Visualforce Pages": "/lightning/setup/ApexPages/home",
"Web-to-Case HTML Generator": "/lightning/setup/CaseWebToCaseHtmlGenerator/home",
"Web-to-Case": "/lightning/setup/CaseWebtocase/home",
"Web-to-Lead": "/lightning/setup/LeadWebtoleads/home",
"Whitelisted URLs for Redirects": "/lightning/setup/SecurityRedirectWhitelistUrl/home",
"Workflow Rules": "/lightning/setup/WorkflowRules/home",
}