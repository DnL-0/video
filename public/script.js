const socket = io();
const room = 'room1'; // You can make dynamic
let localStream;
let peerConnection;
const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

socket.emit('join', room);

socket.on('ready', async () => {
  if (!peerConnection) await startPeer(true);
});

socket.on('offer', async (offer) => {
  if (!peerConnection) await startPeer(false);
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit('answer', { answer, room });
});

socket.on('answer', async (answer) => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on('ice-candidate', ({ candidate }) => {
  peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

async function startPeer(isInitiator) {
  peerConnection = new RTCPeerConnection(config);

  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('ice-candidate', { candidate: event.candidate, room });
    }
  };

  if (isInitiator) {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('offer', { offer, room });
  }
}

document.getElementById('startWebcam').onclick = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localVideo.srcObject = localStream;

  if (peerConnection) {
    const videoSender = peerConnection.getSenders().find(s => s.track.kind === 'video');
    if (videoSender) {
      videoSender.replaceTrack(localStream.getVideoTracks()[0]);
    }
  }
};

document.getElementById('shareScreen').onclick = async () => {
  const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
  const screenTrack = screenStream.getVideoTracks()[0];
  localVideo.srcObject = screenStream;

  const videoSender = peerConnection.getSenders().find(s => s.track.kind === 'video');
  if (videoSender) {
    videoSender.replaceTrack(screenTrack);
  }

  screenTrack.onended = async () => {
    // Go back to webcam
    const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
    const camTrack = camStream.getVideoTracks()[0];
    localVideo.srcObject = camStream;

    if (videoSender) {
      videoSender.replaceTrack(camTrack);
    }
  };
};
