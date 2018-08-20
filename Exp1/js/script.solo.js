var client = parseClient();
var trialNumber = 0;
var trialData = [];
var Trial = 5;
var rows = 8;
var cols = 8;
var teachOrigSpaces = [];
var learnOrigSpaces = [];
var teachAvailable = [];
var learnAvailable = [];
var guessAvailable = [];
var numRemaining = 0;
var battleship = [];
var turnColors = ['red','orange','yellow','green','blue','purple','magenta','hotpink'];
var turn = 0;
var highlighted = 0;
var inited = false;
var numCellsPainted = 0;
var cellsCorr = 0;
var cellsPainted = [];
var guessedSpaces = [];


function create_table(rows, cols, tabID, divID) { //rows * cols = number of exemplars
  var table = "<table id='"+tabID+"'>";
  for(var i=0; i <rows; i++) {
    table += "<tr>";
    for(var j=0; j<cols; j++) {
        var ind = i * cols + j;
        table += "<td class='cell' id='"+tabID+"Cell_" + ind + "'> </td>";
    }
    table += "</tr>"
  }
  table += "</table>";
  $("#"+divID).append(table);
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
    document.getElementById('instructions').style.display = 'block';
    //document.getElementById('selectDiff').style.display = 'block';
}

// function clickDiff(){
//     document.getElementById('selectDiff').style.display = 'none';
//     document.getElementById('instructions').style.display = 'block';
// }

function clickInstructions(){
    // rows = $('input[name=boardDim]:checked').val();
    // cols = $('input[name=boardDim]:checked').val();
    document.getElementById('instructions').style.display = 'none';
    teachOrigSpaces = buildTeacherTable(rows, cols);
    learnOrigSpaces = buildLearnerTable(teachOrigSpaces);

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
                $('#gameboardCell_' + (r*cols+c)).css({'background-color':'white',
                                        'opacity':'1'});
            }
        }
    }

    for(var r=halfSpaces[check].lowerR; r<=halfSpaces[check].higherR; r++){
        for(var c=halfSpaces[check].lowerC; c<=halfSpaces[check].higherC; c++){
            $('#gameboardCell_' + (r*cols+c)).css({'background-color':turnColors[turn],
                                        'opacity':'0.3'});
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
            $('#gameboardCell_' + (r*cols+c)).css({'background-color':turnColors[turn],
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
        for(var g=0; g<guessAvailable.length; g++){
            if(elimSpaces[e].r==guessAvailable[g].r & elimSpaces[e].c==guessAvailable[g].c){
                guessAvailable.splice(g,1);
            }
        }
        for(var t=0; t<teachAvailable.length; t++){
            if(elimSpaces[e].r==teachAvailable[t].r & elimSpaces[e].c==teachAvailable[t].c){
                teachAvailable.splice(t,1);
            }
        }
    }

    //Computer's Guess
    //samples uniformly from set of hypothesis spaces not yet eliminated and not yet guessed
    var learnerGuess = sample(guessAvailable);
    var guessedInd = learnerGuess.r * cols + learnerGuess.c;
    if(guessedInd == (battleship.r * cols + battleship.c)){
        $('#target').remove();
        $('#gameboardCell_'+guessedInd).prepend('<img id="targetHit" src="img/targetHit.png" />');
    } else{
        $('#gameboardCell_'+guessedInd).prepend('<img id="arrow" src="img/arrow.png" />');
    }
    guessedSpaces.push(learnerGuess);
    guessAvailable.splice(guessAvailable.indexOf(learnerGuess),1);

    //Explicit Feedback
    document.getElementById('spacesOpen').innerHTML = learnAvailable.length;
    document.getElementById('spacesElim').innerHTML = learnOrigSpaces.length - learnAvailable.length;
    var numElimRound = numRemaining - learnAvailable.length;
    numRemaining = learnAvailable.length;
    $('#feedbackTurn').append("<font color='" + turnColors[turn] + "'>Turn " + (turn+1) + ": " + numElimRound + "</font><br><br>")
    ++turn;

    if(learnAvailable.length==1 || guessedInd==(battleship.r * cols+battleship.c)){
        document.getElementById('gameboard').setAttribute('onclick','');
        document.getElementById('next').disabled=false;
        document.onkeydown = null;
    }
    inited = false;
}

function paint(index, marked){
    if(!marked){
        $('#gameboardCell_'+index).css({'background-color':'white'});
        ++numCellsPainted;
        $('#gameboardCell_'+index).attr('cellSelected','true');
        $('#gameboardCell_'+index).attr('onclick','paint(' + index + ',true)');
        cellsPainted.push(teachOrigSpaces[index]);
        document.getElementById('spacesPainted').innerHTML = numCellsPainted;
    } else{
        $('#gameboardCell_'+index).css({'background-color':'gray'});
        --numCellsPainted;
        $('#gameboardCell_'+index).attr('cellSelected','false');
        $('#gameboardCell_'+index).attr('onclick','paint(' + index + ',false)');
        cellsPainted.splice(cellsPainted.indexOf(teachOrigSpaces[index]),1);
        document.getElementById('spacesPainted').innerHTML = numCellsPainted;
    }

    if(numCellsPainted == learnOrigSpaces.length){
        document.getElementById('next').disabled=false;
    } else{
        document.getElementById('next').disabled=true;
    }
}


function trialStart(){
    //add experiment here
    if(trialNumber > 0){
        var source = document.getElementById('gameboard');
        var destination = document.getElementById('completeBoard');
        var copy = source.cloneNode(true);
        copy.setAttribute('id', 'completeBoard');
        destination.parentNode.replaceChild(copy, destination);
        $('#completeBoard').show();
        document.getElementById('gameboard').remove();
    }

    create_table(rows, cols, 'gameboard', 'trialDiv');
    document.getElementById('trial').style.display = 'block';
    document.getElementById('next').disabled=true;
    document.getElementById('trialTxt').innerHTML = 'Trial ' + (trialNumber+1);
    document.getElementById('feedbackTurn').innerHTML = 'Cells Eliminated by Turn:<br><br>';
    document.getElementById('feedback').innerHTML = "<br>Spaces Open: <p2 id='spacesOpen'></p2><br>Spaces Eliminated: <p2 id='spacesElim'></p2><br><br>"
    document.getElementById('spacesOpen').innerHTML = learnOrigSpaces.length;
    document.getElementById('spacesElim').innerHTML = 0;
    document.getElementById('gameboard').setAttribute('onclick','');
    document.getElementById('trialInstruct').innerHTML = 'Use "z" to switch between choices.<br>Use the return key to submit your choice.'

    teachAvailable = teachOrigSpaces.slice(0);
    learnAvailable = learnOrigSpaces.slice(0); //clones array of learner's spaces
    guessAvailable = learnOrigSpaces.slice(0); //available guesses also clone of learner's space
    numRemaining = learnAvailable.length;

    battleship = sample(learnAvailable); //set Battleship
    //$('#gameboardCell_' + teachAvailable.indexOf(battleship)).html('&#127850;');
    $('#gameboardCell_' + teachAvailable.indexOf(battleship)).prepend('<img id="target" src="img/target.png" />');

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

function trialPaint(){
    //copy board
    var source = document.getElementById('gameboard');
    var destination = document.getElementById('completeBoard');
    var copy = source.cloneNode(true);
    copy.setAttribute('id', 'completeBoard');
    destination.parentNode.replaceChild(copy, destination);
    $('#completeBoard').show();

    //have participants amend previously painted cells
    //numCellsPainted = 0;
    document.getElementById('gameboard').remove();
    create_table(rows, cols, 'gameboard', 'trialDiv');
    for(var i=0; i<rows*cols; i++){
        $('#gameboardCell_'+i).attr('onclick','paint('+i+',false);');
        $('#gameboardCell_'+i).attr('cellSelected','false');
        $('#gameboardCell_'+i).css({'background-color':'gray'})
    }

    for(var j=0; j<cellsPainted.length; j++){
        index = cellsPainted[j].r * cols + cellsPainted[j].c;
        $('#gameboardCell_'+index).attr('onclick','paint('+index+',true);');
        $('#gameboardCell_'+index).attr('cellSelected','true');
        $('#gameboardCell_'+index).css({'background-color':'white'});
    }

    //document.getElementById('next').disabled=true; //uncomment this later
    document.getElementById('next').setAttribute('onclick','trialFeedback();');
    document.getElementById('trialInstruct').innerHTML = 'Click on the cells with your mouse.<br><br>';
    document.getElementById('feedback').innerHTML = "<br>Spaces Painted: <p2 id='spacesPainted'></p2> / " + learnOrigSpaces.length + "<br><br><br>";
    document.getElementById('spacesPainted').innerHTML = numCellsPainted;
    
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
    //                     cellsPainted = cellsPainted + countCells;
    //                     document.getElementById('spacesPainted').innerHTML = cellsPainted;
    //                 }
    //                 $(this).attr('cellSelected','true');  
    //             } else{
    //                 $(this).css({'background-color':'white'});
    //                 if($(this).attr('cellSelected')=='true'){
    //                     --countCells;
    //                 cellsPainted = cellsPainted + countCells;
    //                 document.getElementById('spacesPainted').innerHTML = cellsPainted;
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
    document.getElementById('feedbackTurn').innerHTML = '';
    $('#completeBoard').hide();
    $('#gameboard').hide();
    document.getElementById('feedback').innerHTML = "<br>Spaces Correct: <p2 id='spacesCorr'></p2> / " + learnOrigSpaces.length + "<br><br><br>";
    for(var a=0; a<learnOrigSpaces.length; a++){
        index = learnOrigSpaces[a].r * cols + learnOrigSpaces[a].c;
        if($('#gameboardCell_'+index).attr('cellSelected')=='true'){
            ++cellsCorr;
        }
    }

    document.getElementById('spacesCorr').innerHTML = cellsCorr;
    document.getElementById('trialInstruct').innerHTML = '<br><br><br>';
    
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
    if(trialNumber >= Trial){
        $('#finalCorr').html((cellsCorr/learnOrigSpaces.length*100).toFixed(2));

        $('#gameboard').show();
        var source = document.getElementById('gameboard');
        var destination = document.getElementById('finalBoard');
        var copy = source.cloneNode(true);
        copy.setAttribute('id', 'finalBoard');
        destination.parentNode.replaceChild(copy, destination);


        create_table(rows, cols, 'key', 'finalKey');
        for(var i=0; i<rows*cols; i++){
            $('#keyCell_'+i).css({'background-color':'red'});
        }
        for(var j=0; j<learnOrigSpaces.length; j++){
            ind = learnOrigSpaces[j].r*cols+learnOrigSpaces[j].c;
            $('#keyCell_'+ind).css({'background-color':'white'});
        }

        // these lines write to server.
        data = {client: client, trials: trialData};
        writeServer(data);
        document.getElementById('trial').style.display = 'none';
        document.getElementById('completed').style.display = 'block';
    }
    else {
        document.getElementById('next').setAttribute('onclick','trialPaint();');
        turn = 0;
        guessedSpaces = [];
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




