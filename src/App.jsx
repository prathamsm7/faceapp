import React, { useEffect, useRef } from "react";
import "@tensorflow/tfjs";
import * as blazeface from "@tensorflow-models/blazeface";
import imagesrc from "./assets/face.png"

const FaceDetection = () => {
  const videoRef = useRef();
  const canvasRef = useRef();
  let model;

  useEffect(() => {
    const setupCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 600, height: 400 },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
      }
    };

    const detectFace = async () => {
      const prediction = await model.estimateFaces(videoRef.current, false);
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      prediction.forEach((pred) => {
        ctx.save();
        ctx.translate(canvasRef.current.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(
          videoRef.current,
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height,
        );

        ctx.beginPath();
        ctx.lineWidth = "1";
        ctx.strokeStyle = "green";
        ctx.rect(
          pred.topLeft[0] - 20,
          pred.topLeft[1] - 120,
          pred.bottomRight[0] - pred.topLeft[0] + 20,
          pred.bottomRight[1] - pred.topLeft[1],
        );
        ctx.stroke();

        ctx.fillStyle = "cyan";
        pred.landmarks.forEach((landmark) => {
          ctx.fillRect(landmark[0], landmark[1]-120, 5, 5);
        });

        const image = new Image();
        image.src = imagesrc;

        const imageWidth = (pred.bottomRight[0] - pred.topLeft[0]) * 1.1;
        const imageHeight = image.height * (imageWidth / image.width);
        const imageX =
          pred.topLeft[0] +
          (pred.bottomRight[0] - pred.topLeft[0]) / 2 -
          imageWidth / 2;
        const imageY =
          pred.topLeft[1] +
          (pred.bottomRight[1] - pred.topLeft[1]) / 2 -
          image.height / 2;

        ctx.drawImage(image, imageX - 80, imageY + 50, imageWidth + 150 , imageHeight + 20);
        ctx.restore();
      });
    };

    const loadModel = async () => {
      model = await blazeface.load();
      setInterval(detectFace, 10);
    };

    setupCamera();
    loadModel();

    // Cleanup function
    return () => {
      if (videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      <h1>Face Detection</h1>
      <div style={{ display: "flex" }}>
        <video
          id="video"
          controls
          autoPlay
          style={{ marginRight: "30px", display: "none" }}
          ref={videoRef}
        ></video>
        <canvas
          id="canvas"
          width="400"
          height="400"
          ref={canvasRef}
        ></canvas>
      </div>
    </div>
  );
};

export default FaceDetection;
