import { useRef, useEffect, useState } from "react";
import "./App.css";
import * as faceapi from "face-api.js";
import {drawOval, isFaceInside } from "./utilities";
import axios from "axios";

function App() {
  const videoRef = useRef();
  const canvasRef = useRef();
  const canvasRefOval = useRef();
  let counter = 0;
  let intervalId;
  const [capturedImage, setCapturedImage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [landmarks, setLandmarks] = useState({});
  const [retry, setRetry] = useState(true);
  const [status, setStatus] = useState("");

  // LOAD FROM USEEFFECT
  useEffect(() => {
    loadModels();
    // videoRef.current && startVideo();

  }, []);

  // OPEN YOU FACE WEBCAM
  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((currentStream) => {
        videoRef.current.srcObject = currentStream;
      })
      .catch((err) => {
        console.log(err);
      });
  };
  // LOAD MODELS FROM FACE API

  const loadModels = () => {
    const ctxOval = canvasRefOval.current.getContext("2d");
    drawOval(ctxOval, canvasRefOval?.current);

    Promise.all([
      // THIS FOR FACE DETECT AND LOAD FROM YOU PUBLIC/MODELS DIRECTORY
      faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      // faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
    ]).then((res) => {
      startVideo();
      faceMyDetect();
    });
  };

  const faceMyDetect = async () => {
    counter = 0;
    intervalId = setInterval(async () => {
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
      // .withFaceExpressions();

      if(!detections.length){
        counter = 0
        return false
      }

      setIsLoading(false)

      // DRAW YOU FACE IN WEBCAM
      canvasRef.current.innerHtml = faceapi.createCanvasFromMedia(
        videoRef.current
      );
      faceapi.matchDimensions(canvasRef.current, {
        width: 430,
        height: 430,
      });

      const resized = faceapi.resizeResults(detections, {
        width: 430,
        height: 430,
      });

      // faceapi.draw.drawDetections(canvasRef.current, resized);
      faceapi.draw.drawFaceLandmarks(canvasRef.current, resized);
      // faceapi.draw.drawFaceExpressions(canvasRef.current, resized, 1);
      // setIsLoading(false);

      const faceDimensions = detections.map((detection) => {
        const { landmarks } = detection;
        setLandmarks(landmarks);
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();

        const { x: leftFaceX } = leftEye[0];
        const { x: rightFaceX } = rightEye[0];

        isFaceInside(leftFaceX, rightFaceX) && counter++;  
        if (
          resized.length > 0 &&
          resized[0].detection.score > 0.75 &&
          !capturedImage
        ) {
          if (counter >= 10) {
            setIsLoading(false);
          }
        }
      });
    }, 100);
  };

  const takeSnapshot = () => {
    alert("taking picture")
    const canvas = document.createElement("canvas");
    canvas.width = 430 + 190;
    canvas.height = 450;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);

    const img = document.getElementById("img");
    let imagedata = canvas.toDataURL("image/webp");
    // img.style.transform = "scaleX(-1)";
    // setCapturedImage(imagedata);
    submitImage(imagedata);
    // clearInterval(intervalId);
    setRetry(false);
    setIsLoading(false);
    // img.src = imagedata;
  };

  const retakeSnapshot = () => {
    videoRef && loadModels();
    document.getElementById("img").src = "";
    setCapturedImage("");
    setRetry(true);
    setStatus("");
  };

  const submitImage = async (data) => {
    alert("submitting picture")

    const url = "https://webhook.site/7f7a2a6e-2a30-4519-a030-2763e016dc76";

    const formData = new FormData();
    const webhookform = new FormData();

    const canvas = document.createElement("canvas");
    canvas.width = 430 + 190;
    canvas.height = 450;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);

    const img = document.createElement("img");
    let imagedata = canvas.toDataURL("image/webp");

    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();

    const { x: leftEyeX, y: leftFaceY } = leftEye[0];
    const { x: rightEyeX, y: rightEyeY } = rightEye[0];

    const hairHeight = Math.abs(rightEyeX - leftEyeX) * 1.5;
    const topHairY = rightEyeY - hairHeight - 30; // Fix here, should add hairHeight
    const topHairX = leftEyeX - 70;

    const hairWidth = Math.abs(rightEyeX - leftEyeX) * 2 + 100;
    const width = Math.abs(rightEye - leftEyeX);
    const height = Math.abs(480 - leftEyeX);

    const croppedCanvas = document.createElement("canvas");
    const croppedHairCanvas = document.createElement("canvas");
    const croppedCtx = croppedCanvas.getContext("2d");
    const croppedCtxHair = croppedHairCanvas.getContext("2d");

    // Set the width and height of the new canvas
    croppedCanvas.width = width;
    croppedCanvas.height = height;

    croppedHairCanvas.width = hairWidth;
    croppedHairCanvas.height = hairHeight;

    croppedHairCanvas.getContext("2d").drawImage(
      videoRef.current, // The original canvas containing the image
      topHairX,
      topHairY,
      hairWidth,
      hairHeight, // Source rectangle (bounding box)
      0,
      0,
      hairWidth,
      hairHeight // Destination rectangle (cropped area)
    );

    let result = {}
    croppedHairCanvas.toBlob(function (blob) {
      formData.append("image", blob, "image.png");
      formData.append("imageId", "12");
      formData.append("modelId", "werg");
      formData.append("brand", "MM");
      formData.append("category", "wdv");
      formData.append("userId", "50000625");
      formData.append("appointmentId", "2");
      axios
      .post("https://stg.api.mosaicwellness.in/doctrina/predict", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        // Set withCredentials to true if you need to send cookies or other credentials
        withCredentials: false,
      })
      .then((response) => {
        // console.log("🚀 ~ response:", response);
        return response.data; // Return the response data
      })
      .then((data) => {

        // console.log("Success:", data);
        const { stage = "", Clarity = "" } = data?.data || {};
        result = data?.data
        sendImage(croppedHairCanvas,result,webhookform,url)
        setTimeout(() => {
          setStatus(stage || Clarity);
          alert(stage || Clarity)
        }, 1000);
        
      })
      .catch((error) => {
        console.error("Error:", error);
      });
    }, "image/png");


  };

  function sendImage(croppedHairCanvas,result,webhookform,url){
    croppedHairCanvas?.toBlob(function (blob) {
      webhookform.append("image", blob, "image.png");
      webhookform.append("data",JSON.stringify(result))
      axios
        .post(url, webhookform, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          // Set withCredentials to true if you need to send cookies or other credentials
          withCredentials: false,
        })
        .then((response) => {
          // console.log("🚀 ~ response:", response);
          return response.data; // Return the response data
        })
        .then((data) => {
          console.log("webhook Success:", data);
        })
        .catch((error) => {
          console.error("Error:", error);
        });

    }, "image/png");
  }

  return (
    <div className="myapp">
      <div className="appvide">
        <video
          crossOrigin="anonymous"
          ref={videoRef}
          autoPlay
          style={{
            transform: "scaleX(-1)",
            zindex: 9,
            width: "430px",
            height: "480px",
          }}
        ></video>
        <canvas
          ref={canvasRef}
          id="canvasImage"
          className="appcanvas"
          style={{
            width: "430px",
            height: "480px",
            transform: "scaleX(-1)",
            zindex: 9,
          }}
        />
        <canvas
          ref={canvasRefOval}
          style={{
            position: "absolute",
            textAlign: "center",
            zindex: 9,
            width: "430px",
            height: "480px",
          }}
        />
        <div id="screenshot">
          { <img id="img"/>}
        </div>
      </div>
      <p>{isLoading ? "....Loading" : "Now you can capture snap"}</p>
      <div>
        <button onClick={takeSnapshot} disabled={isLoading || !retry}>
          Take Snapshot
        </button>
        <button onClick={retakeSnapshot} disabled={retry}>
          Retry
        </button>
      </div>
      <h3 className="result">Result : {status ? status : "NA"}</h3>
    </div>
  );
}

export default App;
