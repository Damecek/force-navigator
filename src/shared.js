import { lisan, t } from "lisan"
import Mousetrap from "mousetrap"

const titles = require(`./languages/en-US.js`);
titles.entries = {
    ...titles.entries,
    ...require('./languages/generatedEN-US.json')
}
lisan.add(titles)

export const _d = (i)=>{
	console.debug("_D():")
	i && i.name && console.error(`${i.name}: ${i.message}`)
	i && console.debug(...(i[Symbol.iterator] ? i : [i]))
	console.debug("_D() ---------------------")
}

const inputHandler = (function(m) {
	var _global_callbacks = {},
		_original_stop_callback = m.stopCallback
	m.stopCallback = function(e, element, combo) {
		if (_global_callbacks[combo]) { return false }
		return _original_stop_callback(e, element, combo)
	}
	m.bindGlobal = function(keys, callback, action) {
		m.bind(keys, callback, action)
		if (keys instanceof Array) {
			for (var i = 0; i < keys.length; i++) { _global_callbacks[keys[i]] = true }
			return
		}
		_global_callbacks[keys] = true
	}
	return m
})(Mousetrap)

//lookup modes:
export const LOOKUP_MODE_SHOW_COMMANDS = 1	    	//when any command is entered, show the commands completion options
export const LOOKUP_MODE_COMPLETE_OBJECT_NAME = 2 	//When query contains only an object name, assist in completeion
export const LOOKUP_MODE_SHOW_SEARCH_RESULTS =3 	//When query contains an object and value to search --> show results

export const ui = {
	"searchBox": null,
	"navOutput": null,
	"quickSearch": null,
	"navLoader": null,
	"createBox": ()=>{
		if(!document.body)
			return false
		let theme = forceNavigatorSettings.theme
		let div = document.createElement("div")
		div.setAttribute("id", "sfnavStyleBox")
		div.setAttribute("class", theme)
		const loaderURL = chrome.runtime.getURL("images/ajax-loader.gif")
		const logoURL = chrome.runtime.getURL("images/sf-navigator128.png")
		div.innerHTML = `
<div id="sfnavSearchBox">
	<div class="sfnav_wrapper">
		<input type="text" id="sfnavQuickSearch" autocomplete="off"/>
		<img id="sfnavLoader" src= "${loaderURL}"/>
		<img id="sfnav_logo" src= "${logoURL}"/>
	</div>
	<div class="sfnav_shadow" id="sfnav_shadow"/>
	<div class="sfnavOutput" id="sfnavOutput"/>
</div>`
		document.body.appendChild(div)
		ui.searchBox = document.getElementById("sfnavSearchBox")
		ui.navOutput = document.getElementById("sfnavOutput")
		ui.quickSearch = document.getElementById("sfnavQuickSearch")
		ui.navLoader = document.getElementById("sfnavLoader")
	},
	"mouseHandler": (e)=>{
		e.target.classList.add('sfnav_selected')
		return true
	},
	"mouseClick": (e)=>{
		document.getElementById("sfnavQuickSearch").value = e.target.firstChild.nodeValue
		forceNavigator.listPosition = -1
		ui.setVisibleSearch("hidden")
		if(e.target.dataset.key & (!window.ctrlKey))
			forceNavigator.invokeCommand(e.target.dataset, window.ctrlKey,'click')
		else
			ui.hideSearchBox()
		return true
	},
	"mouseHandlerOut": (e)=>{ e.target.classList.remove('sfnav_selected'); return true },
	"mouseClickLoginAs": (e)=>{ forceNavigator.loginAsPerform(e.target.dataset.key.replace("commands.loginAs.","")); return true },
	"bindShortcuts": ()=>{
		if(!ui.quickSearch)
			return false
		inputHandler.bindGlobal('esc', function(e) { ui.hideSearchBox() }) // global doesn't seem to be working
		inputHandler(ui.quickSearch).bind('esc', function(e) { ui.hideSearchBox() })
		inputHandler(ui.quickSearch).bind('enter', ui.kbdCommand)
		inputHandler(ui.quickSearch).bind('tab', ui.kbdCommand)
		for (var i = 0; i < forceNavigator.newTabKeys.length; i++) {
			inputHandler(ui.quickSearch).bind(forceNavigator.newTabKeys[i], ui.kbdCommand)
		}
		inputHandler(ui.quickSearch).bind('down', ui.selectMove.bind(this, 'down'))
		inputHandler(ui.quickSearch).bind('up', ui.selectMove.bind(this, 'up'))
		inputHandler(ui.quickSearch).bind('backspace', function(e) { forceNavigator.listPosition = -1 })
		ui.quickSearch.oninput = ui.lookupCommands
		ui.quickSearch.onfocus = ui.lookupCommands
	},
	"showLoadingIndicator": ()=>{ if(ui.navLoader) ui.navLoader.style.visibility = 'visible' },
	"hideLoadingIndicator": ()=>{ if(ui.navLoader) ui.navLoader.style.visibility = 'hidden' },
	"hideSearchBox": ()=>{
		ui.quickSearch.blur()
		ui.clearOutput()
		ui.quickSearch.value = ''
		ui.setVisibleSearch("hidden")
	},
	"setVisibleSearch": (visibility)=>{
		if(visibility == "hidden") {
			ui.searchBox.style.opacity = 0
			ui.searchBox.style.zIndex = -1
		}
		else {
			ui.searchBox.style.opacity = 0.98
			ui.searchBox.style.zIndex = 9999
			ui.quickSearch.focus()
		}
	},
	//lookupMode decides what is displayed in the dropdown (command completion, help text, or search resutls)
	"lookupMode": LOOKUP_MODE_SHOW_COMMANDS,   //Default is to show command completion
	"lookupCommands": ()=>{
		let input = ui.quickSearch.value
		if (input=='') {
			ui.clearOutput()
			chrome.runtime.sendMessage({"action": "getCommandsHistory",orgId:forceNavigator.organizationId},
			response=>{
				if(response.commandsHistory)
					for (let i = response.commandsHistory.length-1; i>=0; i--) {
						const key = (response.commandsHistory[i])[0]
						const url = (response.commandsHistory[i])[1]
						ui.searchResults.push({"url":url,"label":key})
						ui.addSearchResult(key,url)
					}
			})
			return
		}
		ui.clearOutput()
		if(input.substring(0,1) == "?") {
			input = input.replace(/^\?\s*/,'')
			//Handle search.
			//Syntax - ? sobject value
			//example: ? account sony
			//         ? case "not working"
			//check if the search command is complete (has sobject and value to search)
			if(input.match(/"/g)?.length %2 ==1 ) {
				//if number of \" is odd, add another one at the end.  This way '? "account brand" '  can work
				input += "\""
			}
			let searchQuery = input.split(/([^\s"]+|"[^"]*")+/g).filter(value => (value != ' ' && value != ''))
			switch(searchQuery.length) {
				case 0:
					//Only "?" entered
					ui.lookupMode = LOOKUP_MODE_SHOW_COMMANDS
					break
				case 1:
					//1 element after the "?" --> a sobject
					ui.lookupMode = LOOKUP_MODE_COMPLETE_OBJECT_NAME
					break
				default:
					//more than 2 element in the line - means we have a query
					ui.lookupMode = LOOKUP_MODE_SHOW_SEARCH_RESULTS
					ui.loadCompactLayoutIfNeeded( searchQuery[0]?.toLowerCase() )
					break
			}
			ui.debounceGetMoreData()
			return
		}
            ui.lookupMode = LOOKUP_MODE_SHOW_COMMANDS
            let words = ui.filterCommandList(input)
            if (words.length > 0) {
                for (var i = 0; i < words.length; ++i) {
                    ui.addSearchResult(words[i])
                }
            } else {
                forceNavigator.listPosition = -1
            }
		let firstEl = ui.navOutput.querySelector(":first-child")
		if(forceNavigator.listPosition == -1 && firstEl != null) firstEl.className = "sfnav_child sfnav_selected"
		ui.debounceGetMoreData()
	},
	//filterCommandList takes input ("case field") and returns an array of all matching commands
	"filterCommandList": (input)=>{
		if(typeof input === 'undefined' || input == '') return []
		input = input.toLowerCase()
		let preSort = {}, terms = input.toLowerCase().split(" ")
		for(const key in forceNavigator.commands) {
			const label = forceNavigator.commands[key]?.label ?? ""
			const comboSearch = (key + '|' + label).toLowerCase()
			if(comboSearch.indexOf(input) != -1) {
				preSort[key] = forceNavigatorSettings.searchLimit
			} else {
				let match = 0
				let sortValue = 0
				for(let i = 0;i<terms.length;i++) {
					if(comboSearch.indexOf(terms[i]) != -1) {
						match++
						sortValue = 1
					}
				}
				for(let i = 1;i<=terms.length;i++) {
					if(comboSearch.indexOf(terms.slice(0,i).join(' ')) != -1)
						sortValue++
					else
						//Allow better sort if the user did not enter the ">". for example "Case Fields" should sort the same as "Case > Fields".  Without this, "case fields" would
						//bring "Setup > Briefcase Assignment > Fields"
						if(comboSearch.indexOf(terms.slice(0,i).join(' > ')) != -1)
							sortValue++
						else
							break
				}
				if (match == terms.length)
					preSort[key] = sortValue
			}
			//Take the weights into account when sorting, so less important items will appear lower.
			//for example first will appear "Account > Fields > ...." and only after all the fields, will appear the "Account > Fields > ... > Field Level Security"
			const keySortValue = forceNavigator.commands[key]?.sortValue ?? 1
			if(keySortValue!=1 && preSort[key]) {
				preSort[key] = preSort[key]* keySortValue
			}
		}
		return Object.keys(preSort).sort((a,b)=>(preSort[b] - preSort[a])).slice(0,forceNavigatorSettings.searchLimit)
	},
	// Add one search result to dropdown
	"addSearchResult": (key,url="")=>{
		if(url=="") {
			url = (forceNavigator.commands[key]?.url ?? "#").replace('//','/')
		}
		let r = document.createElement("a")
		r.setAttribute("href", url)
		r.setAttribute('data-key', key)
		r.classList.add("sfnav_child")
		r.onmouseover = ui.mouseHandler
		r.onmouseout = ui.mouseHandlerOut
		r.onclick = ui.mouseClick
		let labelText
		if (forceNavigator.commands[key]?.label) {
			labelText = forceNavigator.commands[key].label
		} else {
			labelText = t(key)
		}
		r.appendChild(document.createTextNode(labelText))
		if(forceNavigator.commands[key]?.userId) {
			r.setAttribute('data-userid',forceNavigator.commands[key].userId)
			r.onclick = ui.mouseClickLoginAs
		}
		ui.navOutput.appendChild(r)
	},
	"searchResults": [],
	//clear and set the entire search results array
	"setSearchResult": (searchResults)=>{
		ui.clearOutput()
		searchResults.forEach(key=>{
			let r = document.createElement("a")
			r.setAttribute("href", key.url)
			r.classList.add("sfnav_child")
			r.onmouseover = ui.mouseHandler
			r.onmouseout = ui.mouseHandlerOut
			r.onclick = ui.mouseClick
			if (key.label.length >150) {
				r.classList.add("sfnav_child_extra_small")
			} else if (key.label.length >80) {
					r.classList.add("sfnav_child_smaller")
			}
			r.appendChild(document.createTextNode(key.label))
			ui.navOutput.appendChild(r)
		})
	},
	"addError": (text)=>{
		ui.clearOutput()
		let err = document.createElement("div")
		err.className = "sfnav_child sfnav-error-wrapper"
		err.appendChild(document.createTextNode(t("prefix.error")))
		err.appendChild(document.createElement('br'))
		for(let i = 0;i<text.length;i++) {
			err.appendChild(document.createTextNode(text[i].message))
			err.appendChild(document.createElement('br'))
		}
		ui.searchBox.appendChild(err)
	},
	"clearOutput": ()=>{
		ui.navOutput.innerHTML = ""
		forceNavigator.listPosition = -1
	},
	"doSearch": (e)=>{
		let options = {
			"action": "doSearch",
			"searchQuery" :  e.target.value,
			"apiUrl": forceNavigator.apiUrl,
			"labelToNameFieldMapping" : forceNavigator.labelToNameFieldMapping,
			"labelToSobjectApiNameMapping" : forceNavigator.labelToSobjectApiNameMapping,
			"compactLayoutFieldsForSobject": forceNavigator.compactLayoutFieldsForSobject,
			"sessionId": forceNavigator.sessionId,
		}
		chrome.runtime.sendMessage(
			options,
			response=>{
				if(response && response.error) { console.error("error in search: " + response.error); return }
				try {
					if (response) {
						//Update mainFields
						if (response.mainFields!=undefined) {
							forceNavigator.compactLayoutFieldsForSobject[response.objectApiName] = response.mainFields
						}
						//If only one result was returned, jump to that record directly:
						if (response.searchRecords.length == 1) {
							let oneResult = response.searchRecords[0]
							let url = `/lightning/r/${oneResult.attributes.type}/${oneResult.Id}/view`
							//Add the command to 'recent commands' list
							let desc = ""
							Object.keys(oneResult).forEach(function (key) {
								let val = oneResult[key]
								if (key!="Id" && (typeof val=='string'||typeof val=='number') && !val.match('[a-zA-Z0-9]{15}|[a-zA-Z0-9]{18}'))
									desc += oneResult[key] + " - "
							})
							desc =  desc.slice(0,-3)
							chrome.runtime.sendMessage({
								"action": "updateLastCommand",
								"orgId":forceNavigator.organizationId,
								"key": desc,
								"url": url})
							forceNavigator.goToUrl(url)
							return
						}
						forceNavigator.listPosition = -1
						ui.quickSearch.focus()
						ui.searchResults=[]
						Object.keys(response.searchRecords).forEach(function (key) {
							let oneResult = response.searchRecords[key]
							let desc = ""
							Object.keys(oneResult).forEach(function (key) {
								let val = oneResult[key]
								if (key!="Id" && (typeof val=='string'||typeof val=='number') && !val.match('[a-zA-Z0-9]{15}|[a-zA-Z0-9]{18}'))
									desc += oneResult[key] + " - "
							})
							desc =  desc.slice(0,-3)
							let url = `/lightning/r/${oneResult.attributes.type}/${oneResult.Id}/view`
							ui.searchResults.push({"url":url,"label":desc})
						})
						ui.setSearchResult(ui.searchResults)
					} else {
						console.error("no response from doSearch")
					}
				} catch(e) {
					_d([e, response])
				}
			})
	},
	"loadCompactLayoutIfNeeded": (sobject)=>{
		if (forceNavigator.compactLayoutFieldsForSobject[sobject]==undefined) {
			//load main fields for this object in the background
			let options = {
				"action": "loadCompactLayoutForSobject",
				"apiUrl": forceNavigator.apiUrl,
				"sessionId": forceNavigator.sessionId,
				"sobject" : sobject,
				"compactLayoutFieldsForSobject": forceNavigator.compactLayoutFieldsForSobject
			}
			chrome.runtime.sendMessage(options,
				response=>{
					if (response?.mainFields!=undefined) {
						forceNavigator.compactLayoutFieldsForSobject[sobject] = response.mainFields
					}
				})
			}
	},
	"kbdCommand": (e, keyPress)=>{
		//kbdCommand is called when enter/ctrl+enter/command+enter/shift+enter/TAB is pressed
		//If enter is pressed:
		//   in case of a command, do the selected command
		//	 in case of a partial search (? and an object name), expand the possible objects (? prod --> ? product)
		//   in case of search, do the search.  If a search was already done and the user chose a result, go to it's URL
		//If TAB is pressed:
		//   in case of a search, try to expand the object
		//	 in case of a partial search (? and an object name), expand the possible objects (? prod --> ? product)
		//   in case of a command, try to expand meta data (load fields for objects, report names for reports, etc)

		// translate the text entered to command from the dropdown , if exists:
		let cmdKey = ui.navOutput.childNodes[(forceNavigator.listPosition < 0 ? 0 : forceNavigator.listPosition)]?.dataset
		let details = e.target
		if(keyPress == "tab") {
			//Tab pressed.  Two options:   if this is a search (search strinwith a ?), expand fields
			//otherwise, try to get more info on the currently selected object
			switch(ui.lookupMode) {
				case LOOKUP_MODE_SHOW_SEARCH_RESULTS:
					return false
				case LOOKUP_MODE_SHOW_COMMANDS :
					ui.debounceGetMoreData(true)
					return false
				case LOOKUP_MODE_COMPLETE_OBJECT_NAME:
					if (cmdKey!=undefined) {
						if (cmdKey.key.includes(" "))
							cmdKey.key = `"${cmdKey.key}"`
						ui.quickSearch.value = "? " + cmdKey.key + " "
					}
					ui.debounceGetMoreData(true)
					return false
			}
		}
		if(!cmdKey?.key?.startsWith("commands.loginAs.") && e.target.value.toLowerCase().includes(t("prefix.loginAs").toLowerCase())) {
			cmdKey = "commands.loginAs"
			//details = ui.quickSearch.value
		}
console.log(cmdKey)
		switch(ui.lookupMode) {
			case LOOKUP_MODE_SHOW_SEARCH_RESULTS:
				//Search mode
				if (forceNavigator.listPosition>=0) {
					let selectedResult = ui.searchResults[forceNavigator.listPosition]
					if(selectedResult && selectedResult?.url) {
						let newTab = forceNavigator.newTabKeys.indexOf(keyPress) >= 0 ? true : false
						if(!newTab)
							ui.clearOutput()
						//Add the command to 'recent commands' list
						chrome.runtime.sendMessage({
							"action": "updateLastCommand",
							"orgId":forceNavigator.organizationId,
							"key": selectedResult.label,
							"url": selectedResult.url
						})
						forceNavigator.goToUrl(selectedResult.url, newTab)
					}
					return false
				}
				ui.doSearch(e)
				return
			case LOOKUP_MODE_SHOW_COMMANDS :
				if (e.target.value=="") {
					//Nothing entered on the input box.  going to a record from the history list
					let selectedResult = ui.searchResults[forceNavigator.listPosition]
					if(selectedResult && selectedResult?.url) {
						let newTab = forceNavigator.newTabKeys.indexOf(keyPress) >= 0 ? true : false
						if(!newTab)
							ui.clearOutput()
						forceNavigator.goToUrl(selectedResult.url, newTab)
					}
				}
				let newTab = forceNavigator.newTabKeys.indexOf(keyPress) >= 0 ? true : false
				if(!newTab)
					ui.clearOutput()
				forceNavigator.invokeCommand(cmdKey, newTab, details)
				break
			case LOOKUP_MODE_COMPLETE_OBJECT_NAME:
				return false
		}
	},
	"selectMove": (direction)=>{
		ui.debounceGetMoreData()
		let words = Array.from(ui.navOutput.childNodes).reduce((a,w)=>a.concat([w.textContent]), [])
		let isLastPos = direction == 'down'
			? forceNavigator.listPosition < words.length-1 // is at the bottom
			: forceNavigator.listPosition >= 0 // so direction = up, is at the top
		if (words.length > 0 && isLastPos) {
			forceNavigator.listPosition = forceNavigator.listPosition + (direction == 'down' ? 1 : -1)
			if(forceNavigator.listPosition < 0)
				forceNavigator.listPosition = 0
			if (forceNavigator.listPosition >=0) {
				ui.navOutput.childNodes[forceNavigator.listPosition + (direction == 'down' ? -1 : 1) ]?.classList.remove('sfnav_selected')
				ui.navOutput.childNodes[forceNavigator.listPosition]?.classList.add('sfnav_selected')
				try { ui.navOutput.childNodes[forceNavigator.listPosition]?.scrollIntoViewIfNeeded() }
				catch { ui.navOutput.childNodes[forceNavigator.listPosition]?.scrollIntoView() }
				return false
			}
		}
	},
	"debounceTypingTimer" : null,
	"debounceGetMoreData":(tabPressed = false)=>{
		//Call getMoreData with a dealy, so it will be called only when the user stopped typing
		clearTimeout(ui.debounceTypingTimer)
		if (tabPressed) {
			ui.getMoreData(tabPressed = true)
		} else {
			//get more
			ui.debounceTypingTimer = setTimeout(ui.getMoreData, 1000)
		}
	},
	"getMoreData":(tabPressed = false)=>{
		if (ui.lookupMode == LOOKUP_MODE_COMPLETE_OBJECT_NAME) {
			let input = ui.quickSearch.value
			if(input.match(/"/g)?.length %2 != 0) {
				//if number of \" is odd, add another one at the end.  This way ' ? "account brand"   ' can work
				input += "\""
			}
			const searchQuery = input.split(/([^\s"]+|"[^"]*")+/g).filter(value => (value != ' ' && value != ''))
			const searchObject = searchQuery[1].toLowerCase()
			ui.clearOutput()
			ui.loadCompactLayoutIfNeeded(searchObject)
			let i = 0
			let objectsCompletionKeys=[]
			for (let key in forceNavigator.labelToSobjectApiNameMapping) {
				if (i < forceNavigatorSettings.MAX_SEARCH_RESULTS && key.startsWith(searchObject)) {
					objectsCompletionKeys.push(key)
					i++
				}
			}
			//add the shortest keys first
			objectsCompletionKeys.sort((a, b) => { return a.length - b.length })
			objectsCompletionKeys.forEach(key => ui.addSearchResult(key,'"'+key+'"') )
			for (let key in forceNavigator.labelToSobjectApiNameMapping) {
				if (i<forceNavigatorSettings.MAX_SEARCH_RESULTS && key.includes(searchObject) && !key.startsWith(searchObject)) {
					ui.addSearchResult(key,'"'+key+'"')
					i++
				}
			}
			return
		}
		let keyToExpand = undefined
		if (ui.navOutput.childNodes.length == 0 && ui.quickSearch?.value?.length>0) {
			//There in nothing in the lookup table, meaning there is no matching command.
			//It could be that the user entered a value that is not yet loaded, for example "Case > Fields CaseNumber".  Remove the last element, and see if "Case > Fields" is something
			//I can expand:
			let reducedCommand = ui.quickSearch.value.split(' ')
			reducedCommand.pop()
			reducedCommand =  reducedCommand.join(' ')
			let words = ui.filterCommandList(reducedCommand)
			if(words.length > 0) {
				keyToExpand = words[0]
			}
		} else {
			//The lookup table has some values.  take the selected/first one and try to get more data for it/
			let cmdKey = ui.navOutput.childNodes[(forceNavigator.listPosition < 0 ? 0 : forceNavigator.listPosition)]?.dataset
			keyToExpand = cmdKey?.key
		}
		if (keyToExpand == undefined)
			return
		if(typeof forceNavigator.commands[keyToExpand] != 'undefined') {
			let options = {
				"action": "getMoreData",
				"sourceCommand" : forceNavigator.commands[keyToExpand],
				"sessionHash": forceNavigator.sessionHash,
				"domain": forceNavigator.serverInstance,
				"serverUrl": forceNavigator.serverUrl,
				"apiUrl": forceNavigator.apiUrl,
				"key": forceNavigator.organizationId,
				"sessionId": forceNavigator.sessionId,
			}
			chrome.runtime.sendMessage(
				options,
				response=>{
					if(response && response.info) { console.info("info expanding: " + response.info); return }
					try {
						if (response) {
							Object.assign(forceNavigator.commands, response)
							forceNavigator.commands[keyToExpand].detailsAlreadyLoaded = "Yes"
						} else {
							console.log("no response from getMoreData")
						}
						forceNavigator.listPosition = -1
						//update the quicksearch to have the new data appear, if the user pressed TAB. otherwise, just update the lookup values but don't change the text the user entered
						if (tabPressed)
							ui.quickSearch.value = forceNavigator.commands[keyToExpand].label + ' > '
						ui.quickSearch.focus()
						ui.lookupCommands()
					} catch(e) {
						_d([e, response])
					}
				}
			)
		}
	}
}

export const forceNavigatorSettings = {
	"MAX_SEARCH_RESULTS": 32,
	"theme":'theme-default',
	"searchLimit": 16,
	"commands": {},
	"enhancedprofiles": true,
	"debug": true,
	"developername": false,
	"lightningMode": true,
	"language": "en-US",
	"skipObjects": ["0DM"],
	"availableThemes": ["Default", "Dark", "Unicorn", "Solarized"],
	"ignoreList": null, // ignoreList will be for filtering custom objects, will need an add, remove, and list call
	"changeDictionary": (newLanguage) => lisan.add(require("./languages/" + newLanguage + ".js")),
	"setTheme": (command)=>{
		const newTheme = "theme-" + command.replace('commands.themes','').toLowerCase()
		document.getElementById('sfnavStyleBox').classList = [newTheme]
		forceNavigatorSettings.set("theme", newTheme)
	},
	"settingsOnly": ()=>JSON.parse(JSON.stringify(forceNavigatorSettings)),
	"set": (key, value)=>{ let s={}; s[key]=value; chrome.storage.sync.set(s, response=>forceNavigator.refreshAndClear()) },
	"loadSettings": ()=>{
		chrome.storage.sync.get(forceNavigatorSettings, settings=>{
			for(const k in settings) { forceNavigatorSettings[k] = settings[k] }
			forceNavigator.serverInstance = forceNavigator.getServerInstance(forceNavigatorSettings)
			if(forceNavigatorSettings.theme)
				document.getElementById('sfnavStyleBox').classList = [forceNavigatorSettings.theme]
			if(forceNavigator.sessionId !== null) { return }
			if(forceNavigator.serverUrl?.includes('https://test.salesforce.com')) { return }
			chrome.runtime.sendMessage({ "action": "getApiSessionId", "serverUrl": forceNavigator.serverUrl }, response=>{
				if(response && response.error) { console.error("response", JSON.stringify(response), chrome.runtime.lastError); return }
				try {
					forceNavigator.sessionId = unescape(response.sessionId)
					forceNavigator.userId = unescape(response.userId)
					forceNavigator.organizationId= unescape(response.orgId)
					forceNavigator.apiUrl = unescape(response.apiUrl)
					forceNavigator.loadCommands(forceNavigatorSettings)
				} catch(e) {
					_d([e, response, chrome.runtime.lastError])
				}
				ui.hideLoadingIndicator()
			})
		})
	}
}

export const forceNavigator = {
	"organizationId": null,
	"userId": null,
	"sessionId": null,
	"sessionHash": null,
	"serverInstance": null,
	"serverUrl": null,
	"apiUrl": null,
	"apiVersion": "v56.0",
	"loaded": false,
	"listPosition": -1,
	"ctrlKey": false,
	"debug": false,
	"newTabKeys": [ "ctrl+enter", "command+enter", "shift+enter" ],
	"regMatchSid_Client" : /sid_Client=([a-zA-Z0-9\.\!]+)/,
	"otherExtensions": [{
		"platform": "chrome-extension",
		"id": "aodjmnfhjibkcdimpodiifdjnnncaafh",
		"urlId": "aodjmnfhjibkcdimpodiifdjnnncaafh",
		"name": "Salesforce Inspector",
		"checkData": {"message": "getSfHost", "url": location.href},
		"commands": [
			{"url": "/data-export.html?host=$APIURL", "key": "other.inspector.dataExport"},
			{"url": "/inspect.html?host=$APIURL&objectType=$SOBJECT&recordId=$RECORDID", "key": "other.inspector.showAllData"}
		]
	},{
		"platform": "moz-extension",
		"id": "jid1-DBcuAQpfLMcvOQ@jetpack",
		"urlId": "84da8919-e6e9-4aae-ac9c-7f68b87003a1",
		"name": "Salesforce Inspector",
		"checkData": {"message": "getSfHost", "url": location.href},
		"commands": [
			{"url": "/data-export.html?host=$APIURL", "key": "other.inspector.dataExport"},
			{"url": "/inspect.html?host=$APIURL&objectType=$SOBJECT&recordId=$RECORDID", "key": "other.inspector.showAllData"}
		]
	}],
	"commands": {},
	"labelToSobjectApiNameMapping":{},
	"labelToNameFieldMapping":{},
	"compactLayoutFieldsForSobject":{},  //for each object, what are the most important fields to display it. taken from the conmpact layout
	"init": ()=>{
		try {
			document.onkeyup = (ev)=>{ window.ctrlKey = ev.ctrlKey }
			document.onkeydown = (ev)=>{ window.ctrlKey = ev.ctrlKey }
			forceNavigator.serverInstance = forceNavigator.getServerInstance(forceNavigatorSettings)
			forceNavigator.organizationId = forceNavigator.serverInstance || forceNavigator.organizationId
			forceNavigator.sessionHash = forceNavigator.getSessionHash()
            forceNavigator.urlMap = {
                ...forceNavigator.urlMap,
                ...require('./generatedSetupUrls.json')
            }
			forceNavigatorSettings.loadSettings()
			lisan.setLocaleName(forceNavigatorSettings.language)
			forceNavigator.resetCommands()
			ui.createBox()
			ui.bindShortcuts()
			if(forceNavigatorSettings.enhancedprofiles) {
				delete forceNavigator.commands["setup.profiles"]
			} else {
				delete forceNavigator.commands["setup.enhancedProfiles"]
			}
		} catch(e) {
			_d(e)
		}
	},
	"createSObjectCommands": (commands, sObjectData,qualifiedApiNameToDurableIdMap, serverUrl) => {
        console.log('in createSObjectCommands', qualifiedApiNameToDurableIdMap)
		const { labelPlural, label, name, keyPrefix } = sObjectData
		const mapKeys = Object.keys(forceNavigator.objectSetupLabelsMap)
		if (!keyPrefix || forceNavigatorSettings.skipObjects.includes(keyPrefix)) { return commands }
		let baseUrl = ""
		if (forceNavigatorSettings.lightningMode && name.endsWith("__mdt")) { baseUrl += "/lightning/setup/CustomMetadata/page?address=" }
		commands[keyPrefix + ".list"] = {
			"key": keyPrefix + ".list",
			"url": `${baseUrl}/${keyPrefix}`,
			"label": t("prefix.list") + " " + labelPlural,
			"apiname": name
		}
		commands[keyPrefix + ".new"] = {
			"key": keyPrefix + ".new",
			"url": `${baseUrl}/${keyPrefix}/e`,
			"label": t("prefix.new") + " " + label,
			"apiname": name
		}
		if(forceNavigatorSettings.lightningMode) {
			let targetUrl = serverUrl + "/lightning/setup/ObjectManager/" + (qualifiedApiNameToDurableIdMap[name] ?? name)
			mapKeys.forEach(key=>{
				commands[keyPrefix + "." + key] = {
					"key": keyPrefix + "." + key,
					"url": targetUrl + forceNavigator.objectSetupLabelsMap[key],
					"label": [t("prefix.setup"), label, t(key)].join(" > "),
					"apiname": name
				}
			})
		} else {
			// TODO maybe figure out how to get the url for Classic
			commands[t("prefix.setup") + label] = { "url": keyPrefix, "key": key}
		}
		return commands
	},
	"dumpToConsole":(command,event,forceNavigatorSettings)=>{
		console.info("DUMP:")
		console.info("	Command:", command)
		console.info("	Event:", event)
		console.info("	value:", event?.value)
		console.info("	session settings:", forceNavigatorSettings)
		console.info("	server instance: ", forceNavigator.serverInstance)
		console.info("	API Url: ", forceNavigator.apiUrl)
		//Filter the dump: event?.value is the text the user entered.   assume the syntax "dump xxx yyy zzz" and show only lines that match
		//the filter parameters
		let parameters = event?.value?.split(" ")
		if(parameters) {
			parameters.shift()
		} else {
			parameters[0]=""
		}
		//console.info("Commands: ", forceNavigator.commands)
		console.info("	Commands that contain " , parameters ,  ":")
		let tempResultTable=[]
		let tempCount = 0
		for(const key in forceNavigator.commands) {
			const label = (forceNavigator.commands[key]?.label ?? "")
			const url = (forceNavigator.commands[key]?.url ?? "").substring(0,100)
			const apiname = (forceNavigator.commands[key]?.apiname ?? "").substring(0,20)
			const key_label_apiname=(key+label+url+apiname).toLowerCase()
			//If all elements of parameter[] appear in key_label_apiname, print it
			if(parameters.every(item => key_label_apiname.includes(item))) {
				tempResultTable.push([label,key,apiname,url])
				tempCount++
			}
		}
		console.table(tempResultTable)
		console.info(tempCount + " records dumped")
		console.info("	labelToNameFieldMapping that contain " , parameters ,  ":")
		tempResultTable=[]
		tempCount = 0
		for(const key in forceNavigator.labelToNameFieldMapping) {
			const val = forceNavigator.labelToNameFieldMapping[key]
			if(parameters.every(item => (key + val).includes(item))) {
				tempResultTable.push([key,val])
				tempCount++
			}
		}
		console.table(tempResultTable)
		console.info(tempCount + " records dumped")
	},
	"invokeCommand": (command, newTab, event)=>{
		if(!command && event?.value) {
			//if the command is not recognised. used the textbox value itself
			command = {"key": event?.value}
		}
		let targetUrl=""
		if(typeof command != "object")
			command = {"key": command}
		if(typeof forceNavigator.commands[command.key] != 'undefined' && forceNavigator.commands[command.key].url) {
			targetUrl = forceNavigator.commands[command.key].url
		}
		if(command.key?.startsWith("commands.loginAs.")) {
			forceNavigator.loginAsPerform(command.key.replace("commands.loginAs.",""), newTab)
			return true
		} else if(command.key?.startsWith("commands.themes")) {
			forceNavigatorSettings.setTheme(command.key)
			return true
		} else if(command.key?.startsWith("other")) {
			switch(command.key) {
				case "other.inspector.showAllData":
					const matching = location.href.match(/\/r\/([\w_]+)\/(\w+)/)
					const sObject = matching[1]
					const recordId = matching[2]
					targetUrl = forceNavigator.commands[command.key].url.replace("$SOBJECT", sObject).replace("$RECORDID", recordId)
			}
		} else if (command.key.startsWith("dump")) {
			forceNavigator.dumpToConsole(command,event,forceNavigatorSettings)
			ui.hideSearchBox()
			return true
		}
		//Add the command to 'recent commands' list
		chrome.runtime.sendMessage({
			"action": "updateLastCommand",
			"orgId":forceNavigator.organizationId,
			"key": command.key,
			"url": targetUrl
		})
		switch(command.key) {
			case "commands.refreshMetadata":
				forceNavigator.refreshAndClear()
				return true
			case "commands.objectManager":
				targetUrl = forceNavigator.serverInstance + "/lightning/setup/ObjectManager/home"
				break
			case "switch to classic":
			case "switch to lightning":
			case "commands.toggleLightning":
				let mode = forceNavigatorSettings.lightningMode ? "classic" : "lex-campaign"
				const matchUrl = window.location.href.replace(window.location.origin,"")
				targetUrl = forceNavigator.serverInstance + "/ltng/switcher?destination=" + mode + "&referrer=" + encodeURIComponent(matchUrl)
				forceNavigatorSettings.lightningMode = mode === "lex-campaign"
				forceNavigatorSettings.set("lightningMode", forceNavigatorSettings.lightningMode)
				break
			case "commands.toggleEnhancedProfiles":
				forceNavigatorSettings.enhancedprofiles = !forceNavigatorSettings.enhancedprofiles
				forceNavigatorSettings.set("enhancedprofiles", forceNavigatorSettings.enhancedprofiles)
				return true
			case "commands.toggleDeveloperName":
				forceNavigatorSettings.developername = !forceNavigatorSettings.developername
				forceNavigatorSettings.set("developername", forceNavigatorSettings.developername)
				return true
			case "commands.setup":
				targetUrl = forceNavigator.serverInstance + (forceNavigatorSettings.lightningMode ? "/lightning/setup/SetupOneHome/home" : "/ui/setup/Setup")
				break
			case "commands.home":
				targetUrl = forceNavigator.serverInstance + "/"
				break
			case "commands.logout":
				targetUrl = forceNavigator.serverInstance + "/secur/logout.jsp"
				break
			case "commands.help":
				chrome.runtime.sendMessage({"action": "help"})
				ui.hideSearchBox()
				return true
			case "commands.toggleAllCheckboxes":
				Array.from(document.querySelectorAll('input[type="checkbox"]')).forEach(c => c.checked=(c.checked ? false : true))
				ui.hideSearchBox()
				break
			case "commands.loginAs":
				forceNavigator.loginAs(command, newTab)
				return true
			case "commands.search":
				targetUrl = forceNavigator.searchTerms(ui.quickSearch.value.substring(1).trim())
				break
		}
		if(command.key.replace(/\d+/,'').trim().split(' ').reduce((i,c) => {
			if('set search limit'.includes(c))
				return ++i
			else
				return i
		}, 0) > 1) {
			const newLimit = parseInt(command.replace(/\D+/,''))
			if(newLimit != NaN && newLimit <= MAX_SEARCH_RESULTS) {
				forceNavigatorSettings.searchLimit = newLimit
				forceNavigatorSettings.set("searchLimit", forceNavigatorSettings.searchLimit)
					.then(result=>ui.addSearchResult("notification.searchSettingsUpdated"))
				return true
			} else
				ui.addError(t("error.searchLimitMax"))
		}
		if(!targetUrl) {
			console.error('No command match', command)
			return false
		}
		ui.hideSearchBox()
		forceNavigator.goToUrl(targetUrl, newTab, {command: command})
		return true
	},
	"resetCommands": ()=>{
		const modeUrl = forceNavigatorSettings.lightningMode ? "lightning" : "classic"
		forceNavigator.commands = {}
		Array(
			"commands.home",
			"commands.logout",
			"commands.setup",
			"commands.toggleAllCheckboxes",
			"commands.toggleLightning",
			"commands.help",
			"commands.objectManager",
			"commands.dumpDebug",
			"commands.setSearchLimit",
			"commands.loginAs",
			"commands.toggleEnhancedProfiles",
			"commands.refreshMetadata",
			"report.runReport",
			"report.editReport",
		).filter(i=>i).forEach(c=>{forceNavigator.commands[c] = {"key": c}})
		forceNavigatorSettings.availableThemes.forEach(th=>forceNavigator.commands["commands.themes" + th] = { "key": "commands.themes" + th })
		Object.keys(forceNavigator.urlMap).forEach(c=>{
			forceNavigator.commands[c] = {
				"key": c,
				"url": forceNavigator.urlMap[c][modeUrl],
				"label": [t("prefix.setup"), t(c)].join(" > ")
			}
		})
	},
	"searchTerms": (terms)=>{
		// TODO doesn't work from a searched page in Lightning, SF just won't reparse the update URL because reasons, looks like they hijack the navigate event
		let searchUrl = forceNavigator.serverInstance
		searchUrl += (!forceNavigatorSettings.lightningMode)
		? "/_ui/search/ui/UnifiedSearchResults?sen = ka&sen = 500&str=" + encodeURI(terms) + "#!/str=" + encodeURI(terms) + "&searchAll = true&initialViewMode = summary"
		: "/one/one.app?forceReload#" + btoa(JSON.stringify({
			"componentDef":"forceSearch:search",
			"attributes":{
				"term": terms,
				"scopeMap": { "type":"TOP_RESULTS" },
				"context":{
					"disableSpellCorrection":false,
					"SEARCH_ACTIVITY": {"term": terms}
				}
			}
		}))
		return searchUrl
	},
	"getServerInstance": (settings = {})=>{
		let serverUrl
		let url = location.origin + ""
		if(settings.lightningMode) {// if(url.indexOf("lightning.force") != -1)
            serverUrl = url.replace(/my\.salesforce\.com$/, 'lightning.force.com').replace(/my\.salesforce-setup\.com$/, 'lightning.force.com')
		} else {
			if(url.includes("salesforce"))
				serverUrl = url.substring(0, url.indexOf("salesforce")) + "salesforce.com"
			else if(url.includes("cloudforce"))
				serverUrl = url.substring(0, url.indexOf("cloudforce")) + "cloudforce.com"
			else if(url.includes("visual.force")) {
				let urlParseArray = url.split(".")
				serverUrl = urlParseArray[1] + '.salesforce.com'
			} else {
				serverUrl = url.replace('lightning.force.com','') + "my.salesforce.com"
			}
		}
		forceNavigator.serverUrl = serverUrl
		return serverUrl
	},
	"getSessionHash": ()=>{
		try {
			let sessionHash = document.cookie?.match(forceNavigator.regMatchSid_Client)[1]
			return sessionHash
		} catch(e) { _d([e]) }
	},
	"getHTTP": (getUrl, type = "json", headers = {}, data = {}, method = "GET") => {
		let request = { method: method, headers: headers }
		if(Object.keys(data).length > 0)
			request.body = JSON.stringify(data)
		return fetch(getUrl, request).then(response => {
            forceNavigator.apiUrl = new URL(response.url).host;
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
	},
    "getServiceDataHTTP" :(endpoint, type = "json", request = {}, data = {}, method = "GET") => {
        return forceNavigator.getHTTP(
            "https://" + request.apiUrl + '/services/data/' + forceNavigator.apiVersion + endpoint,
            type,
            {"Authorization": "Bearer " + request.sessionId, "Accept": "application/json"},
            data,
            method
        )
    },
	"refreshAndClear": ()=>{
		ui.showLoadingIndicator()
		forceNavigator.serverInstance = forceNavigator.getServerInstance(forceNavigator)
		forceNavigator.loadCommands(forceNavigatorSettings, true)
		forceNavigator.labelToNameFieldMapping={}
		forceNavigator.nameToLabelFieldMapping={}
		forceNavigator.compactLayoutFieldsForSobject={}
		document.getElementById("sfnavQuickSearch").value = ""
	},
	"loadCommands": (settings, force = false) => {
		if([forceNavigator.serverInstance, forceNavigator.organizationId, forceNavigator.sessionId].includes(null)) {
			return forceNavigator.init()
		}
		if(force || Object.keys(forceNavigator.commands).length === 0)
			forceNavigator.resetCommands()
		let options = {
			"sessionHash": forceNavigator.sessionHash,
			"domain": forceNavigator.serverInstance,
			"apiUrl": forceNavigator.apiUrl,
			"key": forceNavigator.organizationId,
				"force": force,
				"sessionId": forceNavigator.sessionId,
				"serverUrl" : forceNavigator.serverUrl,
				"action": "getMetadata"
			}
		chrome.runtime.sendMessage(options, response=>Object.assign(forceNavigator.commands, response))
		chrome.runtime.sendMessage(Object.assign(options, {"action": "getSobjectNameFields"}), response=>{
				Object.assign(forceNavigator.labelToNameFieldMapping, response.labelToNameFieldMapping)
				Object.assign(forceNavigator.labelToSobjectApiNameMapping, response.labelToSobjectApiNameMapping)
				//console.log("after getSobjectNameFields, loaded forceNavigator.labelToNameFieldMapping=",Object.keys(forceNavigator.labelToNameFieldMapping).length)
		})
		chrome.runtime.sendMessage(Object.assign(options, {"action": "getActiveFlows"}), response=>Object.assign(forceNavigator.commands, response))
		forceNavigator.otherExtensions.filter(e=>{ return e.platform == (!!window.chrome ? "chrome-extension" : "moz-extension") }).forEach(e=>chrome.runtime.sendMessage(
			Object.assign(options, { "action": "getOtherExtensionCommands", "otherExtension": e }), r=>{ return Object.assign(forceNavigator.commands, r) })
		)
		ui.hideLoadingIndicator()
	},
	"goToUrl": (url, newTab, settings={})=>chrome.runtime.sendMessage({
		action: "goToUrl",
		url: url,
		newTab: newTab,
		settings: Object.assign(forceNavigatorSettings.settingsOnly(), {
				serverInstance: forceNavigator.serverInstance,
				lightningMode: forceNavigatorSettings.lightningMode
			})
		},
		response=>{}),
	"loginAs": (cmd, newTab)=>{
		let searchValue = ui.searchBox.querySelector('input').value.toLowerCase().replace(t("prefix.loginAs").toLowerCase(), "")
		if(![null,undefined,""].includes(searchValue) && searchValue.length > 1) {
			ui.showLoadingIndicator()
			chrome.runtime.sendMessage({
				action:'searchLogins', apiUrl: forceNavigator.apiUrl,
				sessionId: forceNavigator.sessionId,
				domain: forceNavigator.serverInstance,
				searchValue: searchValue, userId: forceNavigator.userId
			}, success=>{
				let numberOfUserRecords = success.records.length
				ui.hideLoadingIndicator()
				if(numberOfUserRecords < 1) { ui.addError([{"message":"No user for your search exists."}]) }
				else if(numberOfUserRecords > 1) { forceNavigator.loginAsShowOptions(success.records) }
				else {
					var userId = success.records[0].Id
					forceNavigator.loginAsPerform(userId, newTab)
				}
			})
		}
	},
	"loginAsShowOptions": (records)=>{
		for(let i = 0; i < records.length; ++i) {
			forceNavigator.commands["commands.loginAs." + records[i].Id] = {
				"key": "commands.loginAs." + records[i].Id,
				"userId": records[i].Id,
				"label": t("prefix.loginAs") +" "+ records[i].Name
			}
			ui.addSearchResult("commands.loginAs." + records[i].Id)
		}
		let firstEl = document.querySelector('#sfnavOutput :first-child')
		if(firstEl != null) firstEl.className = "sfnav_child sfnav_selected"
	},
	"loginAsPerform": (userId, newTab)=>{
		let targetUrl = "https://" + forceNavigator.apiUrl + "/servlet/servlet.su?oid=" + forceNavigator.organizationId + "&suorgadminid=" + userId + "&retURL=" + encodeURIComponent(window.location.pathname) + "&targetURL=" + encodeURIComponent(window.location.pathname) + "&"
		ui.hideSearchBox()
		console.log ("login as url=" + targetUrl)
		if(newTab) forceNavigator.goToUrl(targetUrl, true)
		else forceNavigator.goToUrl(targetUrl)
		return true
	},
	"objectSetupLabelsMap": {
		"objects.details": "/Details/view",
		"objects.fieldsAndRelationships": "/FieldsAndRelationships/view",
		"objects.pageLayouts": "/PageLayouts/view",
		"objects.lightningPages": "/LightningPages/view",
		"objects.buttonsLinksActions": "/ButtonsLinksActions/view",
		"objects.compactLayouts": "/CompactLayouts/view",
		"objects.fieldSets": "/FieldSets/view",
		"objects.limits": "/Limits/view",
		"objects.recordTypes": "/RecordTypes/view",
		"objects.relatedLookupFilters": "/RelatedLookupFilters/view",
		"objects.searchLayouts": "/MySearchLayouts/view",
		"objects.triggers": "/ApexTriggers/view",
		"objects.validationRules": "/ValidationRules/view"
	},
	"standardObjects": [
		{ "label": "Account", "name": "Account", "labelPlural": "Accounts", "keyPrefix": "001" },
		{ "label": "Apex Class", "name": "ApexClass", "labelPlural": "Apex Classes", "keyPrefix": "01p" },
		{ "label": "Apex Trigger", "name": "ApexTrigger", "labelPlural": "Apex Triggers", "keyPrefix": "01q" },
		{ "label": "Asset Relationship", "name": "AssetRelationship", "labelPlural": "Asset Relationships", "keyPrefix": "1AR" },
		{ "label": "Asset", "name": "Asset", "labelPlural": "Assets", "keyPrefix": "02i" },
		{ "label": "Assignment Rule", "name": "AssignmentRule", "labelPlural": "Assignment Rules", "keyPrefix": "01Q" },
		{ "label": "Attachment", "name": "Attachment", "labelPlural": "Attachments", "keyPrefix": "00P" },
		{ "label": "Campaign", "name": "Campaign", "labelPlural": "Campaigns", "keyPrefix": "701" },
		{ "label": "Case", "name": "Case", "labelPlural": "Cases", "keyPrefix": "500" },
		{ "label": "Contact", "name": "Contact", "labelPlural": "Contacts", "keyPrefix": "003" },
		{ "label": "Contract", "name": "Contract", "labelPlural": "Contracts", "keyPrefix": "800" },
		{ "label": "Customer", "name": "Customer", "labelPlural": "Customers", "keyPrefix": "0o6" },
		{ "label": "Dashboard", "name": "Dashboard", "labelPlural": "Dashboards", "keyPrefix": "01Z" },
		{ "label": "Document", "name": "Document", "labelPlural": "Documents", "keyPrefix": "015" },
		{ "label": "Duplicate Rule", "name": "DuplicateRule", "labelPlural": "Duplicate Rules", "keyPrefix": "0Bm" },
		{ "label": "Email Message", "name": "EmailMessage", "labelPlural": "Email Messages", "keyPrefix": "02s" },
		{ "label": "Email Template", "name": "EmailTemplate", "labelPlural": "Email Templates", "keyPrefix": "00X" },
		{ "label": "Event", "name": "Event", "labelPlural": "Events", "keyPrefix": "00U" },
		{ "label": "Idea", "name": "Idea", "labelPlural": "Ideas", "keyPrefix": "087" },
		{ "label": "Individual", "name": "Individual", "labelPlural": "Individuals", "keyPrefix": "0PK" },
		{ "label": "Note (Content)", "name": "ContentNote", "labelPlural": "Notes", "keyPrefix": "069" },
		{ "label": "Note", "name": "Note", "labelPlural": "Notes", "keyPrefix": "002" },
		{ "label": "Opportunity", "name": "Opportunity", "labelPlural": "Opportunities", "keyPrefix": "006" },
		{ "label": "Order", "name": "Order", "labelPlural": "Orders", "keyPrefix": "801" },
		{ "label": "Permission Set", "name": "PermissionSet", "labelPlural": "Permission Sets", "keyPrefix": "0PS" },
		{ "label": "Lead", "name": "Lead", "labelPlural": "People", "keyPrefix": "00Q" },
		{ "label": "Price Book", "name": "Pricebook2", "labelPlural": "Price Books", "keyPrefix": "01s" },
		{ "label": "Product", "name": "Product2", "labelPlural": "Products", "keyPrefix": "01t" },
		{ "label": "Profile", "name": "Profile", "labelPlural": "Profile", "keyPrefix": "00e" },
		{ "label": "Prompt Version", "name": "PromptVersion", "labelPlural": "Prompt Versions", "keyPrefix": "0bt" },
		{ "label": "Prompt", "name": "Prompt", "labelPlural": "Prompts", "keyPrefix": "0bs" },
		{ "label": "Quote", "name": "Quote", "labelPlural": "Quotes", "keyPrefix": "0Q0" },
		{ "label": "Report", "name": "Report", "labelPlural": "Reports", "keyPrefix": "00O" },
		{ "label": "Social Persona", "name": "SocialPersona", "labelPlural": "Social Personas", "keyPrefix": "0SP" },
		{ "label": "Solution", "name": "Solution", "labelPlural": "Solutions", "keyPrefix": "501" },
		{ "label": "Static Resource", "name": "StaticResource", "labelPlural": "Static Resources", "keyPrefix": "081" },
		{ "label": "Survey", "name": "Survey", "labelPlural": "Surveys", "keyPrefix": "0Kd" },
		{ "label": "Task", "name": "Task", "labelPlural": "Tasks", "keyPrefix": "00T" },
		{ "label": "Topic", "name": "Topic", "labelPlural": "Topics", "keyPrefix": "0TO" },
		{ "label": "Visualforce Component", "name": "ApexComponent", "labelPlural": "Visualforce Components", "keyPrefix": "099" },
		{ "label": "Visualforce Page", "name": "ApexPage", "labelPlural": "Visualforce Pages", "keyPrefix": "066" }
	],
	"urlMap": {
		"report.runReport": {
			"lightning":"/lightning/o/Report/home",
			"classic":"/00O/o"
		},
		"report.editReport": {
			"lightning":"/lightning/o/Report/home",
			"classic":"/00O/o"
		},
	}
}

// Auto-initialize navigator bar in top-level frame
// Initialize navigator after shared.js is fully evaluated
if (typeof window !== 'undefined' && window.top === window) {
    setTimeout(() => {
        try {
            forceNavigator.init();
        } catch (e) {
            console.error('Error initializing forceNavigator:', e);
        }
    }, 0);
}
