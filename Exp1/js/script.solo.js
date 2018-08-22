var client = parseClient();
var exptPart = "practice";
var trialNumber = 0;
var trialData = [];
var Trial = 5;
var rows = 4; //later switch both to 8
var cols = 4;
var teachOrigSpaces = [];
var learnOrigSpaces = [];
var teachAvailable = [];
var learnAvailable = [];
var guessAvailable = [];
var guessedSpaces = []; //array of guessed spaces indices
var eliminatedByTurn = [];
var numRemaining = 0;
var battleship = null;
var turnColors = [{color:'red', r:'255', g:'0', b:'0'},
                  {color:'orange', r:'255', g:'128', b:'0'},
                  {color:'yellow', r:'255', g:'255', b:'0'},
                  {color:'green', r:'0', g:'255', b:'0'},
                  {color:'blue', r:'0', g:'0', b:'255'},
                  {color:'purple', r:'255', g:'0', b:'255'}]
var turn = 0;
var highlighted = 0;
var inited = false;
var numCellsPainted = 0;
var cellsCorr = 0;
var cellsPainted = [];
var practiceGuess = true;
var guessCheck = false;
var role = 'learner';

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
    document.getElementById('practiceInstruct').style.display = 'block';
}

function clickPracticeRole(){
    document.getElementById('practiceInstruct').style.display = 'none';
    if(role == 'learner'){
        practiceLearner();
    } else{
        trialStart();
    }
}

function clickPostpractice(){
    document.getElementById('postpractice').style.display = 'none';
    document.getElementById('assignment').style.display = 'block';
}

function clickAssignment(){
    document.getElementById('assignment').style.display = 'none';
    document.getElementById('next').setAttribute('onclick','trialPaint();');
    exptPart = "experiment";
    //assign learner table for learning trials
    teachOrigSpaces = buildTeacherTable(rows, cols);
    learnOrigSpaces = buildLearnerTable(teachOrigSpaces);
    cellsPainted = [];
    numCellsPainted = 0;
    $('#gameboard').remove();
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
            $('#gameboardCell_' + (r*cols+c)).css({'background-color':turnColors[turn].color,
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
            $('#gameboardCell_' + (r*cols+c)).css({'background-color':turnColors[turn].color,
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
    eliminatedByTurn.push(elimSpaces);

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
    guessedSpaces.push(learnerGuess.r * cols + learnerGuess.c);
    guessAvailable.splice(guessAvailable.indexOf(learnerGuess),1);

    //Explicit Feedback
    document.getElementById('spacesOpen').innerHTML = learnAvailable.length;
    document.getElementById('spacesElim').innerHTML = learnOrigSpaces.length - learnAvailable.length;
    var numElimRound = numRemaining - learnAvailable.length;
    numRemaining = learnAvailable.length;
    $('#feedbackTurn').append("<font color='" + turnColors[turn].color + "'>Turn " + (turn+1) + ": " + numElimRound + "</font><br><br>")
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
    if(trialNumber > 0){
        var source = document.getElementById('gameboard');
        var destination = document.getElementById('completeBoard');
        var copy = source.cloneNode(true);
        copy.setAttribute('id', 'completeBoard');
        destination.parentNode.replaceChild(copy, destination);
        $('#completeBoard').show();
        document.getElementById('gameboard').remove();
    }

    if(exptPart == "practice"){
        document.getElementById('practice').style.display = 'none';
        //outline of learner board?
    }

    turn = 0;
    guessedSpaces = [];
    eliminatedByTurn = [];
    create_table(rows, cols, 'gameboard', 'trialDiv');
    document.getElementById('trial').style.display = 'block';
    document.getElementById('next').disabled=true;
    if(exptPart != "practice"){
        document.getElementById('trialTxt').innerHTML = 'Trial ' + (trialNumber+1);
    }
    document.getElementById('feedbackTurn').innerHTML = 'Cells Eliminated by Turn:<br><br>';
    document.getElementById('feedback').innerHTML = "<br>Spaces Open: <p2 id='spacesOpen'></p2><br>Spaces Eliminated: <p2 id='spacesElim'></p2><br><br>"
    document.getElementById('spacesOpen').innerHTML = learnOrigSpaces.length;
    document.getElementById('spacesElim').innerHTML = 0;
    document.getElementById('gameboard').setAttribute('onclick','');
    document.getElementById('trialInstruct').innerHTML = 'Use "z" to switch between choices of what spaces to eliminate.<br>Use the return key or click anywhere on the board to submit your choice.'

    teachAvailable = teachOrigSpaces.slice(0);
    learnAvailable = learnOrigSpaces.slice(0); //clones array of learner's spaces
    guessAvailable = learnOrigSpaces.slice(0); //available guesses also clone of learner's space
    numRemaining = learnAvailable.length;

    battleship = sample(learnAvailable); //set Battleship
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

    if(numCellsPainted < learnOrigSpaces.length){
        document.getElementById('next').disabled = true;
    }
    document.getElementById('next').setAttribute('onclick','trialFeedback();');
    document.getElementById('trialInstruct').innerHTML = 'Use your mouse to paint the spaces that you think the learner can see.<br><br>';
    document.getElementById('feedback').innerHTML = "<br>Spaces Painted: <p2 id='spacesPainted'></p2> / " + learnOrigSpaces.length + "<br><br><br>";
    document.getElementById('spacesPainted').innerHTML = numCellsPainted;
}

function trialFeedback(){
    cellsCorr = 0;
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

    if(exptPart == 'practice'){
        document.getElementById('next').setAttribute('onclick','practiceDone();');
        
    } else{
        document.getElementById('next').setAttribute('onclick','trialDone();');
    }

    document.getElementById('spacesCorr').innerHTML = cellsCorr;
    document.getElementById('trialInstruct').innerHTML = '<br><br><br>';
}

function trialDone(){
    document.getElementById('trial').style.display = 'none';

    // record what the subject said
    trialData.push({
        exptPart: exptPart,
        role: role,
        trialNumber: trialNumber,
        totalTurns: turn,
        numTeachSpaces: rows*cols,
        teachOrigSpaces: teachOrigSpaces,
        numLearnSpaces: rows*cols/2,
        learnOrigSpaces: learnOrigSpaces,
        bullseyeLocation: battleship,
        eliminatedByTurn: eliminatedByTurn,
        guessedSpaces: guessedSpaces, //spaces guessed by teacher about learner's hypothesis space
        cellsCorrect: cellsCorr,
        cellsPainted: cellsPainted});
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

        // these lines write to server
        console.log(trialData);
        data = {client: client, trials: trialData};
        writeServer(data);
        document.getElementById('trial').style.display = 'none';
        document.getElementById('completed').style.display = 'block';
    }
    else {
        document.getElementById('next').setAttribute('onclick','trialPaint();');
        trialStart();
    }
}

function guess(index){
    if(index == (battleship.r * cols + battleship.c)){
        $('#arrow_'+index).remove();
        $('#practiceLearnCell_'+index).prepend('<img src="img/targetHit.png"/>');
        guessCheck = true;
    }
    $('#practiceLearnCell_'+index).css('opacity','1');
    $('#practiceLearnCell_'+index).off('mouseenter');
    $('#practiceLearnCell_'+index).off('mouseleave');
    guessedSpaces.push(index);
    $(".practiceLearnCell").css("pointer-events", "none");
    practiceGuess = true;
}

function teacherHint(){
    var elimSpaces = [];
    var halfSpaces = teachTurn(teachAvailable,battleship);
    var move = sample(halfSpaces); //replace for passive learner expt

    for(var r=move.lowerR; r<=move.higherR; r++){
        for(var c=move.lowerC; c<=move.higherC; c++){
            for(var l=0; l<learnAvailable.length; l++){
                if(learnAvailable[l].r==r && learnAvailable[l].c==c){
                    index = r * cols + c;
                    if(guessedSpaces.indexOf(index) == -1){
                        $('#arrow_'+index).remove();
                    }
                    $('#practiceLearnCell_'+index).css('opacity','1');
                    $('#practiceLearnCell_'+index).off('mouseenter');
                    $('#practiceLearnCell_'+index).off('mouseleave');
                }
            }

            $('#practiceLearnCell_' + (r*cols+c)).css('box-shadow','inset 0 0 0 1000px rgba('+turnColors[turn].r+','+turnColors[turn].g+','+turnColors[turn].b+',.5)');
            elimSpaces.push({r,c});
        }
    }

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
    eliminatedByTurn.push(elimSpaces);
}

function practiceLearner(){
    document.getElementById('practice').style.display = 'block';
    document.getElementById('nextPractice').disabled = true;
    teachAvailable = teachOrigSpaces.slice(0);
    learnAvailable = learnOrigSpaces.slice(0); 
    battleship = sample(learnOrigSpaces);
    create_table(rows, cols, 'practiceLearn', 'trialDiv_learner');
    $('.practiceLearnCell').css({'background-color':'gray'});
    for(var i=0; i<learnOrigSpaces.length; i++){
        ind = learnOrigSpaces[i].r * cols + learnOrigSpaces[i].c;
        $('#practiceLearnCell_'+ind).css({'background-color':'white', 'opacity':'0'});
        $('#practiceLearnCell_'+ind).attr('onclick','guess('+ind+')');
        $('#practiceLearnCell_'+ind).prepend('<img id="arrow_' + ind + '" src="img/arrow.png"/>');
        $('#practiceLearnCell_'+ind).on({'mouseenter': function(){
            $(this).css('opacity','0.5');
        }, 'mouseleave': function(){
            $(this).css('opacity','0');
        }});
    }

    $(".practiceLearnCell").css("pointer-events", "none");
    var practiceTurns = setInterval(function(){
        if(guessCheck){
            clearInterval(practiceTurns);
            $(".practiceLearnCell").css("pointer-events", "none");
            document.getElementById('nextPractice').disabled = false;
        }
        if(practiceGuess && !guessCheck){
            teacherHint();
            $(".practiceLearnCell").css("pointer-events", "auto");
            turn++;
            practiceGuess = false;
        }
    }, 1000)
}

function practiceDone(){
    // record what the subject said
    trialData.push({
        exptPart: exptPart,
        role: role,
        trialNumber: trialNumber,
        totalTurns: turn,
        numTeachSpaces: rows*cols,
        teachOrigSpaces: teachOrigSpaces,
        numLearnSpaces: rows*cols/2,
        learnOrigSpaces: learnOrigSpaces,
        bullseyeLocation: battleship,
        eliminatedByTurn: eliminatedByTurn,
        guessedSpaces: guessedSpaces, //spaces guessed by teacher about learner's hypothesis space
        cellsCorrect: cellsCorr, //0 in the learner role
        cellsPainted: cellsPainted}); //should be empty in learner role

    if(role == 'learner'){
        role = 'teacher';
        $('#practiceRole').html(role);
        document.getElementById('practice').style.display = 'none';
        document.getElementById('practiceInstruct').style.display = 'block';
    } else{
        document.getElementById('trial').style.display = 'none';
        document.getElementById('postpractice').style.display = 'block';
    }
}

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

function sample(availSpaces){
    return(availSpaces[Math.floor(Math.random() * availSpaces.length)]);
}

function create_table(rows, cols, tabID, divID) { //rows * cols = number of exemplars
  var table = "<table id='"+tabID+"'>";
  for(var i=0; i <rows; i++) {
    table += "<tr>";
    for(var j=0; j<cols; j++) {
        var ind = i * cols + j;
        table += "<td class='cell " + tabID + "Cell' id='"+tabID+"Cell_" + ind + "'> </td>";
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



