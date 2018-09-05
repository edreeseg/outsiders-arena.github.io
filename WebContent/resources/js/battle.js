"use strict";
const PROD_URL = "";
const STAGE_URL = "66.242.90.163:8171";
const DEV_URL = "localhost:8817";
const URL = STAGE_URL;

var ws = null;

function findBattle() {
	var opponentName = $("#playerNameMatchMakingInput").val() || "";
	connectByPlayerName(opponentName);
}

function connectByPlayerName(name) {
	var playerId = $("#playerId").text().substring($("#playerId").text().length - 8, $("#playerId").text().length);
	console.log(playerId);
	$.ajax({method: "GET", url: "http://"+ URL +"/api/player/arena/ " + playerId + "/" + name}).done(function(result) {
		console.log(result);
		var arenaId = result;
		connectByArenaId(arenaId);
	});
}

function connectByArenaId(id) {
	ws = new WebSocket('ws://'+ URL +'/arena/' + id);
    $("#arenaId").html("");
	$("#arenaId").append(id);
	console.log("Connected to Friend!");
	console.log(ws);
	handleMessage();
	setTimeout(sendMatchMakingMessage, 1000);
}

function disconnect() {
    ws.close();
    ws = null;
    console.log("Disconnected");
}

// ------ HANDLE MESSAGES

function handleMessage() {
	ws.onmessage = function(data){
		console.log(data);
		var msg = JSON.parse(data.data);
		var mtp = msg.type;
		if (mtp === "INIT") {
			handleInit(msg);
		} else if (mtp === "ETRADE") {
			handleEnergyTrade(msg);
		} else if (mtp === "UPDATE") {
			handleTurnUpdate(msg);
		} else if (mtp === "CCHECK") {
			handleCostCheck(msg);
		} else if (mtp === "TCHECK") {
			handleTargetCheck(msg);
		} else if (mtp === "END") {
			handleTurnEnd(msg);
		}
	}
}

function sendConnectRequest() {
	var disp = $("#displayNameInput").val().toString() || "NPC";
	var aurl = $("#avatarUrlInput").val().toString() || "https://i.imgur.com/sdOs51i.jpg";
	handleUserInfo(disp, aurl);
	var req = {
			"displayName": disp,
			"avatarUrl": aurl
	};
	$.ajax({method: "POST", url: "http://"+ URL +"/api/player/", data: req}).done(function(result) {
		afterLogin(result);
	});
}

const handlePortraits = (allies, enemies) => {
	const allyFrames = document.getElementsByClassName("ally");
	const enemyFrames = document.getElementsByClassName("enemy");
	const backgrounds = new Map([
	[0, "https://i.imgur.com/qh2cjpd.jpg"], 
	[1, "https://i.imgur.com/yvQeY2q.png"],
	[2, "https://i.imgur.com/YCBrPWg.png"],
	[3, "https://i.imgur.com/uPWgaVl.jpg"],
	[4, "https://i.imgur.com/y2pJyrY.jpg"]
	]);
	for (let i = 0; i < allyFrames.length; i++){
		const allyPortrait = document.createElement("img");
		const enemyPortrait = document.createElement("img");
		allyPortrait.setAttribute("src", backgrounds.get(allies[i].characterId));
		allyPortrait.style.maxHeight = "100%";
		allyPortrait.style.maxWidth = "100%";
		allyFrames[i].removeChild(allyFrames[i].childNodes[1]);
		enemyPortrait.setAttribute("src", backgrounds.get(enemies[i].characterId));
		enemyPortrait.style.maxHeight = "100%";
		enemyPortrait.style.maxWidth = "100%";
		allyFrames[i].appendChild(allyPortrait);
		enemyFrames[i].appendChild(enemyPortrait);
	}
}

const handleUserInfo = (name, avatar) => {
	const infoDiv = document.getElementsByClassName("playerBasicInfo")[0];
	for (let i = 0; i < infoDiv.children.length; i++){
		infoDiv.children[i].style.position = "absolute";
		infoDiv.children[i].style.right = "5000px";
	}
	const username = document.createElement("h2");
	username.textContent = name;
	const avatarFrame = document.createElement("img");
	avatarFrame.style.height = "5rem";
	avatarFrame.style.width = "5rem";
	avatarFrame.style.marginRight = "10px";
	avatarFrame.src = avatar;
	infoDiv.style.display = "flex";
	infoDiv.style.alignItems = "center";
	infoDiv.appendChild(avatarFrame);
	infoDiv.appendChild(username);
}

const handleEnergy = (energy) => {
	const battleLogin = document.getElementsByClassName("playerBattleInfo")[0];
	const strengthDiv = document.createElement("div");
	const dexterityDiv = document.createElement("div");
	const arcanaDiv = document.createElement("div");
	const divinityDiv = document.createElement("div");
	strengthDiv.id = "strength";
	dexterityDiv.id = "dexterity";
	arcanaDiv.id = "arcana";
	divinityDiv.id = "divinity";
	const energyTotal = {
		STRENGTH: 0,
		DEXTERITY: 0,
		ARCANA: 0,
		DIVINITY: 0
	};
	for (let i = 0; i < battleLogin.children.length; i++){
		battleLogin.children[i].style.position = "absolute";
		battleLogin.children[i].style.right = "5000px";
	}
	battleLogin.style.flexDirection = "column";
	battleLogin.appendChild(strengthDiv);
	battleLogin.appendChild(dexterityDiv);
	battleLogin.appendChild(arcanaDiv);
	battleLogin.appendChild(divinityDiv);
	for (let entry of energy){
		energyTotal[entry]++;
	}
	for (let key in energyTotal){
		const energyName = document.createElement("span");
		energyName.textContent = `${key}:`;
		energyName.style.marginRight = "10px";
		document.getElementById(key.toLowerCase()).appendChild(energyName);
		for (let i = 0; i < energyTotal[key]; i++){
			const energyBubble = document.createElement("div");
			energyBubble.style.height = "10px";
			energyBubble.style.width = "10px";
			energyBubble.style.borderRadius = "10px";
			energyBubble.style.border = "1px solid black";
			energyBubble.style.marginRight = "5px";
			if (key === "STRENGTH") energyBubble.style.backgroundColor = "red";
			else if (key === "DEXTERITY") energyBubble.style.backgroundColor = "green";
			else if (key === "ARCANA") energyBubble.style.backgroundColor = "blue";
			else if (key === "DIVINITY") energyBubble.style.backgroundColor = "yellow";
			document.getElementById(key.toLowerCase()).appendChild(energyBubble);
		}
	}
}

function afterLogin(result) {
    $("#playerId").html("");
	$("#playerId").append(result.id);
	console.log(result);
}

function handleInit(msg) {
	console.log(msg);
	if (msg.battle.playerIdOne === Number(document.getElementById("playerId").innerHTML)){
		handlePortraits(msg.battle.playerOneTeam, msg.battle.playerTwoTeam);
		handleEnergy(msg.battle.playerOneEnergy);
	} else {
		handlePortraits(msg.battle.playerTwoTeam, msg.battle.playerOneTeam);
		handleEnergy(msg.battle.playerTwoEnergy);
	}
	// HOOO OOOOOOO OOOO BOYYY 
}

function handleEnergyTrade(msg) {
	console.log(msg);
}

function handleTurnUpdate(msg) {
	console.log(msg);
}

function handleCostCheck(msg) {
	console.log(msg);
}

function handleTargetCheck(msg) {
	console.log(msg);
}

function handleTurnEnd(msg) {
	console.log(msg);
}

// ------ SEND MESSAGES

function sendMatchMakingMessage() {
	const chars = Array.from(document.getElementsByClassName("chars"), (x) => x.value); // Indiv. character select.
	console.log(chars);
	var playerId = $("#playerId").text().substring($("#playerId").text().length - 8, $("#playerId").text().length);
	console.log("PlayerID: " + playerId);
	console.log("Chars: " + chars);
	var arenaId = $("#arenaId").text().substring($("#arenaId").text().length - 8, $("#arenaId").text().length);
	console.log("ArenaID: " + arenaId);
	var msg = {
		type: "MATCH_MAKING",
		char1: chars[0],
		char2: chars[1],
		char3: chars[2],
		playerId: playerId,
		arenaId: arenaId,
		opponentName: $("#playerNameMatchMakingInput").val().toString()
	};
	console.log(msg);
	ws.send(JSON.stringify(msg));
}

function sendTurnEnd() {
    ws.send(
		JSON.stringify({
			type: "TURN_END",
			move1: $("#move1").val(),
			move2: $("#move2").val(),
			move3: $("#move3").val(),
			target1: $("#target1").val(),
			target2: $("#target2").val(),
			target3: $("#target3").val()
		})
    );
}

function sendEnergyTrade() {
    ws.send(
		JSON.stringify({
			type: "ENERGY_TRADE",
			arcanaIn: $("#arcana").val(),
			divinityIn: $("#divinity").val(),
			dexterityIn: $("#dexterity").val(),
			strengthIn: $("#strength").val()
		})
    );
}

// ------ EVENT LISTENERS

const handleEventListeners = {
	preventMultipleSelection: (() => {
		const selectors = Array.from(document.getElementsByClassName("chars")); // Create array of character select elements.
		selectors.forEach((x, y) => {
			x.addEventListener("change", () => {  // Add event listener to each element using forEach.
				const currentChars = selectors.map(x => x.value);  // Create array of currently selected character values.
				for (let i = 0; i < selectors.length; i++){ // Iterate through char select elements to change currently selected to disabled.
				const characterOptions = selectors[i].children;
					if (i !== y){ // Only perform these changes on elements that did not trigger the event listener with change.
						Array.from(characterOptions, (x) => { 
							if (!currentChars.some(z => z === x.value)) // Remove disabled attribute if character is not currently selected by other element.
								x.removeAttribute("disabled");
						});
						const currentSelection = characterOptions[x.value]; 
						currentSelection.disabled = "true"; // Add disabled attribute for character option change that triggered event listener.
					}
				}
			});
		});
	})()
}

$(document).ready(function(){
    if (ws != null) {
    	disconnect();
    }
    
    $("#chars option").click(function() {
        if ($("#chars option:selected").length > 3) {
            $(this).removeAttr("selected");
            alert('You can select up to 3 characters only');
        }
    });
});