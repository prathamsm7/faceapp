export const captureImage = (ctx, video, width, height, predictions) =>{  

    //  predictions && drawMesh2(predictions, ctx, width);
     ctx.translate(width, 0);
     ctx.scale(-1, 1);
     ctx.drawImage(video, 0,0, width, height)
     ctx.setTransform(1, 0, 0, 1, 0, 0);

     return ctx
  }