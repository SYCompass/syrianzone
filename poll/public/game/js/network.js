class NetworkManager {
    constructor() {
        this.localPlayer = null;
        this.remotePlayers = new Map();
        this.connections = new Map();
        this.isHost = false;
        this.roomId = null;
        this.signalingServer = null;
        
        // WebRTC configuration with Google STUN servers
        this.rtcConfig = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' },
                { urls: 'stun:stun4.l.google.com:19302' }
            ]
        };
        
        this.callbacks = {
            onPlayerJoin: null,
            onPlayerLeave: null,
            onPlayerUpdate: null,
            onConnectionStatusChange: null
        };
        
        this.setupSignalingServer();
    }
    
    setupSignalingServer() {
        // For local development, use fallback signaling directly
        console.log('Setting up local signaling for development');
        this.setupFallbackSignaling();
        
        // Uncomment below for production with real signaling server
        /*
        try {
            this.signalingServer = new WebSocket('wss://your-signaling-server.com');
            
            this.signalingServer.onopen = () => {
                console.log('Signaling server connected');
                this.updateConnectionStatus('Signaling Connected');
            };
            
            this.signalingServer.onmessage = (event) => {
                this.handleSignalingMessage(JSON.parse(event.data));
            };
            
            this.signalingServer.onclose = () => {
                console.log('Signaling server disconnected');
                this.updateConnectionStatus('Signaling Disconnected');
            };
            
            this.signalingServer.onerror = (error) => {
                console.error('Signaling error:', error);
                this.updateConnectionStatus('Signaling Error');
            };
        } catch (error) {
            console.warn('Could not connect to signaling server, using fallback method');
            this.setupFallbackSignaling();
        }
        */
    }
    
    setupFallbackSignaling() {
        // Fallback: Use localStorage + polling for local testing
        this.signalingServer = {
            send: (data) => {
                const key = 'signaling_' + this.roomId;
                const messages = JSON.parse(localStorage.getItem(key) || '[]');
                messages.push(JSON.parse(data));
                localStorage.setItem(key, JSON.stringify(messages));
            },
            close: () => {
                if (this.pollingInterval) {
                    clearInterval(this.pollingInterval);
                }
            },
            readyState: 1 // OPEN
        };
        
        // Start polling for messages
        this.startLocalPolling();
        
        this.updateConnectionStatus('Local Mode');
    }
    
    startLocalPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
        
        this.lastMessageIndex = 0;
        
        this.pollingInterval = setInterval(() => {
            if (!this.roomId) return;
            
            const key = 'signaling_' + this.roomId;
            const messages = JSON.parse(localStorage.getItem(key) || '[]');
            
            // Process new messages
            for (let i = this.lastMessageIndex; i < messages.length; i++) {
                const message = messages[i];
                // Don't process our own messages
                if (message.from !== this.localPlayer?.id) {
                    this.handleSignalingMessage(message);
                }
            }
            
            this.lastMessageIndex = messages.length;
        }, 100);
    }
    
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }
    
    async createRoom(playerName) {
        this.roomId = this.generateRoomId();
        this.isHost = true;
        
        // Clear any existing signaling data for this room
        localStorage.removeItem('signaling_' + this.roomId);
        
        const spawn = { x: 100, y: 500 };
        this.localPlayer = new Player(spawn.x, spawn.y, playerName);
        
        // Start polling for local signaling if using fallback
        if (this.signalingServer && this.signalingServer.send) {
            this.startLocalPolling();
        }
        
        this.updateConnectionStatus('Room Created: ' + this.roomId);
        
        if (this.callbacks.onConnectionStatusChange) {
            this.callbacks.onConnectionStatusChange('Host', this.roomId);
        }
        
        console.log('Room created with ID:', this.roomId, 'Player ID:', this.localPlayer.id);
        
        return this.roomId;
    }
    
    async joinRoom(roomId, playerName) {
        this.roomId = roomId;
        this.isHost = false;
        
        const spawn = { x: 200, y: 500 };
        this.localPlayer = new Player(spawn.x, spawn.y, playerName);
        
        console.log('Joining room:', roomId, 'Player ID:', this.localPlayer.id);
        
        // Start polling for local signaling if using fallback
        if (this.signalingServer && this.signalingServer.send) {
            this.startLocalPolling();
        }
        
        // Send join request to find host
        this.sendSignalingMessage({
            type: 'join-request',
            playerData: this.localPlayer.getNetworkData(),
            from: this.localPlayer.id,
            roomId: roomId
        });
        
        this.updateConnectionStatus('Joining Room: ' + roomId);
        
        if (this.callbacks.onConnectionStatusChange) {
            this.callbacks.onConnectionStatusChange('Joining', roomId);
        }
    }
    
    async createPeerConnection(peerId) {
        const pc = new RTCPeerConnection(this.rtcConfig);
        
        // Create data channel for game data
        const dataChannel = pc.createDataChannel('gameData', {
            ordered: false, // Allow out-of-order delivery for better performance
            maxRetransmits: 0 // Don't retransmit old data
        });
        
        dataChannel.onopen = () => {
            console.log(`Data channel opened with ${peerId}`);
            this.updateConnectionStatus('Connected');
        };
        
        dataChannel.onmessage = (event) => {
            this.handleGameMessage(JSON.parse(event.data), peerId);
        };
        
        dataChannel.onclose = () => {
            console.log(`Data channel closed with ${peerId}`);
            this.handlePlayerDisconnect(peerId);
        };
        
        // Handle incoming data channels
        pc.ondatachannel = (event) => {
            const channel = event.channel;
            console.log('Received data channel from:', peerId);
            
            // Update our connection with the received channel
            const connection = this.connections.get(peerId);
            if (connection) {
                connection.dataChannel = channel;
            }
            
            channel.onopen = () => {
                console.log(`Incoming data channel opened with ${peerId}`);
                this.updateConnectionStatus('Connected');
            };
            
            channel.onmessage = (event) => {
                this.handleGameMessage(JSON.parse(event.data), peerId);
            };
            
            channel.onclose = () => {
                console.log(`Incoming data channel closed with ${peerId}`);
                this.handlePlayerDisconnect(peerId);
            };
        };
        
        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.sendSignalingMessage({
                    type: 'ice-candidate',
                    candidate: event.candidate,
                    target: peerId,
                    from: this.localPlayer.id
                });
            }
        };
        
        pc.onconnectionstatechange = () => {
            console.log(`Connection state with ${peerId}:`, pc.connectionState);
            if (pc.connectionState === 'connected') {
                this.updateConnectionStatus('Connected');
            } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                this.handlePlayerDisconnect(peerId);
            }
        };
        
        this.connections.set(peerId, { pc, dataChannel });
        
        // Create offer if we're the host (initiator)
        if (this.isHost) {
            console.log('Host creating offer for:', peerId);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            
            this.sendSignalingMessage({
                type: 'offer',
                offer: offer,
                target: peerId,
                from: this.localPlayer.id
            });
        }
        
        return pc;
    }
    
    async handleSignalingMessage(message) {
        console.log('Received signaling message:', message.type, 'from:', message.from);
        
        const peerId = message.from;
        
        try {
            switch (message.type) {
                case 'join-request':
                    // Only host should handle join requests
                    if (this.isHost && message.roomId === this.roomId) {
                        console.log('Host received join request from:', peerId);
                        await this.createPeerConnection(peerId);
                    }
                    break;
                    
                case 'offer':
                    if (!message.target || message.target !== this.localPlayer?.id) return;
                    
                    let connection = this.connections.get(peerId);
                    if (!connection) {
                        await this.createPeerConnection(peerId);
                        connection = this.connections.get(peerId);
                    }
                    
                    const pc = connection.pc;
                    await pc.setRemoteDescription(message.offer);
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    
                    this.sendSignalingMessage({
                        type: 'answer',
                        answer: answer,
                        target: peerId,
                        from: this.localPlayer.id
                    });
                    break;
                    
                case 'answer':
                    if (!message.target || message.target !== this.localPlayer?.id) return;
                    
                    const answerConnection = this.connections.get(peerId);
                    if (answerConnection) {
                        await answerConnection.pc.setRemoteDescription(message.answer);
                    }
                    break;
                    
                case 'ice-candidate':
                    if (!message.target || message.target !== this.localPlayer?.id) return;
                    
                    const candidateConnection = this.connections.get(peerId);
                    if (candidateConnection) {
                        await candidateConnection.pc.addIceCandidate(message.candidate);
                    }
                    break;
            }
        } catch (error) {
            console.error('Error handling signaling message:', error);
        }
    }
    
    sendSignalingMessage(message) {
        if (this.signalingServer && this.signalingServer.readyState === 1) {
            this.signalingServer.send(JSON.stringify(message));
        }
    }
    
    handleGameMessage(data, peerId) {
        console.log('Received game message:', data.type, 'from:', peerId);
        
        switch (data.type) {
            case 'player-update':
                this.updateRemotePlayer(data.playerData, peerId);
                break;
                
            case 'player-join':
                this.addRemotePlayer(data.playerData, peerId);
                break;
                
            case 'player-leave':
                this.removeRemotePlayer(peerId);
                break;
                
            case 'bullet-fired':
                if (this.callbacks.onBulletReceived) {
                    this.callbacks.onBulletReceived(data.bulletData);
                }
                break;
                
            case 'stage-data':
                if (this.callbacks.onStageUpdate) {
                    this.callbacks.onStageUpdate(data.stageData);
                }
                break;
        }
    }
    
    updateRemotePlayer(playerData, peerId) {
        let player = this.remotePlayers.get(peerId);
        
        if (!player) {
            player = new Player(playerData.x, playerData.y, playerData.name, playerData.color);
            player.id = playerData.id;
            this.remotePlayers.set(peerId, player);
            
            if (this.callbacks.onPlayerJoin) {
                this.callbacks.onPlayerJoin(player);
            }
        }
        
        player.updateFromNetwork(playerData);
        
        if (this.callbacks.onPlayerUpdate) {
            this.callbacks.onPlayerUpdate(player);
        }
    }
    
    addRemotePlayer(playerData, peerId) {
        const player = new Player(playerData.x, playerData.y, playerData.name, playerData.color);
        player.id = playerData.id;
        this.remotePlayers.set(peerId, player);
        
        if (this.callbacks.onPlayerJoin) {
            this.callbacks.onPlayerJoin(player);
        }
    }
    
    removeRemotePlayer(peerId) {
        const player = this.remotePlayers.get(peerId);
        if (player) {
            this.remotePlayers.delete(peerId);
            
            if (this.callbacks.onPlayerLeave) {
                this.callbacks.onPlayerLeave(player);
            }
        }
    }
    
    handlePlayerDisconnect(peerId) {
        this.removeRemotePlayer(peerId);
        
        const connection = this.connections.get(peerId);
        if (connection) {
            connection.pc.close();
            this.connections.delete(peerId);
        }
        
        this.updateConnectionStatus('Player Disconnected');
    }
    
    broadcastPlayerUpdate() {
        if (!this.localPlayer) return;
        
        const message = {
            type: 'player-update',
            playerData: this.localPlayer.getNetworkData()
        };
        
        this.broadcastMessage(message);
    }
    
    broadcastBullet(bulletData) {
        const message = {
            type: 'bullet-fired',
            bulletData: bulletData
        };
        
        this.broadcastMessage(message);
    }
    
    broadcastMessage(message) {
        this.connections.forEach((connection, peerId) => {
            if (connection.dataChannel && connection.dataChannel.readyState === 'open') {
                try {
                    connection.dataChannel.send(JSON.stringify(message));
                } catch (error) {
                    console.warn(`Failed to send message to ${peerId}:`, error);
                }
            }
        });
    }
    
    updateConnectionStatus(status) {
        if (this.callbacks.onConnectionStatusChange) {
            this.callbacks.onConnectionStatusChange(status);
        }
    }
    
    generateRoomId() {
        return Math.random().toString(36).substr(2, 8).toUpperCase();
    }
    
    getLocalPlayer() {
        return this.localPlayer;
    }
    
    getRemotePlayers() {
        return Array.from(this.remotePlayers.values());
    }
    
    getAllPlayers() {
        const players = [];
        if (this.localPlayer) players.push(this.localPlayer);
        players.push(...this.getRemotePlayers());
        return players;
    }
    
    disconnect() {
        // Close all peer connections
        this.connections.forEach((connection) => {
            connection.pc.close();
        });
        this.connections.clear();
        
        // Close signaling connection
        if (this.signalingServer) {
            this.signalingServer.close();
        }
        
        // Clear players
        this.remotePlayers.clear();
        this.localPlayer = null;
        
        this.updateConnectionStatus('Disconnected');
    }
} 