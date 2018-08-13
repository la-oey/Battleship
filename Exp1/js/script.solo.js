var client = parseClient();
var trialNumber = 0;
var trialData = [];
var Trial = 10;
var rows = 4; //switch both to 8 later
var cols = 4;
var teachOrigSpaces = [];
var learnOrigSpaces = [];
var teachAvailable = [];
var learnAvailable = [];
var battleship = [];
var turnColors = ['red','orange','yellow','green','blue','purple','magenta','hotpink'];
var turn = 0;
var highlighted = 0;
var inited = false;
var cellsDrawn = 0;
var cellsCorr = 0;


function create_table(rows, cols) { //rows * cols = number of exemplars
  var table = "<table id='gameboard'>";
  for(var i=0; i <rows; i++) {
    table += "<tr>";
    for(var j=0; j<cols; j++) {
        var ind = i * cols + j;
        table += "<td class='cell' id='cell_" + ind + "'> </td>";
    }
    table += "</tr>"
  }
  table += "</table>";
  $("#trialDiv").append(table);
}

function buildTeacherTable(row, col){
    var bucket = [];
    for (var r=0; r<row; r++) {
        for (var c=0; c<col; c++){
            bucket.push({r,c});
        }
    }
    return(bucket);
}

function buildLearnerTable(teacherTable){
    return(sample_without_replacement(teacherTable.length/2, teacherTable));
}

function sample(availSpaces){
    return(availSpaces[Math.floor(Math.random() * availSpaces.length)]);
}

function pageLoad(){
    document.getElementById('consent').style.display = 'block';
}

function clickConsent(){
    document.getElementById('consent').style.display = 'none';
    //document.getElementById('instructions').style.display = 'block';
    document.getElementById('selectDiff').style.display = 'block';
}

function clickDiff(){
    document.getElementById('selectDiff').style.display = 'none';
    document.getElementById('instructions').style.display = 'block';
}

function clickInstructions(){
    rows = $('input[name=boardDim]:checked').val();
    cols = $('input[name=boardDim]:checked').val();
    document.getElementById('instructions').style.display = 'none';
    teachOrigSpaces = buildTeacherTable(rows, cols);
    learnOrigSpaces = buildLearnerTable(teachOrigSpaces);

    console.log(learnOrigSpaces);
    trialStart();
}

function teachTurn(openSpaces,battleshipLoc){
    var halfSpaces = [];
    
    var minR = lowerR = rows;
    var maxR = higherR = -1;
    var minC = lowerC = cols;
    var maxC = higherC = -1;
    for(var i=0; i<openSpaces.length; i++){
        if(openSpaces[i].r < minR){
            minR = openSpaces[i].r;
        }
        if(openSpaces[i].r > maxR){
            maxR = openSpaces[i].r;
        }

        if(openSpaces[i].c < minC){
            minC = openSpaces[i].c;
        }
        if(openSpaces[i].c > maxC){
            maxC = openSpaces[i].c;
        }
    }

    if(maxR > minR){
        var halfR = (maxR + minR + 1)/2;
        if(battleshipLoc.r < halfR){
            lowerR = halfR;
            higherR = maxR;
            lowerC = minC;
            higherC = maxC;
        } else{
            lowerR = minR;
            higherR = halfR-1;
            lowerC = minC;
            higherC = maxC;
        }
        halfSpaces.push({lowerR,higherR,lowerC,higherC});
    }

    if(maxC > minC){
        var halfC = (maxC + minC + 1)/2;
        if(battleshipLoc.c < halfC){
            lowerR = minR;
            higherR = maxR;
            lowerC = halfC;
            higherC = maxC;
        } else{
            lowerR = minR;
            higherR = maxR;
            lowerC = minC;
            higherC = halfC-1;
        }
        halfSpaces.push({lowerR,higherR,lowerC,higherC});
    }
    return(halfSpaces);
}

function highlight(check){
    var halfSpaces = teachTurn(teachAvailable,battleship);


    if(halfSpaces.length==1){ //checks if there is only one potential byte to eliminate
        check=0;
    } else{ //unhighlight currently highlighted area
        for(var r=halfSpaces[Math.abs(check-1)].lowerR; r<=halfSpaces[Math.abs(check-1)].higherR; r++){
            for(var c=halfSpaces[Math.abs(check-1)].lowerC; c<=halfSpaces[Math.abs(check-1)].higherC; c++){
                $('#cell_' + (r*cols+c)).css({'background-color':'white'});
            }
        }
    }

    for(var r=halfSpaces[check].lowerR; r<=halfSpaces[check].higherR; r++){
        for(var c=halfSpaces[check].lowerC; c<=halfSpaces[check].higherC; c++){
            $('#cell_' + (r*cols+c)).css({'background-color':turnColors[turn],
                                        'opacity': '0.3'});
        }
    }
    document.getElementById('gameboard').setAttribute('onclick','clickBoard('+check+');');
}

function clickBoard(selected){
    var elimSpaces = [];
    var halfSpaces = teachTurn(teachAvailable,battleship);
    //var move = sample(halfSpaces); //replace for passive learner expt
    
    if(halfSpaces.length==1){ //checks if there is only one potential byte to eliminate
        selected=0;
    } 
    for(var r=halfSpaces[selected].lowerR; r<=halfSpaces[selected].higherR; r++){
        for(var c=halfSpaces[selected].lowerC; c<=halfSpaces[selected].higherC; c++){
            $('#cell_' + (r*cols+c)).css({'background-color':turnColors[turn],
                                        'opacity':'1'});
            elimSpaces.push({r,c});
        }
    }

    //check for matches between values eliminated and values in the learner's & teacher's open hypothesis space
    for(var e=0; e<elimSpaces.length; e++){
        for(var l=0; l<learnAvailable.length; l++){
            if(elimSpaces[e].r==learnAvailable[l].r & elimSpaces[e].c==learnAvailable[l].c){
                learnAvailable.splice(l,1);
            }
        }
        for(var t=0; t<teachAvailable.length; t++){
            if(elimSpaces[e].r==teachAvailable[t].r & elimSpaces[e].c==teachAvailable[t].c){
                teachAvailable.splice(t,1);
            }
        }
    }

    document.getElementById('spacesOpen').innerHTML = learnAvailable.length;
    document.getElementById('spacesElim').innerHTML = learnOrigSpaces.length - learnAvailable.length;
    ++turn;

    if(learnAvailable.length==1){
        document.getElementById('gameboard').setAttribute('onclick','');
        document.getElementById('next').disabled=false;
        document.onkeydown = null;
    }
    inited = false;
}

function draw(index, marked){
    if(!marked){
        $('#cell_'+index).css({'background-color':'black'});
        ++cellsDrawn;
        document.getElementById('cell_'+index).setAttribute('cellSelected','true');
        document.getElementById('cell_'+index).setAttribute('onclick','draw(' + index + ',true)');
        document.getElementById('spacesDrawn').innerHTML = cellsDrawn;
    } else{
        $('#cell_'+index).css({'background-color':'white'});
        --cellsDrawn;
        document.getElementById('cell_'+index).setAttribute('cellSelected','false');
        document.getElementById('cell_'+index).setAttribute('onclick','draw(' + index + ',false)');
        document.getElementById('spacesDrawn').innerHTML = cellsDrawn;
    }

    if(cellsDrawn == learnOrigSpaces.length){
        document.getElementById('next').disabled=false;
    } else{
        document.getElementById('next').disabled=true;

    }

}


function trialStart(){
    //add experiment here
    create_table(rows, cols);
    document.getElementById('trial').style.display = 'block';
    document.getElementById('next').disabled=true;
    document.getElementById('trialTxt').innerHTML = 'Trial ' + (trialNumber+1);
    document.getElementById('feedback').innerHTML = "Spaces Open: <p2 id='spacesOpen'></p2><br>Spaces Eliminated: <p2 id='spacesElim'></p2><br><br>"
    document.getElementById('spacesOpen').innerHTML = learnOrigSpaces.length;
    document.getElementById('spacesElim').innerHTML = 0;
    document.getElementById('gameboard').setAttribute('onclick','');
    document.getElementById('trialInstruct').innerHTML = 'Use "z" to switch between choices.<br>Use the return key to submit your choice.'

    teachAvailable = teachOrigSpaces.slice(0);
    learnAvailable = learnOrigSpaces.slice(0); //clones array of learner's spaces
    //temporarily draw in learner's available spaces
    // for(var i=0; i<learnAvailable.length; i++){
    //     ind = learnAvailable[i].r*cols+learnAvailable[i].c;
    //     $('#cell_'+ind).css({'background-color':'Green'});
    // }


    battleship = sample(learnAvailable); //set Battleship
    document.getElementById('cell_' + teachAvailable.indexOf(battleship)).innerHTML = '&#127850;';

    highlighted = 0;
    inited = false;
 
    document.onkeydown = function (e) {
        var keyCode = e.keyCode;
        if(keyCode==90){
            highlight(highlighted);
            if(highlighted==0){
                highlighted=1;
            } else{
                highlighted=0;
            }
            inited = true;
        }

        if(keyCode==13 & inited){
            clickBoard(Math.abs(highlighted-1));
        }
    };
}

function trialDraw(){
    cellsDrawn = 0;
    
    document.getElementById('gameboard').remove();
    create_table(rows, cols);
    for(var i=0; i<rows*cols; i++){
        document.getElementById('cell_'+i).setAttribute('onclick','draw('+i+',false);');
        document.getElementById('cell_'+i).setAttribute('cellSelected','false');
    }
    //document.getElementById('next').disabled=true; //uncomment this later
    document.getElementById('next').setAttribute('onclick','trialFeedback();');
    document.getElementById('trialInstruct').innerHTML = 'Click on the cells with your mouse.<br><br>';
    document.getElementById('feedback').innerHTML = "Spaces Drawn: <p2 id='spacesDrawn'></p2> / " + learnOrigSpaces.length + "<br><br><br>";
    document.getElementById('spacesDrawn').innerHTML = cellsDrawn;
    
    //click and drag over cells to draw--buggy right now
    // $(document).ready(function(){
    //     var isDown = false;   // Tracks status of mouse button
    //     var mark = false;
    //     var countCells = 0;

    //     $(document).mousedown(function() {
    //         isDown = true;      // When mouse goes down, set isDown to true
    //     })
    //     .mouseup(function() {
    //         isDown = false;    // When mouse goes up, set isDown to false
    //     });

    //     $(".cell").mouseover(function(){
    //         if(isDown) {        // Only change css if mouse is down
                
    //             console.log($(this).attr('cellSelected'))
    //             if($(this).attr('cellSelected')=='false'){
    //                 $(this).css({'background-color':'black'});
    //                 if($(this).attr('cellSelected')=='false'){
    //                     ++countCells;
    //                     cellsDrawn = cellsDrawn + countCells;
    //                     document.getElementById('spacesDrawn').innerHTML = cellsDrawn;
    //                 }
    //                 $(this).attr('cellSelected','true');  
    //             } else{
    //                 $(this).css({'background-color':'white'});
    //                 if($(this).attr('cellSelected')=='true'){
    //                     --countCells;
    //                 cellsDrawn = cellsDrawn + countCells;
    //                 document.getElementById('spacesDrawn').innerHTML = cellsDrawn;
    //                 }
    //                 $(this).attr('cellSelected','false');
    //             }
    //         }
    //     });
    // });

    
}

function trialFeedback(){
    cellsCorr = 0;
    document.getElementById('next').setAttribute('onclick','trialDone();');
    document.getElementById('feedback').innerHTML = "Spaces Correct: <p2 id='spacesCorr'></p2> / " + learnOrigSpaces.length + "<br><br><br>";
    for(var a=0; a<learnOrigSpaces.length; a++){
        index = learnOrigSpaces[a].r * cols + learnOrigSpaces[a].c;
        if($('#cell_'+index).attr('cellSelected')=='true'){
            ++cellsCorr;
        }
    }
    document.getElementById('spacesCorr').innerHTML = cellsCorr;
    document.getElementById('trialInstruct').innerHTML = '<br><br><br>';
    document.getElementById('gameboard').remove();
    
    
}

function trialDone(){
    // for isolated product version
    document.getElementById('trial').style.display = 'none';
    // record what the subject said
    trialData.push({
        trialNumber: trialNumber,
        response: 1}); //change later
    // increment the trialNumber
    ++trialNumber;
    // if we are done with all trials, then go to completed page
    if(trialNumber >= Trial){  // products.length
        //document.getElementById('completed').style.display = 'block';
        // these lines write to server.
        data = {client: client, trials: trialData};
        writeServer(data);
        document.getElementById('trial').style.display = 'none';
        document.getElementById('completed').style.display = 'block';
    }
    else {
        //document.getElementById('gameboard').remove();
        document.getElementById('next').setAttribute('onclick','trialDraw();');
        turn = 0;
        trialStart();
    }
}

// function attention_single(){
//     // take next product, and put in the product description.
// //  choosePic();
// document.getElementById('trial').style.display = 'none';
//     attention = Math.floor(Math.random() * products.length);
// document.getElementById('attentionText').innerHTML = products[attention].name;
// document.getElementById("AttPicture").src = products[attention].img;
//     // reset the slider
//     document.getElementById('AttSlider').value = 500;

//     document.getElementById('trialAttention').style.display = 'block';
// document.getElementById('done').disabled=true;
//     order = order+1;
// }

// function Acheck_single(){
//  trialData.push({
//      attention:document.getElementById('AttSlider').value});
//     document.getElementById('trialAttention').style.display = 'none';
//     trialStart();
// }

function experimentDone(){
    window.location = 'http://www.evullab.org';
}

function sample_without_replacement(sampleSize, sample){
  var urn = sample.slice(0);
  var return_sample = [];
  for(var i=0; i<sampleSize; i++){
    var randomIndex = Math.floor(Math.random()*urn.length);
    return_sample.push(urn.splice(randomIndex, 1)[0]);
  }
  return return_sample;
}




