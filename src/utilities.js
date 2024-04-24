

  const OVAL_LEFT_X = 190;
  const OVAL_RIGHT_X = 445;

export  const isFaceInside = (leftFaceX, rightFaceX) => {
    return leftFaceX > OVAL_LEFT_X && rightFaceX < OVAL_RIGHT_X;
  };


 export const drawOval = (ctx, canvas) => {
    var width = 160; // Width of the face oval
    var height = 100; // Height of the face oval

    // Set line color and width
    ctx.strokeStyle = "aqua";
    ctx.lineWidth = 1;

    var centerX = canvas.width / 2;
    var centerY = canvas.height / 2;
    var radiusX = width / 2;
    var radiusY = height / 2;

    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Create a filled rectangle with a clear circle in the middle
    ctx.fillStyle = "rgba(102, 153, 204,0.7)"; // semi-transparent blue
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "destination-out"; // Create hole in the overlay
    ctx.arc(320, 250, 50, 0, 2 * Math.PI); // Adjust circle position and size as needed
    ctx.fill();

    // Reset to default to ensure subsequent drawing operations are visible
    ctx.globalCompositeOperation = "source-over";
  };