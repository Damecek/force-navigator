import { forceNavigator, forceNavigatorSettings, _d } from "./shared"
import { t } from "lisan"
const metaData = {}
const showElement = (element)=>{
	chrome.tabs.query({currentWindow: true, active: true}, (tabs)=>{
		switch(element) {
			case "appMenu":
				chrome.tabs.executeScript(tabs[0].id, {code: 'document.getElementsByClassName("appLauncher")[0].getElementsByTagName("button")[0].click()'})
				break
			case "searchBox":
				chrome.tabs.executeScript(tabs[0].id, {code: `
					if(document.getElementById("sfnavSearchBox")) {
						document.getElementById("sfnavSearchBox").style.zIndex = 9999
						document.getElementById("sfnavSearchBox").style.opacity = 0.98
						document.getElementById("sfnavQuickSearch").focus()
					}
				`})
				break
		}
	})
}
const getOtherExtensionCommands = (otherExtension, requestDetails, settings = {}, sendResponse)=>{
	const url = requestDetails.domain.replace(/https*:\/\//, '')
	const apiUrl = requestDetails.apiUrl
	let commands = {}
	if(chrome.management) {
		chrome.management.get(otherExtension.id, response => {
			if(chrome.runtime.lastError) { _d("Extension not found", chrome.runtime.lastError); return }
			otherExtension.commands.forEach(c=>{
				commands[c.key] = {
					"url": otherExtension.platform + "://" + otherExtension.urlId + c.url.replace("$URL",url).replace("$APIURL",apiUrl),
					"label": t(c.key),
					"key": c.key
				}
			})
			sendResponse(commands)
		})
	}
}

const parseMetadata = (data, url, settings = {}, serverUrl)=>{
	if (data.length == 0 || typeof data.sobjects == "undefined") return false
	let mapKeys = Object.keys(forceNavigator.objectSetupLabelsMap)
	return data.sobjects.reduce((commands, sObjectData) => forceNavigator.createSObjectCommands(commands, sObjectData, serverUrl), {})
}

const goToUrl = (targetUrl, newTab, settings = {})=>{
	chrome.tabs.query({currentWindow: true, active: true}, (tabs)=>{
		const re = new RegExp("\\w+-extension:\/\/"+chrome.runtime.id,"g");
		targetUrl = targetUrl.replace(re,'')
		let newUrl = targetUrl.match(/.*?\.com(.*)/)
		newUrl = newUrl ? newUrl[1] : targetUrl
		if(!targetUrl.includes('-extension:'))
			newUrl = tabs[0].url.match(/.*?\.com/)[0] + newUrl
		else
			newUrl = targetUrl
		if(newTab)
			chrome.tabs.create({ "active": false, "url": newUrl })
		else
			chrome.tabs.update(tabs[0].id, { "url": newUrl })
	})
}

chrome.commands.onCommand.addListener((command)=>{
	switch(command) {
		case 'showSearchBox': showElement("searchBox"); break
		case 'showAppMenu': showElement("appMenu"); break
		case 'goToTasks': goToUrl(".com/00T"); break
		case 'goToReports': goToUrl(".com/00O"); break
	}
})
chrome.runtime.onMessage.addListener((request, sender, sendResponse)=>{
	var orgKey = request.key !== null ? request.key?.split('!')[0] : request.key
	switch(request.action) {
		case "goToUrl":
			goToUrl(request.url, request.newTab, request.settings)
			break
		case "getOtherExtensionCommands":
			getOtherExtensionCommands(request.otherExtension, request, request.settings, sendResponse)
			break
		case "getApiSessionId":
			if (request.key === null) { sendResponse({ "error": "Must include orgId" }); return }
			request.sid = request.uid = request.domain = ""
			chrome.cookies.getAll({}, (all)=>{
				all.forEach((c)=>{
					if(c.domain.includes("salesforce.com") && c.value.includes(request.key) && c.name === "sid") {
						request.sid = c.value
						request.domain = c.domain
					}
				})
				if(request.sid === "") { sendResponse({error: "No session data found for " + request.key}); return }
				forceNavigator.getHTTP("https://" + request.domain + '/services/data/' + forceNavigator.apiVersion, "json",
					{"Authorization": "Bearer " + request.sid, "Accept": "application/json"}
				).then(response => {
					if(response?.identity) {
						request.uid = response.identity.match(/005.*/)[0]
						sendResponse({sessionId: request.sid, userId: request.uid, apiUrl: request.domain})
					}
					else sendResponse({error: "No user data found for " + request.key})
				})
			})
			break
		case 'getActiveFlows':
			let flowCommands = {}
			forceNavigator.getHTTP("https://" + request.apiUrl + '/services/data/' + forceNavigator.apiVersion + '/query/?q=select+ActiveVersionId,Label+from+FlowDefinitionView+where+IsActive=true', "json",
				{"Authorization": "Bearer " + request.sessionId, "Accept": "application/json"})
				.then(response => {
					let targetUrl = request.domain + "/builder_platform_interaction/flowBuilder.app?flowId="
					response.records.forEach(f=>{
						flowCommands["flow." + f.ActiveVersionId] = {
							"key": "flow." + f.ActiveVersionId,
							"url": targetUrl + f.ActiveVersionId,
							"label": [t("prefix.flows"), f.Label].join(" > ")
						}
					})
					sendResponse(flowCommands)
				}).catch(e=>_d(e))
			break
		case 'getMetadata':
			if(forceNavigatorSettings.sessionIdDisabled) {
				sendResponse(forceNavigator.standardObjects.reduce((commands, sObjectData)=>forceNavigator.createSObjectCommands(commands, sObjectData), {}))
			}
			else if(metaData[request.sessionHash] == null || request.force)
				forceNavigator.getHTTP("https://" + request.apiUrl + '/services/data/' + forceNavigator.apiVersion + '/sobjects/', "json",
					{"Authorization": "Bearer " + request.sessionId, "Accept": "application/json"})
					.then(response => {
						// TODO good place to filter out unwanted objects
						metaData[request.sessionHash] = parseMetadata(response, request.domain, request.settings, request.serverUrl)
						sendResponse(metaData[request.sessionHash])
					}).catch(e=>_d(e))
			else
				sendResponse(metaData[request.sessionHash])
			break
		case 'createTask':
			forceNavigator.getHTTP("https://" + request.apiUrl + "/services/data/" + forceNavigator.apiVersion + "/sobjects/Task",
				"json", {"Authorization": "Bearer " + request.sessionId, "Content-Type": "application/json" },
				{"Subject": request.subject, "OwnerId": request.userId}, "POST")
			.then(function (response) { sendResponse(response) })
			break
		case 'searchLogins':
			forceNavigator.getHTTP("https://" + request.apiUrl + "/services/data/" + forceNavigator.apiVersion + "/query/?q=SELECT Id, Name, Username FROM User WHERE Name LIKE '%25" + request.searchValue.trim() + "%25' OR Username LIKE '%25" + request.searchValue.trim() + "%25'", "json", {"Authorization": "Bearer " + request.sessionId, "Content-Type": "application/json" })
			.then(function(success) { sendResponse(success) }).catch(function(error) {
				console.error(error)
			})
	}
	return true
})