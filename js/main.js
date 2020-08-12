/*
*  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
*
* Copyright notice above for use of MediaRecorder API
*/

'use strict';

/* YOUTUBE API SETUP PART */
var types = ["video/webm", 
             "audio/webm", 
             "video/webm\;codecs=vp9", 
             "video/webm\;codecs=daala", 
             "video/webm\;codecs=h264", 
             "audio/webm\;codecs=opus", 
             "video/mpeg",
             "video/mp4"];

for (var i in types) { 
  console.log( "Is " + types[i] + " supported? " + (MediaRecorder.isTypeSupported(types[i]) ? "Maybe!" : "Nope :(")); 
}

function YouTubeGetID(url){
  var ID = '';
  url = url.replace(/(>|<)/gi,'').split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
  if(url[2] !== undefined) {
    ID = url[2].split(/[^0-9a-z_\-]/i);
    ID = ID[0];
  }
  else {
    ID = url;
  }
    return ID;
}

var tag = document.createElement("script")
tag.src = "https://www.youtube.com/iframe_api"
var firstScriptTag = document.getElementsByTagName("script")[0]
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
var player
function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    videoId: '0Le3-HpHRnw',
    events: {
      'onReady': onPlayerReady,
    }
  })
}
function onPlayerReady(event) {
  event.target.playVideo();
  event.target.pauseVideo();
  player.mute();
}


let mediaRecorder;
let recordedBlobs;
const videoSubmit = document.querySelector('button#videoSubmit');
const errorMsgElement = document.querySelector('span#errorMsg');
const recordedVideo = document.querySelector('video#recorded');
const recordButton = document.querySelector('button#record');
const gumVideo = document.querySelector('video#gum');

//creates a listener for when you press a key
window.onkeyup = keyup;

//creates a global Javascript variable
var inputTextValue;
var actualID;

$('#videoSubmit').click(function () {
  var input = document.querySelector('input#videoID').value;
  document.querySelector('div#inputManager').hidden = true;
  document.querySelector('div#mainrow').hidden = false;
  console.log(input);
  var realID = YouTubeGetID(input);
  console.log(realID);
  player.loadVideoById(realID);
  setTimeout(function() {player.pauseVideo()}, 1500);
})

function keyup(e) {
  //setting your input text to the global Javascript Variable for every key press
  inputTextValue = e.target.value;
  //listens for you to press the ENTER key, at which point your web address will change to the one you have input in the search box
  if (e.keyCode == 13) {
    document.querySelector('div#inputManager').hidden = true;
    document.querySelector('div#mainrow').hidden = false;
    console.log(inputTextValue);
    var realID = YouTubeGetID(inputTextValue);
    console.log(realID);
    player.loadVideoById(realID);
    setTimeout(function() {player.pauseVideo()}, 1500);
  }
  
  
}


recordButton.addEventListener('click', () => {
  if (recordButton.textContent === 'Start Recording') {
    recordButton.textContent = 'Stop Recording';
    player.seekTo(0);
    player.unMute();
    player.playVideo();
    startRecording();
  } else {
    player.pauseVideo();
    stopRecording();
    recordButton.textContent = 'Start Recording';
    playButton.hidden = false;
    downloadButton.hidden = false;
  }
});

const playButton = document.querySelector('button#play');
playButton.addEventListener('click', () => {
  recordedVideo.hidden = false;
  const superBuffer = new Blob(recordedBlobs, {type: 'video/webm;codecs=vp9'});
  recordedVideo.src = null;
  recordedVideo.srcObject = null;
  recordedVideo.src = window.URL.createObjectURL(superBuffer);
  recordedVideo.controls = true;
  recordedVideo.play();
});

const downloadButton = document.querySelector('button#download');
downloadButton.addEventListener('click', () => {
  const blob = new Blob(recordedBlobs, {type: 'video/webm;codecs=vp9'});
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = 'recording.webm';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
});

function handleDataAvailable(event) {
  console.log('handleDataAvailable', event);
  if (event.data && event.data.size > 0) {
    recordedBlobs.push(event.data);
  }
}

function startRecording() {

  recordedBlobs = [];
  var options = {
    audioBitsPerSecond : 128000,
    videoBitsPerSecond : 2500000,
    mimeType : 'video/webm;codecs=vp9'
  }
  /*let options = {mimeType: 'video/webm;codecs=vp9,opus'};
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    console.error(`${options.mimeType} is not supported`);
    options = {mimeType: 'video/webm;codecs=vp8,opus'};
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      console.error(`${options.mimeType} is not supported`);
      options = {mimeType: 'video/webm'};
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.error(`${options.mimeType} is not supported`);
        options = {mimeType: ''};
      }
    }
  }*/

  try {
    mediaRecorder = new MediaRecorder(window.stream, options);
  } catch (e) {
    console.error('Exception while creating MediaRecorder:', e);
    errorMsgElement.innerHTML = `Exception while creating MediaRecorder: ${JSON.stringify(e)}`;
    return;
  }

  console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
  recordButton.textContent = 'Stop Recording';
  mediaRecorder.onstop = (event) => {
    console.log('Recorder stopped: ', event);
    console.log('Recorded Blobs: ', recordedBlobs);
  };
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.start();
  console.log('MediaRecorder started', mediaRecorder);
}

function stopRecording() {
  mediaRecorder.stop();
}

function handleSuccess(stream) {
  recordButton.disabled = false;
  console.log('getUserMedia() got stream:', stream);
  window.stream = stream;
  gumVideo.srcObject = stream;
}

async function init(constraints) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    handleSuccess(stream);
  } catch (e) {
    console.error('navigator.getUserMedia error:', e);
    errorMsgElement.innerHTML = `navigator.getUserMedia error:${e.toString()}`;
  }
}
const startButton = document.querySelector('button#start');
startButton.addEventListener('click', async () => {
    startButton.hidden = true;
    recordButton.hidden = false;
    const gumImg = document.querySelector('img#gumimg');
    gumImg.hidden = true;
    gumVideo.hidden = false;
  const hasEchoCancellation = document.querySelector('#echoCancellation').checked;
  const constraints = {
    audio: {
      echoCancellation: {exact: hasEchoCancellation}
    },
    video: {
      width: 1280, height: 720
    }
  };
  console.log('Using media constraints:', constraints);
  await init(constraints);
});