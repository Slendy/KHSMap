class Floor{
    constructor(number){
        this.number = number;
    }
    travelPoints = [];//array of points
    destinations = [];
}
// Will be where you can go
class Destination{
    constructor(x, y, number){
        this.x = x;
        this.y = y;
        this.number = number;
    }
}
class TravelPoint{
    constructor(x, y, legalMoves, isStair){
        this.x = x;
        this.y = y;
        this.moves = legalMoves;
        this.isStair = isStair;
    }
}

var canvas = document.getElementById("canvas"), context = canvas.getContext("2d");
var currentFloor = 1;
// Used for being able to use your mouse to pan and zoom the floor plan
var lastMouseX = 0, lastMouseY = 0;
var cameraX = 2080, cameraY = 1313, zoomLevel = 1;
var mouseDown = false;

// array of floor objects
var floors = [new Floor(1), new Floor(2), new Floor(3), new Floor(4)];
var curRoomIndex = 100;

var roomDestination = 0;
var roomOrigin = 0;
var pathsToTake = [[], [], [], []]
var startingPoint;
var endingPoint;

var selectedPoint = null;

var DEBUG = false;


function displayError(error, time){
    document.getElementById("roomError").innerText = "Error: " + error;
    document.getElementById("room-input").style.maxHeight = "300px";
    if(time !== -1){
        setTimeout(function() {
            document.getElementById("room-input").style.maxHeight = "130px";
        }, time)
    }
}

function showFloorSelector(){
    document.getElementById("floor-select").style = "width: 190px; max-height: 300px"
}

function hideFloorSelector(){
    document.getElementById("floor-select").style = "width: 190px; max-height: 55px"
}

function increaseFloor(){
    currentFloor++;
    if(currentFloor > 4) {
        currentFloor = 4;
    } else {
        onFloorChange();
    }
    document.getElementById("floor-num").innerText = currentFloor;
    redraw();
}

function decreaseFloor(){
    currentFloor--;
    if(currentFloor < 1) {
        currentFloor = 1;
    } else {
        onFloorChange();
    }
    document.getElementById("floor-num").innerText = currentFloor;
    redraw();
}

function setFloor(floorNum){
    floorNum = Math.max(1, Math.min(floorNum, 4));
    document.getElementById("floor-num").innerText = floorNum;
    currentFloor = floorNum;
}

// called before redraw, position the camera on the you are here aka the level origin
function onFloorChange(){
    if(pathsToTake[currentFloor-1].length > 0){
        // origin on start floor will be the room
        // origin on destination floor will be stairs
        let p = floors[currentFloor-1].travelPoints[pathsToTake[currentFloor-1][0]];
        let x = p.x;
        let y = p.y;
        let viewportWidth = canvas.width / zoomLevel;
        let viewportHeight = canvas.height / zoomLevel;

        cameraX = x - (viewportWidth/2);
        cameraY = y - (viewportHeight / 2);
    }
}

var image = [];
var placeMode = 1;
var didFinishLoadingPictures;
var finishedPictures = 0;
function loadImages(){
    for(let i = 1; i <= 4; i++){
        image[i-1] = new Image();
        image[i-1].onload = function(){
            if(i === 1){
                // make loading seem faster by displaying image as soon as the first picture loads
                didFinishLoadingPictures = true;
                document.getElementById("spinner").style = "display: none";
                redraw();
            }
            // finishedPictures++;
            // if(finishedPictures === 4){

            // }
        };
        image[i-1].src = "floors/" + i + ".png";
    }
}
window.addEventListener("keydown", (e)=> {
    if(DEBUG) {
        //37 = arrow left
        //38 = arrow up
        //39 = arrow right
        //40 = arrow down
        if (e.keyCode === 37)
            curRoomIndex -= 100;
        if (e.keyCode === 39)
            curRoomIndex += 100;
        if (e.keyCode === 38) {
            curRoomIndex++;
        }
        if (e.keyCode === 40) {
            curRoomIndex--;
        }

        // 1 (above q) for destination
        if (e.keyCode === 49) {
            placeMode = 1;
        }
        // 2 for travel point
        if (e.keyCode === 50) {
            placeMode = 2;
        }
        // 3 for stair
        if (e.keyCode === 51) {
            placeMode = 3;
        }

        // enter
        if (e.keyCode === 27) {
            selectedPoint = null;
        }
        // f
        if (e.keyCode === 70) {
            DEBUG = !DEBUG;
        }
        //Dump stuff

        //t button
        if (e.keyCode === 84) {
            let pointDump = "";
            for (let i = 0; i < floors[currentFloor - 1].travelPoints.length; i++) {
                let dest = floors[currentFloor - 1].travelPoints[i];
                pointDump += "addTravelPoint(" + currentFloor + ", new TravelPoint(" + dest.x + ", " + dest.y + ", [" + dest.moves + "]" + (dest.isStair ? ", true" : "") + "));\n";
            }
            console.log(pointDump);
            // yuh += "new TravelPoint(" + dest.x + ", " + dest.y + ", " + dest.number + ");\n";
            // var jsonDump = "dests: {\n";
            // for(var i = 0; i < floors[currentFloor-1].destinations.length; i++){
            //     var dest = floors[currentFloor-1].destinations[i];
            //
            //     jsonDump += "  " + dest.number + ": {\n"
            //     jsonDump += "    x: " + dest.x + "\n"
            //     jsonDump += "    y: " + dest.y + "\n";
            //     jsonDump += "  }\n";
            //
            // }
            // jsonDump += "}\n";
            // console.log(jsonDump);
        }

        //d button
        if (e.keyCode === 68) {
            let pointDump = "";
            for (let i = 0; i < floors[currentFloor - 1].destinations.length; i++) {
                let dest = floors[currentFloor - 1].destinations[i];
                pointDump += "addDestination(" + currentFloor + ", new Destination(" + dest.x + ", " + dest.y + ", " + dest.number + "));\n";
            }
            console.log(pointDump);
        }


        console.log(e.keyCode);
    }
});

// var[lastTouch1X, lastTouch2X, lastTouch1Y, lastTouch2Y]
var lastTouchX, lastTouchY;
window.onload = function(){
    document.getElementById("canvas").addEventListener('mousemove', (e)=> {
        if(mouseDown){
            if(lastMouseX !== 0){
                cameraX = Math.round(cameraX + (lastMouseX - e.pageX)/zoomLevel);
            }
            if(lastMouseY !== 0){
                cameraY = Math.round(cameraY + (lastMouseY - e.pageY)/zoomLevel);
            }
            // if(lastMouseX !== 0 || lastMouseX !== 0){

            // }
            redraw();
        }
        lastMouseY = e.pageY;
        lastMouseX = e.pageX;
    });
    //TODO two finger zoom

    document.getElementById("canvas").addEventListener('touchmove', (e)=> {
        if(e.targetTouches.length > 1){
            let touch = e.targetTouches[2];
            if(lastTouchX !== 0){
                // console.log(lastTouchX - touch.x)
                zoomLevel += (lastTouchX - touch.x) * 0.1;
                // cameraX = Math.round(cameraX + (lastMouseX - x)/zoomLevel);
            }
            if(lastTouchY !== 0){
                // console.log(lastTouchY - touch.y)
                zoomLevel += (lastTouchY - touch.y) * 0.1;
                // cameraY = Math.round(cameraY + (lastMouseY - y)/zoomLevel);
            }
            lastTouchX = touch.pageX;
            lastTouchY = touch.pageY;

        }
        let x = e.targetTouches[0].pageX;
        let y = e.targetTouches[0].pageY;
        if(mouseDown){
            if(lastMouseX !== 0){
                cameraX = Math.round(cameraX + (lastMouseX - x)/zoomLevel);
            }
            if(lastMouseY !== 0){
                cameraY = Math.round(cameraY + (lastMouseY - y)/zoomLevel);
            }
            redraw();
        }
        lastMouseY = y;
        lastMouseX = x;
    });
    document.getElementById("canvas").addEventListener('touchstart', () => {
        mouseDown = true;
    })
    document.getElementById("canvas").addEventListener('touchend', () => {
        lastMouseY = 0;
        lastMouseX = 0;
        mouseDown = false;
    })
    document.getElementById("canvas").addEventListener('mousedown', (e) =>{
        if(DEBUG) {
            if (e.which === 3) {
                let floor = floors[currentFloor - 1];
                if (placeMode === 1)
                    floor.destinations[floor.destinations.length] = new Destination(lastMouseX / zoomLevel + cameraX, lastMouseY / zoomLevel + cameraY, curRoomIndex);
                else if (placeMode === 2)
                    floor.travelPoints[floor.travelPoints.length] = new TravelPoint(lastMouseX / zoomLevel + cameraX, lastMouseY / zoomLevel + cameraY, []);
                else
                    floor.travelPoints[floor.travelPoints.length] = new TravelPoint(lastMouseX / zoomLevel + cameraX, lastMouseY / zoomLevel + cameraY, [], true);

                redraw();
            } else if (e.which === 1) {
                if (placeMode !== 1) {
                    let floor = floors[currentFloor - 1];
                    let x = (e.pageX / zoomLevel) + cameraX;
                    let y = (e.pageY / zoomLevel) + cameraY;
                    let p = getPoint(x, y);
                    if (p.p) {
                        if (!selectedPoint) {
                            selectedPoint = p.p;
                        } else {
                            // console.log("clicked another point while point is selected")
                            //set selected point possible moves to clicked point
                            //set clicked point possible moves to selected point
                            p.p.moves[p.p.moves.length] = getPointIndex(selectedPoint, currentFloor);
                            selectedPoint.moves[selectedPoint.moves.length] = p.index;
                        }
                    }
                }
            }
        }
        mouseDown = true;
    });
    document.getElementById("startroute").addEventListener('click', () => {

        if(roomDestination || roomOrigin){
            document.getElementById("startroute").classList.remove("btn-danger")
            document.getElementById("startroute").classList.add("btn-success")
            document.getElementById("startroute").style = "padding: 0 1em"
            document.getElementById("startroute").innerText = "GO";
            document.getElementById("roomstart").value = "";
            document.getElementById("roomdest").value = "";
            roomOrigin = 0;
            roomDestination = 0;
            pathsToTake = [[],[],[],[]];
            redraw();
            return;
        }

        let endingRoom = document.getElementById("roomdest");
        endingRoom = parseInt(endingRoom.value);

        if(isNaN(endingRoom) || getFloor(endingRoom) === -1){
            displayError("You must enter a number for destination", 3000);
            document.getElementById("roomdest").classList.add("invalid");
           return;
        } else {
            let validRoom = false;
            for(let i = 0; i < floors[getFloor(endingRoom)-1].destinations.length; i++){
                if(floors[getFloor(endingRoom)-1].destinations[i].number === endingRoom){
                    validRoom = true;
                }
            }
            if(!validRoom){
                displayError("Room number " + endingRoom + " does not exist", 3000);
                document.getElementById("roomdest").classList.add("invalid");
                return;
            }
            document.getElementById("roomdest").classList.remove("invalid");
        }
        //TODO if origin room is bad then start from entrance

        let startingRoom = document.getElementById("roomstart")
        startingRoom = parseInt(startingRoom.value);
        if(startingRoom === endingRoom){
            displayError("Starting room must be different than ending room", 3000);
            return;
        }
        let valid = false;
        if(!isNaN(startingRoom)){
            for(let i = 0; i < floors[getFloor(startingRoom)-1].destinations.length; i++){
                if(floors[getFloor(startingRoom)-1].destinations[i].number === startingRoom){
                    valid = true;
                }
            }
        }
        if(isNaN(startingRoom) || !valid){
            startingRoom = 100;
        }

        document.getElementById("startroute").classList.remove("btn-success")
        document.getElementById("startroute").classList.add("btn-danger")
        document.getElementById("startroute").innerText = "STOP";
        document.getElementById("startroute").style = "padding: 0 .5em"

        answers = [[], [], [], []];
        pathsToTake = [[], [], [], []]
        //if starting room is 0 then route from the rotunda front door
        // console.log("start route");
        // route will be represented by an array of point indexes to take
        // but how to store different paths across floors?
        // 4 length index each index is the floor (0 = floor 1...)
        // program will display route and draw some arrows from start to finish

        let roomOriginArr = getRoom(startingRoom);
        let roomDestinationArr = getRoom(endingRoom);

        let result = findMinDist(roomOriginArr, roomDestinationArr);
        roomOrigin = roomOriginArr[result.start];
        roomDestination = roomDestinationArr[result.end];

        let destinationFloorNum = getFloor(endingRoom);
        let startingFloorNum = getFloor(startingRoom);



        // console.log("dest floor: " + destinationFloorNum + ", start floor: " + startingFloorNum);

        startingPoint = findClosestPoint(roomOrigin);

        setFloor(startingFloorNum)
        zoomLevel = 1.7;
        let viewportWidth = canvas.width / zoomLevel;
        let viewportHeight = canvas.height / zoomLevel;

        cameraX = startingPoint.x - (viewportWidth/2);
        cameraY = startingPoint.y - (viewportHeight / 2);
        redraw();

        endingPoint = findClosestPoint(roomDestination);

        selectedPoint = startingPoint;

        let reachedDest = false;
        let curFloor = startingFloorNum;
        while(!reachedDest){

            let lowestDst = Infinity;
            let lowestDstOrder = [];
            if(curFloor !== destinationFloorNum){//find some mf stairs
                // endingPoint = findClosestStairWeighted(startingPoint, endingPoint, startingFloorNum);
                endingPoint = findClosestStair(roomDestination, startingFloorNum);
                // console.log("finding some stairs - " + endingPoint);
                // console.log(endingPoint);
            } else {
                endingPoint = findClosestPoint(roomDestination);
            }
            if(startingPoint === endingPoint){ // only one point to travel workaround
                lowestDst = 0;
                lowestDstOrder = [getPointIndex(startingPoint, curFloor)];
            } else {
                // multiple points to travel
                // stairs only have 1 point connecting to them
                let shouldAddStair = false;
                let stairRef;
                if(startingPoint.isStair){
                    shouldAddStair = true;
                    stairRef = startingPoint;
                    startingPoint = floors[curFloor-1].travelPoints[startingPoint.moves[0]]
                }
                for(let i = 0; i < startingPoint.moves.length; i++){
                    // go through possible moves
                    // console.log("moving from startingpoint on floor " + curFloor)
                    // keep track of where we have visited so we dont waste time revisiting
                    let visited = new Array(floors[curFloor-1].travelPoints.length).fill(false);
                    visited[getPointIndex(startingPoint, curFloor)] = true;
                    // keep track of the order we visit in to show directions
                    let visit_order = [];
                    if(shouldAddStair){
                        visit_order[0] = getPointIndex(stairRef, curFloor);
                        visited[getPointIndex(stairRef, curFloor)] = true;
                    }
                    visit_order[visit_order.length] = getPointIndex(startingPoint, curFloor)

                    let result = exploreDirection(visited, startingPoint, startingPoint.moves[i], visit_order, endingPoint, floors[curFloor-1], 0);
                    if(result){
                        // console.log("function returned dst of " + result.dst);
                    }

                    // if(result && result.dst < lowestDst){
                    //     lowestDstOrder = result.order;
                    //     lowestDst = result.dst;
                    // }
                    //for multi floor
                }
                for(let i = 0; i < answers[curFloor-1].length; i++){
                    let result = answers[curFloor-1][i];
                    if(result && result.dst < lowestDst){
                        lowestDst = result.dst;
                        lowestDstOrder = result.order;
                    }
                }
            }
            // we found shortest path to stairs now we go to the level we want (this is ignoring the fact that
            // there are one flight stairs in the middle of mainstreet
            if(curFloor === destinationFloorNum){
                reachedDest = true;
            }

            pathsToTake[curFloor-1] = lowestDstOrder;
            curFloor = destinationFloorNum;
            // startingPoint = findClosestStairWeighted(startingPoint, endingPoint, curFloor);
            startingPoint = findClosestStair(endingPoint, destinationFloorNum);
            // console.log("CLOSEST STAIR: " + startingPoint)
            // console.log("NEW STARTING POINT: ")
            // console.log(startingPoint);

            // console.log("lowestdst = " + lowestDst);
        }





        redraw();
    })
}

var answers = [[], [], [], []];

function findClosestStair(start, floor){
    let lowestDist = Infinity;
    let lowestStair = -1;
    for(let i = 0; i < floors[floor-1].travelPoints.length; i++){
        let p = floors[floor-1].travelPoints[i];
        if(p.isStair){
            let dst = getDistance(p, start);
            if(dst < lowestDist){
                lowestDist = dst;
                lowestStair = p;
            }
        }
    }
    return lowestStair;
}

function findClosestStairWeighted(start, end, floor){
    let lowestDist = Infinity;
    let lowestStair = -1;
    for(let i = 0; i < floors[floor-1].travelPoints.length; i++){
        let p = floors[floor-1].travelPoints[i];
        if(p.isStair){
            let dst = getDistance(p, start) + getDistance(p, end);
            if(dst < lowestDist){
                lowestDist = dst;
                lowestStair = p;
            }
        }
    }
    return lowestStair;
}

function findMinDist(startArr, destinstionArr){
    let lowestStartIndex = 0;
    let lowest = Infinity;
    let lowestEndIndex = 0;
    for(let i = 0; i < startArr.length; i++){
        for(let j = 0; j < destinstionArr.length; j++){
            let dst = getDistance(startArr[i], destinstionArr[j]);
            if(dst < lowest){
                lowest = dst;
                lowestStartIndex = i;
                lowestEndIndex = j;
            }
        }
    }
    return {start: lowestStartIndex, end: lowestEndIndex};
}

// visited = array of booleans representing which travelpoints haven't been touched
// from = index_to_visit from last iteration
// visit_order array containing indices of points that have been visited
// floor the current floor
// totalDistance a recursive counter
function exploreDirection(visited, from, index_to_visit, visit_order, ending_point, floor, totalDistance){
    if(from === ending_point){
        // console.log("from === ending_point", from, ending_point);
        answers[floor.number-1][answers[floor.number-1].length] = {dst: totalDistance, order: visit_order};
        return {dst: totalDistance, order: visit_order};
    }
    // console.log("dest=" + getPointIndex(ending_point, floor.number) + " visiting index: " + index_to_visit + " from " + (getPointIndex(from, floor.number) === -1 ? "origin" : getPointIndex(from, floor.number)));
    // p is point we travelled to
    let p = floor.travelPoints[index_to_visit];
    // we add it to the list of visited points
    visit_order[visit_order.length] = index_to_visit;
    // we set this point to visited
    visited[index_to_visit] = true;
    // add the distance it took us to get here
    totalDistance += getDistance(from, p);
    //if this point is the ending point we return the distance and order
    if(p === ending_point){
        // console.log("WE REACHED THE DESTINATION POINT (" + getPointIndex(ending_point, floor.number) + ")");
        // console.log(totalDistance);
        answers[floor.number-1][answers[floor.number-1].length] = {dst: totalDistance, order: visit_order};
        return {dst: totalDistance, order: visit_order};
    }
    // otherwise we keep going through our points
    for(let i = 0; i < p.moves.length; i++){
        if(visited[p.moves[i]])
            continue;
        let visitedClone = [...visited];
        let visit_orderClone = [...visit_order];
        // console.log(visit_orderClone);
        exploreDirection(visitedClone, p, p.moves[i], visit_orderClone, ending_point, floor, totalDistance);
    }


    // let overrideIndex = -1;
    // if(p.moves.length > 1){//there is a split
    //     let lowestDistance = Infinity;
    //     let lowestDistanceIndex = -1;
    //     let totalBranches = 0;
    //     for(let i = 0; i < p.moves.length; i++){
    //         if(visited[p.moves[i]]) {
    //             continue;
    //         }
    //         totalBranches++;
    //         let dist = getDistance(floor.travelPoints[p.moves[i]], ending_point);
    //
    //         if(dist < lowestDistance){
    //             lowestDistanceIndex = p.moves[i];
    //             lowestDistance = dist;
    //         }
    //     }
    //     if(totalBranches > 1){
    //         overrideIndex = lowestDistanceIndex;
    //     }
    //     console.log("BRANCH DETECTED, TAKE INDEX " + lowestDistanceIndex);
    // }
    // if(overrideIndex === -1) {
    //     for (let i = 0; i < p.moves.length; i++) {
    //         if (visited[p.moves[i]]) {// dont visit somewhere we already went
    //             console.log("already visited " + p.moves[i])
    //             continue;
    //         }
    //         // should go all the way back up the stack of recursive calls
    //         return exploreDirection(visited, p, p.moves[i], visit_order, ending_point, floor, totalDistance);
    //     }
    // } else {
    //     return exploreDirection(visited, p, overrideIndex, visit_order, ending_point, floor, totalDistance)
    // }

}

function findClosestPoint(room){
    let lowestDst = Infinity;
    let lowestPt = null;
    let floor = floors[getFloor(room.number)-1];

    for(let i = 0; i < floor.travelPoints.length; i++){
        let distance = getDistance(room, floor.travelPoints[i]);
        if(distance < lowestDst){
            lowestDst = distance;
            lowestPt = floor.travelPoints[i];
        }
    }
    return lowestPt;
}

function getRoom(num){

    let floor = floors[getFloor(num)-1];
    let rooms = [];
    for(let i = 0; i < floor.destinations.length; i++){
        if(floor.destinations[i].number === num){
            rooms[rooms.length] = floor.destinations[i];
        }
    }
    return rooms;
}

function getDistance(p1, p2){
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + (Math.pow(p2.y - p1.y, 2)));
}

function getPointIndex(p, floorNum){
    let floor = floors[floorNum-1];
    for(let i = 0; i < floor.travelPoints.length; i++){
        if(floor.travelPoints[i] === p){
            return i;
        }
    }
    return -1;
}

// function getPointIndex(p){
//     let floor = floors[currentFloor-1];
//     for(let i = 0; i < floor.travelPoints.length; i++){
//         if(floor.travelPoints[i] === p){
//             return i;
//         }
//     }
//     return -1;
// }

function getPoint(x, y){
    let floor = floors[currentFloor-1];
    for(let i = 0; i < floor.travelPoints.length; i++){
        let p = floor.travelPoints[i];

        if(Math.abs(p.x - x) < 4 && Math.abs(p.y - y) < 4){
            return {p: p, index: i};
        }
    }
    return null;
}

document.getElementById("canvas").addEventListener('mouseup', () =>{
    mouseDown = false;
    lastMouseX = 0;
    lastMouseY = 0;
});
document.getElementById("canvas").addEventListener("wheel", event => {
    // -1 means up, 1 means down

    var oldX = (lastMouseX / zoomLevel) + cameraX;
    var oldY = (lastMouseY / zoomLevel) + cameraY;
    if(Math.sign(event.deltaY) === -1){
        // zoom in
        zoomLevel += 0.1;
        if(zoomLevel > 2) {
            zoomLevel = 2;
        } else {
            context.scale(1.1, 1.1);
        }

    } else {
        // zoom out
        zoomLevel -= 0.1;
        if(zoomLevel < 0.2){
            zoomLevel = 0.2;
        } else {
            context.scale(0.9, 0.9);
        }

    }
    var roundedZoom = Math.round(zoomLevel * 10) / 10;
    zoomLevel = Math.max(-0.3, Math.min(roundedZoom, 2));
    // Zoom relative to the mouse cursor
    var newX = (lastMouseX / zoomLevel) + cameraX;
    var newY = (lastMouseY / zoomLevel) + cameraY;
    cameraX += oldX - newX;
    cameraY += oldY - newY;
    redraw();
});

initialize();

function initialize(){
    loadImages();
    setupData();
    // Register an event listener to call the resizeCanvas() function
    // each time the window is resized.
    window.addEventListener('resize', resizeCanvas, false);

    // Draw canvas border for the first time.
    hideFloorSelector();
    resizeCanvas();

}

/*
        double x = event.getX() / _camera.getZoom() + _camera.getX();//will always get local world location instead of relating to screen pos
        double y = event.getY() / _camera.getZoom() + _camera.getY();
 */

function getFloor(roomNumber){
    if(roomNumber <= 99 || roomNumber >= 1100){
        console.log("getFloor(): room number " + roomNumber + " out of bounds returning -1")
        return -1;

    }
    while(roomNumber > 9){
        roomNumber /= 10;
    }
    switch(parseInt(roomNumber)){
        case 1:
        case 5:
        case 8:
            return 1;
        case 2:
        case 6:
        case 9:
            return 2;
        case 3:
        case 7:
        case 10:
            return 3;
        case 4:
            return 4;
        default:
            console.log("getFloor(): room number " + roomNumber + " not matching case returning -1")
            return -1;

    }
}

function drawLine(xFrom, yFrom, xTo, yTo){
    context.beginPath();

    context.moveTo(xFrom, yFrom);
    context.lineTo(xTo, yTo);
    context.stroke();
}

// Display custom canvas. In this case it's a blue, 5 pixel
// border that resizes along with the browser window.
function redraw() {
    if(!didFinishLoadingPictures)
        return;

    // clear the canvas
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.setTransform(zoomLevel, 0, 0, zoomLevel, 0, 0);
    context.drawImage(image[currentFloor-1], 0 - cameraX,  0 - cameraY);
    let floor = floors[currentFloor-1];
    context.strokeStyle = 'red';
    context.lineWidth = '1';
    context.font = "200px Arial";
    context.fillStyle = 'blue';
    context.fillText("KHS MAP", image[currentFloor-1].width/2 - cameraX, 100 - cameraY);
    context.font = "50px Arial";
    context.fillStyle = 'black';
    context.fillText("Made by Josh Garza", 0 - cameraX, image[currentFloor-1].height - cameraY);
    if(!roomDestination.number){
        context.font = "16px Calibri";
        for(let i = 0; i < floor.destinations.length; i++){
            let dest = floor.destinations[i];
            context.fillStyle = 'red'
            context.strokeText(dest.number, dest.x - cameraX - 10, dest.y - cameraY - 5)
            context.beginPath();
            context.arc(dest.x-.5 - cameraX, dest.y-.5 - cameraY, 2, 0, 2* Math.PI, false);
            context.fill();
            context.closePath();
        }
    }
    if(pathsToTake[currentFloor-1].length === 1){
        drawLine(roomOrigin.x-.5-cameraX, roomOrigin.y-.5-cameraY, startingPoint.x-.5-cameraX, startingPoint.y-.5-cameraY);
        drawLine(roomDestination.x-.5-cameraX, roomDestination.y-.5-cameraY, startingPoint.x-.5-cameraX, startingPoint.y-.5-cameraY);
    }
    for(let i = 0; i < pathsToTake[currentFloor-1].length-1; i++){
        context.font = "16px Calibri";
        let point = floor.travelPoints[pathsToTake[currentFloor-1][i]];
        let point2 = floor.travelPoints[pathsToTake[currentFloor-1][i+1]];
        if(i === 0){
            context.fillStyle = 'red';
            if(point.isStair){
                context.strokeText("You are here (Floor " + currentFloor + ")", point.x - cameraX, point.y - cameraY - 5);
            } else {
                drawLine(roomOrigin.x - .5 - cameraX, roomOrigin.y - cameraY, point.x-.5 - cameraX, point.y - cameraY-.5)
                context.strokeText("You are here (" + roomOrigin.number + ")", point.x - cameraX, point.y - cameraY - 5);
            }
        }
        if(i === pathsToTake[currentFloor-1].length-2){
            context.fillStyle = 'red';
            let text = "";
            if(point2.isStair){
                text = "Take the stairs " + (getFloor(roomDestination.number) > getFloor(roomOrigin.number) ? "up" : "down") + " to floor " + getFloor(roomDestination.number);
            } else {
                text = "Destination (" + roomDestination.number + ")";
                drawLine(roomDestination.x-.5 - cameraX, roomDestination.y-.5 - cameraY, point2.x-.5 - cameraX, point2.y-.5 - cameraY);
            }

            context.strokeText(text, point2.x - cameraX, point2.y - cameraY - 5);
        }
        context.strokeStyle = 'red'

        drawLine(point.x-.5-cameraX, point.y-.5-cameraY, point2.x-.5-cameraX, point2.y-.5-cameraY);
    }
    if(DEBUG){
        context.strokeStyle = 'black';
        context.lineWidth = '5';
        context.strokeRect(0 - cameraX, 0 - cameraY, image[currentFloor-1].width, image[currentFloor-1].height);
        floor = floors[currentFloor-1];
        // for(let i = 0; i < floor.destinations.length; i++){
        //     let dest = floor.destinations[i];
        //     context.fillStyle = 'red'
        //     context.fillText(dest.number, dest.x - cameraX - 5, dest.y - cameraY - 2)
        //     context.beginPath();
        //     context.arc(dest.x-.5 - cameraX, dest.y-.5 - cameraY, 2, 0, 2* Math.PI, false);
        //     context.fill();
        //     context.closePath();
        // }
        for(let i = 0; i < floor.travelPoints.length; i++){
            let point = floor.travelPoints[i];
            if(point === selectedPoint){
                context.fillStyle = 'green';
            } else if(point.isStair) {
                context.fillStyle = 'pink';
            } else {
                context.fillStyle = 'blue'
            }

            context.fillText(i, point.x - cameraX - 5, point.y - cameraY - 3)
            context.beginPath();
            context.arc(point.x-.5 - cameraX, point.y-.5 - cameraY, 2, 0, 2* Math.PI, false);
            context.fill();
            context.closePath();

            context.lineWidth = '1';
            context.strokeStyle = 'yellow';
            if(point.moves)
            for(let moveIndex = 0; moveIndex < point.moves.length; moveIndex++){
                context.beginPath();
                context.moveTo(point.x-.5-cameraX, point.y-.5-cameraY);
                let connectingPoint = floor.travelPoints[point.moves[moveIndex]];
                context.lineTo(connectingPoint.x-.5-cameraX, connectingPoint.y-.5-cameraY);
                context.stroke();
            }

        }

        context.setTransform(1, 0, 0, 1, 0, 0);
        context.fillStyle = 'white';
        context.font = "16px Calibri";
        // context.fillRect(760, 10, 400, 100);
        context.fillStyle = 'black';
        // context.fillText("cameraX: " + Math.round(cameraX) + ", cameraY: " + Math.round(cameraY) + ", zoomLevel: " + zoomLevel, 800, 20);
        var mode;
        switch(placeMode){
            case 1:
                mode = "Destinations";
                break;
            case 2:
                mode = "Travel points";
                break;
            case 3:
                mode = "Stair points";
                break;
        }
        // context.fillText("mode is " + mode, 800, 40);
        // context.fillText("cursorX: " + Math.round(lastMouseX / zoomLevel + cameraX) + ", cursorY: " + Math.round(lastMouseY / zoomLevel + cameraY), 800, 60);
        // context.fillText("room index: " + curRoomIndex, 900, 80);
        // requestAnimationFrame(redraw);
    }

}

// Runs each time the DOM window resize event fires.
// Resets the canvas dimensions to match window,
// then draws the new borders accordingly.
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Set zoom level on resize otherwise it will reset because of how zoom is implemented
    context.scale(zoomLevel, zoomLevel);
    redraw();
}