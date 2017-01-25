import '../css/style.css';
import $ from 'jquery';
import p5 from 'p5';

const sketch = (p) => {
  let canvasWidth, currentCanvasWdith, currentCanvasHeight, scaleValue, centerT;

  p.responsive_canvas = () => {
    p.translate((1 - scaleValue)*currentCanvasWdith/2, (1 - scaleValue)*currentCanvasHeight/2);
    p.scale(scaleValue, scaleValue);
  }

  p.preload = () => {
    currentCanvasWdith = $('#sketch').width();
    currentCanvasHeight = $('#sketch').height();

    if(currentCanvasWdith < 640){
      scaleValue = currentCanvasWdith/640;
    } else{
      scaleValue = currentCanvasWdith/canvasWidth;
    }
  }

  p.setup = () => {
    p.createCanvas(currentCanvasWdith, currentCanvasHeight)
    .id('canvas')
    .parent('sketch');

    p.noLoop();
    p.noFill();
  }

  p.draw = () => {
    p.responsive_canvas();
    p.ellipseMode(p.CENTER);
    p.strokeWeight(0.5);

    let pointArray = [];

    // 점을 찍음
    for(let i = 1; i < 5; i++){
      for(let j = 1; j < 5; j++){
        pointArray.push({ 'x': i*p.width/5 + p.random(-p.width/10, p.width/10), 'y': j*p.height/5 + p.random(-p.height/10, p.height/10) });
        p.ellipse(pointArray[0].x, pointArray[0].y, 7, 7);
      }
    }

    let randomIndex = p.floor(p.random(pointArray.length - 1));
    let startPoint = pointArray[randomIndex];
    let length = [], value = p.width, minIndex;

    // 최단거리에 있는 점을 추출
    for(let i = 0; i < pointArray.length; i++){
      length[i] = p.int(p.dist(startPoint.x, startPoint.y, pointArray[i].x, pointArray[i].y));

      if(length[i] != 0){
        if(length[i] < value){
          minIndex = i;
          value = length[i];
        }
      }
    }

    // 시작라인에 속하는 점 표시
    p.fill(0);
    // p.fill(255, 0, 0);
    p.ellipse(startPoint.x, startPoint.y, 7, 7);
    // p.fill(0, 0, 255);
    p.ellipse(pointArray[minIndex].x, pointArray[minIndex].y, 7, 7);
    // p.noFill(0);

    let unsettledEdge = [{ 'x1': startPoint.x, 'y1': startPoint.y, 'index1': randomIndex, 'x2': pointArray[minIndex].x, 'y2': pointArray[minIndex].y, 'index2': minIndex }
    ,{ 'x1': pointArray[minIndex].x, 'y1': pointArray[minIndex].y, 'index1': minIndex, 'x2': startPoint.x, 'y2': startPoint.y, 'index2': randomIndex }]
    , settledEdgeIndex = [randomIndex + ',' + minIndex];

    p.line(pointArray[randomIndex].x, pointArray[randomIndex].y, pointArray[minIndex].x, pointArray[minIndex].y);
    p.delaunayTriangulation(unsettledEdge, settledEdgeIndex, pointArray);
  }

  p.delaunayTriangulation = (unsettledEdge, settledEdgeIndex, pointArray) =>{
    let tempUnsettledEdge = [], tempSettledEdgeIndex = [];

    if(unsettledEdge.length != 0){
      $.each(unsettledEdge, (index, value) => {
        let overlapPrevent = 0;
        for(let i = 0; i < pointArray.length; i++){
          // 점의 방향을 검사 (컴퓨터 좌표는 아래로 갈수록 커지기에 부호가 반대로 바뀜)
          if(p.directionTest(value.x1, value.y1, value.x2, value.y2, pointArray[i].x, pointArray[i].y) < 0){
            // 완료행렬에 있는 중복되는 벡터를 제외한 나머지 점의 벡터 검사
            if(settledEdgeIndex.indexOf(value.index1 + ',' + i) == -1 && settledEdgeIndex.indexOf(i + ',' + value.index2) == -1){
              let circle = p.getCircleData(value.x1, value.y1, value.x2, value.y2, pointArray[i].x, pointArray[i].y);

              // 점이 외접원내에 속하는지 검사
              for(let j = 0; j < pointArray.length; j++){
                // 속할때
                if(p.int(p.dist(pointArray[j].x, pointArray[j].y, circle.x, circle.y)) < p.int(circle.radius)){
                  break;
                }
                // 안 속할때
                if(j == pointArray.length - 1 && overlapPrevent == 0){

                  p.line(value.x1, value.y1, pointArray[i].x, pointArray[i].y);
                  p.line(pointArray[i].x, pointArray[i].y, value.x2, value.y2);
                  p.ellipse(pointArray[i].x, pointArray[i].y, 7, 7);

                  // 조건을 만족하는 외접원의 삼각형이 두개가 있다면 하나만 그려줌
                  overlapPrevent++;

                  // 서치행렬에 시계방향 선분을 넣어줌
                  tempUnsettledEdge.push({ 'x1': value.x1, 'y1': value.y1, 'index1': value.index1, 'x2': pointArray[i].x, 'y2': pointArray[i].y, 'index2': i }
                  , { 'x1': pointArray[i].x, 'y1': pointArray[i].y, 'index1': i, 'x2': value.x2, 'y2': value.y2, 'index2': value.index2 });

                  // 완료행렬에 반시계 방향의 좌표를 넣어줌
                  tempSettledEdgeIndex.push(value.index1 + ',' + value.index2, value.index1 + ',' + i, i + ',' + value.index2);
                }
              }
            }
          }
        }
      })

      unsettledEdge.pop();
      unsettledEdge.pop();
      $.each(tempUnsettledEdge, (index, value) => {
        unsettledEdge.push(value);
      })
      $.each(tempSettledEdgeIndex, (index, value) => {
        settledEdgeIndex.push(value);
      })

      p.delaunayTriangulation(unsettledEdge, settledEdgeIndex, pointArray);
    }
  }

  p.directionTest = (x1, y1, x2, y2, x3, y3) => {
    return (x1*y2 + x2*y3 + x3*y1) - (y1*x2 + y2*x3 + y3*x1);
  }

  p.getCircleData = (x1, y1, x2, y2, x3, y3) => {
    let middlePointX1 = (x1 + x2)/2;
    let middlePointY1 = (y1 + y2)/2;
    let middlePointX2 = (x1 + x3)/2;
    let middlePointY2 = (y1 + y3)/2;

    let gradientLine1, gradientLine2,
    constantLine1, constantLine2,
    circlePointX, circlePointY, radius;

    // 기울기가 0일때
    if(y2 - y1 == 0){
      gradientLine1 = 1;
    } else{
      gradientLine1 = -(x2 - x1)/(y2 - y1);
    }
    constantLine1 = middlePointY1 - gradientLine1*middlePointX1;

    // 기울기가 0일때
    if(y3 - y1 == 0){
      gradientLine2 = 1;
    } else{
      gradientLine2 = -(x3 - x1)/(y3 - y1);
    }
    constantLine2 = middlePointY2 - gradientLine2*middlePointX2;

    // 두 선분의 교점과 그에따른 외접원의 반지름을 구함
    circlePointX = (constantLine2 - constantLine1)/(gradientLine1 - gradientLine2);
    circlePointY = gradientLine1*circlePointX + constantLine1;
    radius = p.sqrt(p.pow(x1 - circlePointX, 2) + p.pow(y1 - circlePointY, 2));

    let circle = { 'x': circlePointX, 'y': circlePointY, 'radius': radius}

    return circle;
  };

  p.windowResized = () => {
    currentCanvasWdith = $('#sketch').width();
    currentCanvasHeight = $('#sketch').height();
    p.resizeCanvas(currentCanvasWdith, currentCanvasHeight);

    if(currentCanvasWdith < 640){
      scaleValue = currentCanvasWdith/640;
    } else{
      scaleValue = currentCanvasWdith/canvasWidth;
    }
  }
}

var app = new p5(sketch, $('body')[0]);
