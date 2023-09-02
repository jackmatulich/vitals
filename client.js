const startButton = document.getElementById('startButton');

// When the Start Video Call button is clicked
startButton.addEventListener('click', async () => {
    // Create a PeerJS object with your server's host and port
    const peer = new Peer({
        host: 'https://jackmatulic-monitorserv-sskkywa1vt4.ws-us104.gitpod.io/', // Update with your PeerJS server host
        port: 3000, // Update with your PeerJS server port
        path: '/peerjs',
    });

    // Handle errors
    peer.on('error', (err) => {
        console.error('PeerJS Error:', err);
    });

    // When a connection is established
    peer.on('open', (id) => {
        console.log('My PeerJS ID:', id);
    });
});