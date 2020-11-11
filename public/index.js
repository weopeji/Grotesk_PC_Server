const global_data = {
    data_url_localhost: 'https://grotesk.host/nd'
}
var imSocket = io.connect(global_data.data_url_localhost);
imSocket.on('connect', function() {
    console.log('Connecting to host...');
});