var utilities = require('./userUtilities.js');

var users = {};
var sockets = {};
var host = undefined;

function User(socket){
	sockets[socket.id] = {
		pos:{x:-1,y:-1,z:-1},
		socket: this,
		currentMap: undefined,
		name: undefined,
		id: socket.id
		};
	var user;
	var id = socket.id;
	
	console.log('[Socket] A user connected: ' + socket.id);
	if(!host) {
		host = sockets[socket.id];
		console.log('[Socket] First user is hosting: ' + socket.id);
	}

	function onConnect(){
		console.log('[User] <' + user.name + '> connected!');
	}
	function onDisconnect(){
		save();
		console.log('[User] <' + user.name + '> disconnected!');
	}

	function save(){
		
	}
	
	function isOnMap(player, map){
		if(!map || !player || !users[player] || !users[player].name)
			return false;
		return users[player].currentMap === map;
	}
	
	socket.on('indentify', function(name){
		console.log("[Socket] A user indentified as: " + name);
		if(utilities.checkIfUserExists(name)){
			socket.emit('identified', undefined);
		}else{
			socket.emit('identified', name);
			user = users[name] = sockets[socket.id];
			user.name = name;
			onConnect();
		}
	});
	socket.on('disconnect', function(){
		if(user && user.name){
			onDisconnect();
			users[user.name] = undefined;
		}
		sockets[socket.id] = undefined;
		console.log('[Socket] A user disconnected: ' + socket.id);
		if(host.id === socket.id) {
			console.log('[Socket] Host disconnected: ' + socket.id + (host.name ? (" <" + host.name + ">") : ""));
			host = undefined;
			for(var id in sockets){
				if(sockets[id]){
					host = sockets[id];
					console.log('[Socket] New host found: ' + host.id + (host.name ? (" <" + host.name + ">") : ""));
					break;
				}
			}
		}

	});
	socket.on('changeMap', function(data){
		var name = data.name;
		var marker = data.marker;
		
		console.log('[User] <' + user.name + '> has changed map to: ' + name);
		for(var playerName in users){
			if(playerName === user.name || !users[playerName])
				continue;
			if(isOnMap(playerName, name)){
				user.socket.onPlayerChangeMap(playerName, true, users[playerName].pos, name, marker);
				users[playerName].socket.onPlayerChangeMap(user.name, true, user.pos, name, marker);
				console.log("  Informed user: " + playerName);
				console.log("  Informed user: " + user.name);
			}else if(isOnMap(playerName, user.currentMap)){
				users[playerName].socket.onPlayerChangeMap(user.name, false, undefined, name, marker);
				console.log("  Informed user: " + playerName);
			}else{
				console.log("  Didn't inform user: " + playerName);
			}
		}
		user.currentMap = name;
	});
	socket.on('updatePosition', function(pos){
		user.pos = pos;
		for(var playerName in users){
			if(isOnMap(playerName, user.currentMap)){
				users[playerName].socket.updatePosition(user.name);
			}
		}
	});
	socket.on('updateAnimation', function(data){
		for(var playerName in users){
			if(isOnMap(playerName, user.currentMap)){
				users[playerName].socket.updateAnimation(user.name, data);
			}
		}
	});
	socket.on('updateAnimationTimer', function(timer){
		for(var playerName in users){
			if(isOnMap(playerName, user.currentMap)){
				users[playerName].socket.updateAnimationTimer(user.name, timer);
			}
		}
	});
	socket.on('spawnEnity', function(entity){
		//console.log(entity.type)
		/*for(var playerName in users){
			if(isOnMap(playerName, user.currentMap)){
				users[playerName].socket.updateAnimationTimer(user.name, timer);
			}
		}*/
	});

	this.updatePosition = function(playerName){
		if(playerName != user.name){
			socket.emit('updatePosition', {player: playerName, pos:users[playerName].pos});
		}
	}
	this.updateAnimation = function(playerName, data){
		if(playerName != user.name){
			socket.emit('updateAnimation', {player: playerName, face: data.face, anim: data.anim});
		}
	}
	this.updateAnimationTimer = function(playerName, timer){
		if(playerName != user.name){
			socket.emit('updateAnimationTimer', {player: playerName, timer: timer});
		}
	}
	
	this.onPlayerChangeMap = function(playerName, enters, pos, name, marker){
		if(playerName != user.name){
			socket.emit('onPlayerChangeMap', {player: playerName, enters:enters, position: pos, map: name, marker: marker});
		}
	}
}
User.users = users;
User.sockets = sockets;
User.host = undefined;
module.exports = User;
utilities.initialize(User);