window.addEventListener("DOMContentLoaded", async () => {
  if (!window.api) {
    console.error("Preload not injected");
    return;
  }

  console.log("Preload OK");

  const videoElement = document.querySelector("video");
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");
  const videoSelectBtn = document.getElementById("videoSelectBtn");

  stopBtn.disabled = true;

  let mediaRecorder;
  let recordedChunks = [];
  let currentStream;

  // ---------------- SELECT SCREEN ----------------
  videoSelectBtn.onclick = async () => {
    try {
      console.log(typeof window.api.getSources);
      console.log("Window api getSources(): ", window.api.getSources);
      console.log(
        window.api.getSources() == undefined || window.api.getSources() == null,
      );
      const sources = await window.api.getSources();
      console.log("Sources: ", sources);
      const simplifiedSources = sources.map((s) => ({
        id: s.id,
        name: s.name,
      }));
      window.api.openSourcesMenu(simplifiedSources);
    } catch (error) {
      console.error("[SOURCES_ERROR]: ", error);
    }
  };

  // ---------------- CLEANUP FUNCTION ----------------
  async function cleanupCurrentRecording() {
    try {
      if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
      }

      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
        currentStream = null;
      }

      recordedChunks = [];
      startBtn.disabled = false;
      stopBtn.disabled = true;

      console.log("Old recording session cleaned");
    } catch (err) {
      console.error("Cleanup error:", err);
    }
  }

  // ---------------- SOURCE SELECTED ----------------
  window.api.onSourceSelected(async (source) => {
    await cleanupCurrentRecording();

    try {
      videoSelectBtn.innerText = source.name;

      currentStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: source.id,
          },
        },
      });

      videoElement.srcObject = currentStream;
      videoElement.play();

      mediaRecorder = new MediaRecorder(currentStream, {
        mimeType: "video/webm; codecs=vp9",
      });

      mediaRecorder.onstart = () => {
        startBtn.disabled = true;
        stopBtn.disabled = false;
        console.log("Recording started");
      };

      mediaRecorder.onstop = async () => {
        startBtn.disabled = false;
        stopBtn.disabled = true;
        console.log("Recording stopped");

        const blob = new Blob(recordedChunks, { type: "video/webm" });
        const buffer = await blob.arrayBuffer();
        await window.api.saveVideo(buffer);
        recordedChunks = [];
      };

      mediaRecorder.ondataavailable = (e) => recordedChunks.push(e.data);
    } catch (error) {
      console.error("[VIDEO_SELECT_BUTTON]: ", error);
    }
  });

  // ---------------- START ----------------
  startBtn.onclick = () => {
    if (!mediaRecorder) return alert("Select a screen first");
    if (mediaRecorder.state === "inactive") {
      mediaRecorder.start();
      console.log("Recording started");
    }
  };

  // ---------------- STOP ----------------
  stopBtn.onclick = () => {
    if (!mediaRecorder) return;
    mediaRecorder.stop();
    /*if (mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      console.log("Recording stopped");
    }*/
  };
});
