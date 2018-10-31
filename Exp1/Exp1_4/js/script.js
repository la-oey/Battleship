var exptPart = "practice";
var role = 'learner';
var trialNumber = 0;
var practiceTrialNumber = 0;
var trialData = [];
var Trial = 8; //switch to 8
var PracticeTrial = 3;
var rows = 4; 
var cols = 4;
var penalty = 3; // x * penalty second delay for turns & cells painted incorrectly
var teachOrigSpaces = [];
var learnOrigSpaces = [];
var teachAvailable = [];
var learnAvailable = [];
var guessAvailable = [];
var spacesOpenAtTurnStart = [];
var halfSpacesByTurn = [];
var halfSpacesNumElimByTurn = [];
var eliminatedChoice = [];
var guessedSpaces = []; //array of guessed spaces indices
var numElimRounds = [];
var numRemaining = 0;
var battleship = null;
var turnColors = [{color:'red', r:'255', g:'0', b:'0'},
                  {color:'orange', r:'255', g:'128', b:'0'},
                  {color:'yellow', r:'255', g:'255', b:'0'},
                  {color:'green', r:'0', g:'255', b:'0'},
                  {color:'blue', r:'0', g:'0', b:'255'},
                  {color:'purple', r:'255', g:'0', b:'255'}]
var hintHtmlArr = [];
var turn = 0;
var maxpoints = rows + 1; //technically max points + 1
var plaPoints = 0;
var oppPoints = 0;
var plaTotalPoints = 0;
var oppTotalPoints = 0;
var highlighted = 0;
var guessedInd = 0;
var inited = false;
var isPaused = true;
var tutorialPause0 = true;
var tutorialPause1 = true;
var numCellsPainted = 0;
var cellsCorr = 0;
var cellsPainted = [];
var uncertain = []; //painted but w/ ?
var practiceGuess = true;
var guessCheck = false;
var startTime = null;
var teachRT = null;
var paintRT = null;
var expt = {
    saveURL: 'submit.simple.php',
    sona: {
        experiment_id: 1467,
        credit_token: '0263273563ac435aaea995b95b9b8169'
    }
};
var client = parseClient();


function pageLoad(){
    document.getElementById('consent').style.display = 'block';
}

function clickConsent(){
    document.getElementById('consent').style.display = 'none';
    document.getElementById('instructions').style.display = 'block';
}

// Instructions

function clickInstructions(){
    document.getElementById('instructions').style.display = 'none';
    teachOrigSpaces = buildTeacherTable(rows, cols);
    learnOrigSpaces = buildLearnerTable(teachOrigSpaces);
    document.getElementById('practiceRoleInstruct').style.display = 'block';
}

function clickPracticeRole(){
    document.getElementById('practiceRoleInstruct').style.display = 'none';
    if(role == "learner"){
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
    document.getElementById('scoreboard').style.display = 'block';
    document.getElementById('next').setAttribute('onclick','trialPaint();');
    exptPart = "experiment";
    plaTotalPoints = 0;
    $('#playerScore').html(plaTotalPoints);
    oppTotalPoints = 0;
    $('#opponentScore').html(oppTotalPoints);
    $('#leader').html("The Match Begins!")
    $('#waitScoreboardTxt').hide();

    //assign learner table for learning trials
    teachOrigSpaces = buildTeacherTable(rows, cols);
    learnOrigSpaces = buildLearnerTable(teachOrigSpaces);
    cellsPainted = [];
    uncertain = [];
    numCellsPainted = 0;
    $('#gameboard').remove();
    document.getElementById('nextScoreboard').setAttribute('onclick','trialStart();');
}

// Experiment

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
    //document.getElementById('gameboard').setAttribute('onclick','clickBoard('+check+');');
}

function clickBoard(selected){
    var elimSpaces = [];
    var halfSpaces = teachTurn(teachAvailable,battleship);
    spacesOpenAtTurnStart.push(toByte(arrayToIndices(teachAvailable.slice(0))));

    var halfSpacesAsByte = [];
    var halfSpacesNumElim = [];
    for(var i=0; i<halfSpaces.length; i++){
        halfSpacesAsByte.push(toByte(halfSpaces[i], true, false));
        var singHalfSpacesNumElim = 0;
        for(var j=0; j<learnAvailable.length; j++){
            if(learnAvailable[j].r >= halfSpaces[i].lowerR && learnAvailable[j].r <= halfSpaces[i].higherR &&
               learnAvailable[j].c >= halfSpaces[i].lowerC && learnAvailable[j].c <= halfSpaces[i].higherC){
                singHalfSpacesNumElim += 1;
            }
        }
        halfSpacesNumElim.push(singHalfSpacesNumElim);
    }
    halfSpacesByTurn.push(halfSpacesAsByte);
    halfSpacesNumElimByTurn.push(halfSpacesNumElim);
    //var move = sample(halfSpaces); //replace for passive learner expt
    
    if(halfSpaces.length==1){ //checks if there is only one potential byte to eliminate
        selected=0;
    } 
    for(var r=halfSpaces[selected].lowerR; r<=halfSpaces[selected].higherR; r++){
        for(var c=halfSpaces[selected].lowerC; c<=halfSpaces[selected].higherC; c++){
            $('#gameboardCell_' + (r*cols+c)).css({'background-color':turnColors[turn].color,
                                        'opacity':'1'});
            elimSpaces.push(r*cols+c);
        }
    }
    //check for matches between values eliminated and values in the learner's & teacher's open hypothesis space
    for(var e=0; e<elimSpaces.length; e++){
        for(var l=0; l<learnAvailable.length; l++){
            if(elimSpaces[e]==toIndex(learnAvailable[l])){
                learnAvailable.splice(l,1);
            }
        }
        for(var g=0; g<guessAvailable.length; g++){
            if(elimSpaces[e]==toIndex(guessAvailable[g])){
                guessAvailable.splice(g,1);
            }
        }
        for(var t=0; t<teachAvailable.length; t++){
            if(elimSpaces[e]==toIndex(teachAvailable[t])){
                teachAvailable.splice(t,1);
            }
        }
    }
    eliminatedChoice.push(selected)

    //Computer's Guess
    //samples uniformly from set of hypothesis spaces not yet eliminated and not yet guessed
    var learnerGuess = sample(guessAvailable);

    //prevents computer from winning on first turn of tutorial unless there's only one available space to guess
    if(practiceTrialNumber == 0 && guessAvailable.length > 1){
        while(toIndex(learnerGuess) == toIndex(battleship)){
            learnerGuess = sample(guessAvailable);
        }
    }
    
    guessedInd = toIndex(learnerGuess);
    if(guessedInd == toIndex(battleship)){
        $('#target').remove();
        $('#gameboardCell_'+guessedInd).prepend('<img id="targetHit" src="img/targetHit.png" />');
    } else{
        $('#gameboardCell_'+guessedInd).prepend('<img id="arrow" src="img/arrow.png" />');
    }
    //in tutorial, pauses first computer's guess from being seen
    if(practiceTrialNumber == 0 && turn==0){
        $('#instruct2txt').html("You submitted your hint. Before you see what your partner guessed in response, you should notice...");
        $('#clickInstruct2').show()
        $('#gameboardCell_'+guessedInd).css('opacity','0');
        document.onkeydown = null;
    }
    guessedSpaces.push(guessedInd);
    guessAvailable.splice(guessAvailable.indexOf(learnerGuess),1);

    //Explicit Feedback
    document.getElementById('spacesOpen').innerHTML = learnAvailable.length;
    document.getElementById('spacesElim').innerHTML = learnOrigSpaces.length - learnAvailable.length;
    var numElimRound = numRemaining - learnAvailable.length;
    numElimRounds.push(numElimRound);
    numRemaining = learnAvailable.length;
    var hintHtml = "";
    hintHtmlArr.push("<font color='" + turnColors[turn].color + "'>Hint " + (turn+1) + ": " + numElimRound + "</font><br><br>");
    for(var i=0; i<5; i++){
        if(i < hintHtmlArr.length){
            hintHtml = hintHtml + hintHtmlArr[i];
        } else{
            hintHtml = hintHtml + "\n";
        }
    }
    //$('#feedbackTurn').append("<font color='" + turnColors[turn].color + "'>Hint " + (turn+1) + ": " + numElimRound + "</font><br><br>")
    $('#feedbackTurn').html(hintHtml);
    ++turn;

    if(learnAvailable.length==1 || guessedInd==toIndex(battleship)){
        document.onkeydown = null;
        document.getElementById('next').disabled = false;
    }
    inited = false;
}

function paint(index, marked){
    if(marked==0){ // -> marked==1
        $('#gameboardCell_'+index).css({'background-color':'white'});
        ++numCellsPainted;
        $('#gameboardCell_'+index).attr('cellSelected','true');
        $('#gameboardCell_'+index).attr('onclick','paint(' + index + ',1)');
        cellsPainted.push(teachOrigSpaces[index]);
        document.getElementById('spacesPainted').innerHTML = numCellsPainted;
    } else if(marked==1){ // -> marked==0.5
        $('#gameboardCell_'+index).html('?');
        $('#gameboardCell_'+index).css({'text-align':'center', 'font-size':'24px'});
        $('#gameboardCell_'+index).attr('onclick','paint(' + index + ',0.5)');
        uncertain.push(teachOrigSpaces[index]);
    } else{ //marked==0.5 -> marked=0
        $('#gameboardCell_'+index).css({'background-color':'gray'});
        $('#gameboardCell_'+index).html('');
        --numCellsPainted;
        $('#gameboardCell_'+index).attr('cellSelected','false');
        $('#gameboardCell_'+index).attr('onclick','paint(' + index + ',0)');
        uncertain.splice(uncertain.indexOf(teachOrigSpaces[index]),1);
        cellsPainted.splice(cellsPainted.indexOf(teachOrigSpaces[index]),1);
        document.getElementById('spacesPainted').innerHTML = numCellsPainted;
    }

    if(numCellsPainted == learnOrigSpaces.length){
        if(practiceTrialNumber == 0){
            $('#instruct3txt').html("Nice job! You painted exactly 8 spaces. When you want to submit, click Next to continue.");
        }
        document.getElementById('next').disabled=false;
    } else{
        if(practiceTrialNumber == 0){
            $('#instruct3txt').html("Paint exactly 8 spaces that you think your partner can see.");
        }
        document.getElementById('next').disabled=true;
    }

    if(practiceTrialNumber == 0 && isPaused){
        if(marked == 0){
            $('#instruct3txt').html('You painted a space! Notice how the number of spaces painted is now "1 / 8". Click the space again!');
            for(var i=0; i<rows*cols; i++){
                if(index != i){
                    document.getElementById('gameboardCell_'+i).style.pointerEvents = 'none';
                }
            }
        } else if(marked == 1){
            $('#instruct3txt').html('Clicking again paints the space with a question mark! This helps you to mark your uncertainty. Click the space again!');
        } else{
            $('#instruct3txt').html("Clicking one more time 'unpaints' the space! Paint the 8 spaces that you think your partner can see.");
            isPaused = false;
            for(var i=0; i<rows*cols; i++){
                document.getElementById('gameboardCell_'+i).style.pointerEvents = 'auto';
            }
        }
    }
}

function trialStart(){
    if(trialNumber == 0 && exptPart == "experiment"){
        document.getElementById('scoreboard').style.display = 'none';
        $('#waitScoreboardTxt').show();
    }
    else if(trialNumber > 0 || practiceTrialNumber > 0){
        var source = document.getElementById('gameboard');
        var destination = document.getElementById('completeBoard');
        var copy = source.cloneNode(true);
        copy.setAttribute('id', 'completeBoard');
        destination.parentNode.replaceChild(copy, destination);
        $('#completeBoard').show();
        document.getElementById('gameboard').remove();
    }

    //if(exptPart == "practice"){
        //outline of learner board?
    //}

    turn = 0;
    hintHtmlArr = ['Spaces Elim.:<br><br>'];
    $('#feedbackTurn').html(hintHtmlArr[0]);
    guessedSpaces = [];
    eliminatedChoice = [];
    numElimRounds = [];
    spacesOpenAtTurnStart = [];
    halfSpacesByTurn = [];
    halfSpacesNumElimByTurn = [];

    create_table(rows, cols, 'gameboard', 'trialDiv');
    document.getElementById('trial').style.display = 'block';
    document.getElementById('next').disabled=true;
    if(exptPart != "practice"){
        document.getElementById('trialTxt').innerHTML = 'Trial ' + (trialNumber+1);
    } else{
        document.getElementById('trialTxt').innerHTML = 'Practice: Teacher<br>Trial ' + (practiceTrialNumber+1);
    }
    document.getElementById('feedback').innerHTML = "<br>Spaces Open: <p2 id='spacesOpen'></p2><br>Spaces Eliminated: <p2 id='spacesElim'></p2><br><br>"
    document.getElementById('spacesOpen').innerHTML = learnOrigSpaces.length;
    document.getElementById('spacesElim').innerHTML = 0;
    document.getElementById('trialInstruct').innerHTML = "Use 'z' to switch between choices of what spaces to eliminate.<br>Use the 'return' key to submit your choice."
    $('#waitTrialTxt').hide();

    teachAvailable = teachOrigSpaces.slice(0);
    learnAvailable = learnOrigSpaces.slice(0); //clones array of learner's spaces
    guessAvailable = learnOrigSpaces.slice(0); //available guesses also clone of learner's space
    numRemaining = learnAvailable.length;

    battleship = sample(learnAvailable); //set Battleship
    $('#gameboardCell_' + teachAvailable.indexOf(battleship)).prepend('<img id="target" src="img/target.png" />');

    highlighted = 0;
    inited = false;

    var saved_keydown = function (e) {
        var keyCode = e.keyCode;
        if(keyCode==90){
            if(isPaused){
                if(tutorialPause0){
                    $('#instruct2txt').html("Press 'z' again."); 
                    tutorialPause0 = false;
                } else{
                    $('#instruct2txt').html("See how the shaded half changes. Now, press the 'return' key.");
                    isPaused = false;
                    inited = true;
                }
            } else{
                inited = true;
            }
            highlight(highlighted);
            if(highlighted==0){
                highlighted=1;
            } else{
                highlighted=0;
            }
        }

        if(keyCode==13 && inited && !isPaused){
            clickBoard(Math.abs(highlighted-1));
        }
    };

    if(practiceTrialNumber == 0 && turn == 0){
        document.onkeydown = null;
    } else{
        document.onkeydown = saved_keydown;
    }

    // Instructions for first time around
    if(practiceTrialNumber == 0){
        isPaused = true;
        $('.popup').show();
        var popup = document.getElementById("popupInstruct2");
        popup.classList.toggle("show");
        $('#trialInstruct').css('opacity','0');

        $('#clickInstruct2').on('click', function(){
            if($('#clickInstruct2').attr('data-timesClicked') == "0"){
                document.onkeydown = saved_keydown;
                $('#instruct2txt').html("Press the 'z' key.");
                $('#clickInstruct2').attr('data-timesClicked', "1");
                $('#clickInstruct2').hide();
                tutorialPause0 = true;
            }
            else if($('#clickInstruct2').attr('data-timesClicked') == "1"){
                $('#instruct2txt').html('This column indicates the number of spaces you eliminated with your hint!');
                var pointer = document.getElementById("downPointElim");
                pointer.classList.toggle("show");

                var animate = setInterval(bouncingArrow, 5);
                var pos = 110;
                var dir = "down";
                function bouncingArrow(){
                    if($('#clickInstruct2').attr('data-timesClicked') == "3"){
                        pointer.classList.toggle("hide");
                        clearInterval(animate);
                    } else{
                        if(pos >= 150 && dir=="down"){
                            dir = "up";
                        } else if(pos <= 110 && dir=="up"){
                            dir = "down";
                        } else{
                            if(dir=="down"){
                                pos = pos+.5;
                                pointer.style.bottom = pos + 'px';
                            } else{
                                pos = pos-.5;
                                pointer.style.bottom = pos + 'px';
                            }
                        }
                    }
                }
                $('#clickInstruct2').attr('data-timesClicked', "2");
                $('#clickInstruct2').show();
            }
            else if($('#clickInstruct2').attr('data-timesClicked') == "2"){
                //isPaused = false;
                $('#instruct2txt').html("This indicates the number of spaces that are still open to be guessed and the number of spaces still open.");
                
                var pointer = document.getElementById("rightPointSpaces");
                pointer.classList.toggle("show");

                var animate = setInterval(bouncingArrow, 5);
                var pos = -700;
                var dir = "right";
                function bouncingArrow(){
                    if($('#clickInstruct2').attr('data-timesClicked') == "4"){
                        pointer.classList.toggle("hide");
                        clearInterval(animate);
                    } else{
                        if(pos >= -650 && dir=="right"){
                            dir = "left";
                        } else if(pos <= -700 && dir=="left"){
                            dir = "right";
                        } else{
                            if(dir=="right"){
                                pos = pos+.5;
                                pointer.style.left = pos + 'px';
                            } else{
                                pos = pos-.5;
                                pointer.style.left = pos + 'px';
                            }
                        }
                    }
                }
                $('#clickInstruct2').attr('data-timesClicked', "3");
            }
            else if($('#clickInstruct2').attr('data-timesClicked') == "3"){
                $('#instruct2txt').html("Now let's show where your partner guessed.");
                $('#clickInstruct2').attr('data-timesClicked', "4");
            }
            else if($('#clickInstruct2').attr('data-timesClicked') == "4"){
                if(guessedInd == toIndex(battleship)){
                    $('#instruct2txt').html("Your partner hit the bullseye! Click Next to continue.");
                } else{
                    $('#instruct2txt').html("Your partner didn't hit the bullseye. Try again until your partner hits the bullseye.");
                }
                $('#gameboardCell_'+guessedInd).css('opacity','1');
                $('#clickInstruct2').attr('data-timesClicked', "5");
            }
            else{
                var popup = document.getElementById("popupInstruct2");
                isPaused = false;
                $('#trialInstruct').css('opacity','1');
                document.onkeydown = saved_keydown;
                popup.classList.toggle("hide");
            }
        })
    }
    else{
        $('#trialInstruct').css('opacity','1');
    }
 
    startTime = Date.now();
}

function trialPaint(){
    teachRT = Date.now() - startTime; //records time to complete "teaching" stage

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
        $('#gameboardCell_'+i).attr('onclick','paint('+i+',0);');
        $('#gameboardCell_'+i).attr('cellSelected','false');
        $('#gameboardCell_'+i).css({'background-color':'gray'})
    }

    for(var j=0; j<cellsPainted.length; j++){
        index = toIndex(cellsPainted[j]);
        $('#gameboardCell_'+index).attr('onclick','paint('+index+',1);');
        $('#gameboardCell_'+index).attr('cellSelected','true');
        $('#gameboardCell_'+index).css({'background-color':'white'});
    }

    for(var k=0; k<uncertain.length; k++){
        index = toIndex(uncertain[k]);
        $('#gameboardCell_'+index).attr('onclick','paint('+index+',0.5);');
        $('#gameboardCell_'+index).html('?');
        $('#gameboardCell_'+index).css({'text-align':'center', 'font-size':'24px'});

    }

    document.getElementById('next').setAttribute('onclick','trialFeedback();');
    if(numCellsPainted < learnOrigSpaces.length){
        document.getElementById('next').disabled = true;
    }
    document.getElementById('trialInstruct').innerHTML = 'Use your mouse to paint the spaces that you think the learner can see.<br><br>';
    document.getElementById('feedback').innerHTML = "<br>Spaces Painted: <p2 id='spacesPainted'></p2> / " + learnOrigSpaces.length + "<br><br><br>";
    document.getElementById('spacesPainted').innerHTML = numCellsPainted;

    if(practiceTrialNumber == 0){
        for(var i=0; i<rows*cols; i++){
            document.getElementById('gameboardCell_'+i).style.pointerEvents = 'none';
        }
        $('#instruct2txt').html("Nice job hitting the bullseye! Now you have time to jot notes here about which spaces you think your partner can see.");
        var popup = document.getElementById("popupInstruct3");
        popup.classList.toggle("show");
        $('#trialInstruct').css('opacity','0');

        $('#clickInstruct3').on('click', function(){
            if($('#clickInstruct3').attr('data-timesClicked') == "0"){
                $('#instruct3txt').html('Notice that the large grid is now gray and a smaller grid has appeared in the lower right showing the hints and guesses from before.');
                $('#clickInstruct3').attr('data-timesClicked', "1");
            }
            else if($('#clickInstruct3').attr('data-timesClicked') == "1"){
                $('#instruct3txt').html('Your job is to paint the grid white where you think your partner can see.');
                $('#clickInstruct3').attr('data-timesClicked', "2");
            }
            else if($('#clickInstruct3').attr('data-timesClicked') == "2"){
                $('#instruct3txt').html('Remember when you were the learner and you could only click on half the spaces? Right! Your job is to paint those in now.');
                $('#clickInstruct3').attr('data-timesClicked', "3");
            }
            else if($('#clickInstruct3').attr('data-timesClicked') == "3"){
                $('#instruct3txt').html('For future trials, keep in mind that the location of the open spaces stays consistent across trials.');
                $('#clickInstruct3').attr('data-timesClicked', "4");
            }
            else if($('#clickInstruct3').attr('data-timesClicked') == "4"){
                $('#instruct3txt').html('You can use the smaller grid to help you remember what hints you just gave and where your partner guessed.');
                $('#clickInstruct3').attr('data-timesClicked', "5");
            }
            else if($('#clickInstruct3').attr('data-timesClicked') == "5"){
                $('#instruct3txt').html('To paint a space white, simply click on the space.');
                $('#clickInstruct3').attr('data-timesClicked', "6");
            }
            else{
                for(var i=0; i<rows*cols; i++){
                    document.getElementById('gameboardCell_'+i).style.pointerEvents = 'auto';
                }
                $('#instruct3txt').html('Click on one of the gray spaces!');
                $('#clickInstruct3').attr('data-timesClicked', "7");
                $('#clickInstruct3').hide();
                isPaused = true;
            }
        })
    }

    startTime = Date.now();
}

function trialFeedback(){
    paintRT = Date.now() - startTime; //records time to complete "painting" stage

    if(practiceTrialNumber == 0){
        var popup = document.getElementById("popupInstruct3");
        popup.classList.toggle("hide");
        $('.popupTeacher3').css('display','');
        popup = document.getElementById("popupInstruct4");
        popup.classList.toggle("show");
    }

    cellsCorr = 0;
    document.getElementById('feedbackTurn').innerHTML = '';
    document.getElementById('next').disabled = true;
    $('#completeBoard').hide();
    $('#gameboard').hide();
    $('#waitTrialTxt').show();
    
    for(var a=0; a<learnOrigSpaces.length; a++){
        index = toIndex(learnOrigSpaces[a]);
        if($('#gameboardCell_'+index).attr('cellSelected')=='true'){
            ++cellsCorr;
        }
    }

    $('#feedback').html("<div id='paintFeedback'>Feedback: <p2 id='spacesCorr'>" + cellsCorr + " / " + learnOrigSpaces.length + "</p2> Spaces Correct</div><br><br><br>");
    $('#paintFeedback').css({'font-size':'30px'});
    $('#spacesCorr').css({'padding-left':'20px', 'padding-right':'10px'});

    document.getElementById('next').setAttribute('onclick','tallyScore();');

    var count = (learnOrigSpaces.length - cellsCorr) * penalty;
    $('#waitCells').html(learnOrigSpaces.length - cellsCorr);
    $('#waitTrial').html(count);
    if(count !== 0){
        count--;
    }

    var countdown = setInterval(function(){
        if(count == 0){
            clearInterval(countdown);
            document.getElementById('next').disabled = false;
            count = 0;
        }
        $('#waitTrial').html(count);
        count--;
    }, 1000)

    document.getElementById('trialInstruct').innerHTML = '<br><br><br>';

    
}

function tallyScore(){
    plaPoints = maxpoints - turn;
    plaTotalPoints = plaTotalPoints + plaPoints;
    oppPoints = maxpoints - randGeom(1/3); //generates opponent's points won per trial
    oppTotalPoints = oppTotalPoints + oppPoints;

    //update scoreboard
    $('#playerScore').html(plaTotalPoints);
    $('#opponentScore').html(oppTotalPoints);
    

    if(trialNumber == Trial - 1){
        if(plaTotalPoints == oppTotalPoints){
            $('#leader').html("Tie!");
        } else if(plaTotalPoints > oppTotalPoints){
            $('#leader').html("Your Team Won!")
        } else{
            $('#leader').html("The Other Team Won!")
        }
    } else{
        if(plaTotalPoints == oppTotalPoints){
            $('#leader').html("The Score Is Tied!");
        } else if(plaTotalPoints > oppTotalPoints){
            $('#leader').html("Your Team Has The Lead!")
        } else{
            $('#leader').html("The Other Team Has The Lead!")
        }
    }

    if(role=="learner"){
        document.getElementById('practice').style.display = 'none';
        teachRT = Date.now() - startTime;
    } else{
        document.getElementById('trial').style.display = 'none';
    }

    if(exptPart=="practice"){
        if(practiceTrialNumber == 0){
            if(role == "teacher"){
                $('#instruct1txt').html("As in before, the <b>fewer turns</b> it takes your partner to hit the bullseye, the <b>less time</b> you'll have to wait. You'll practice being the teacher 2 more times.")
            } else{
                var popup2 = document.getElementById("popupInstruct4");
                popup2.classList.toggle("hide");
            }
            var popup = document.getElementById("popupInstruct1");
            popup.classList.toggle("show");
        }
        document.getElementById('nextScoreboard').setAttribute('onclick','practiceDone();');
    } else{
        document.getElementById('nextScoreboard').setAttribute('onclick','trialDone();');
    }

    var count = turn * penalty;
    document.getElementById('nextScoreboard').disabled = true;
    $('#waitTurns').html(turn);
    $('#waitScoreboard').html(count);
    if(count !== 0){
        count--;
    }

    var countdown = setInterval(function(){
        if(count == 0){
            clearInterval(countdown);
            document.getElementById('nextScoreboard').disabled = false;
        }
        $('#waitScoreboard').html(count);
        count--;
    }, 1000)

    document.getElementById('scoreboard').style.display = 'block';
    
}

function trialDone(){
    document.getElementById('scoreboard').style.display = 'none';

    // record what the subject did
    recordData();
    console.log(trialData);
    // increment the trialNumber
    ++trialNumber;
    // if we are done with all trials, then go to completed page
    if(trialNumber == Trial){
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
            ind = toIndex(learnOrigSpaces[j]);
            $('#keyCell_'+ind).css({'background-color':'white'});
        }

        document.getElementById('trial').style.display = 'none';
        document.getElementById('finalscore').style.display = 'block';
    }
    else {
        document.getElementById('next').setAttribute('onclick','trialPaint();');
        trialStart();
    }
}

function guess(index){
    if(index == toIndex(battleship)){
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
    if(tutorialPause1){
        if(guessCheck){
            $('#instruct0txt').html("Nice! You hit the bullseye. Click Next to continue to the scoreboard.");
        }
        else if($('#clickInstruct0').attr('data-timesClicked') == "4"){
            $('#instruct0txt').html("Oops, you missed the bullseye. Your partner will give you another hint and keep trying again until you hit the bullseye.");
            $('#clickInstruct0').attr('data-timesClicked', "5");
        }
    }
}

function teacherHint(){
    var elimSpaces = [];
    var halfSpaces = teachTurn(teachAvailable,battleship);
    spacesOpenAtTurnStart.push(toByte(arrayToIndices(teachAvailable.slice(0))));
    var halfSpacesAsByte = [];
    var halfSpacesNumElim = [];
    for(var i=0; i<halfSpaces.length; i++){
        halfSpacesAsByte.push(toByte(halfSpaces[i], true, false));
        var singHalfSpacesNumElim = 0;
        for(var j=0; j<learnAvailable.length; j++){
            if(learnAvailable[j].r >= halfSpaces[i].lowerR && learnAvailable[j].r <= halfSpaces[i].higherR &&
               learnAvailable[j].c >= halfSpaces[i].lowerC && learnAvailable[j].c <= halfSpaces[i].higherC){
                singHalfSpacesNumElim += 1;
            }
        }
        halfSpacesNumElim.push(singHalfSpacesNumElim);
    }
    halfSpacesByTurn.push(halfSpacesAsByte);
    halfSpacesNumElimByTurn.push(halfSpacesNumElim);
    var selected = sampleInt(0,2);
    eliminatedChoice.push(selected);
    var move = halfSpaces[selected];

    for(var r=move.lowerR; r<=move.higherR; r++){
        for(var c=move.lowerC; c<=move.higherC; c++){
            for(var l=0; l<learnAvailable.length; l++){
                if(learnAvailable[l].r==r && learnAvailable[l].c==c){
                    index = toIndex(learnAvailable[l]);
                    if(guessedSpaces.indexOf(index) == -1){
                        $('#arrow_'+index).remove();
                    }
                    $('#practiceLearnCell_'+index).css('opacity','1');
                    $('#practiceLearnCell_'+index).off('mouseenter');
                    $('#practiceLearnCell_'+index).off('mouseleave');
                    $('#practiceLearnCell_'+index).prop("onclick", null).off("click");
                }
            }

            $('#practiceLearnCell_' + (r*cols+c)).css('box-shadow','inset 0 0 0 1000px rgba('+turnColors[turn].r+','+turnColors[turn].g+','+turnColors[turn].b+',.5)');
            elimSpaces.push(r*cols+c);
        }
    }

    var numElimRound = 0;
    for(var e=0; e<elimSpaces.length; e++){
        for(var l=0; l<learnAvailable.length; l++){
            if(elimSpaces[e]==toIndex(learnAvailable[l])){
                learnAvailable.splice(l,1);
                numElimRound++;
            }
        }
        for(var t=0; t<teachAvailable.length; t++){
            if(elimSpaces[e]==toIndex(teachAvailable[t])){
                teachAvailable.splice(t,1);
            }
        }
    }

    numElimRounds.push(numElimRound)
}

function practiceLearner(){
    document.getElementById('practice').style.display = 'block';
    document.getElementById('nextPractice').disabled = true;
    document.getElementById('practiceTrialTxt').innerHTML = 'Practice: Learner<br>Trial ' + (practiceTrialNumber+1);
    teachAvailable = teachOrigSpaces.slice(0);
    learnAvailable = learnOrigSpaces.slice(0); 
    guessAvailable = learnOrigSpaces.slice(0);
    battleship = sample(learnOrigSpaces);
    if(practiceTrialNumber > 0){
        document.getElementById('practiceLearn').remove();
        $('.popup').hide();
    }
    guessCheck = false;
    turn = 0;
    guessedSpaces = [];
    eliminatedChoice = [];
    numElimRounds = [];
    spacesOpenAtTurnStart = [];
    halfSpacesByTurn = [];
    halfSpacesNumElimByTurn = [];

    create_table(rows, cols, 'practiceLearn', 'trialDiv_learner');
    $('.practiceLearnCell').css({'background-color':'gray'});

    for(var i=0; i<learnOrigSpaces.length; i++){
        ind = toIndex(learnOrigSpaces[i]);
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

    // Instructions for first time around
    if(practiceTrialNumber == 0){
        var popup = document.getElementById("popupInstruct0");
        popup.classList.toggle("show");
        $('#practiceInstruct').css('opacity','0');

        $('#clickInstruct0').on('click', function(){
            if($('#clickInstruct0').attr('data-timesClicked') == "0"){
                $('#instruct0txt').html('This is what the field looks like.');
                var pointer = document.getElementById("leftPointBoard");
                pointer.classList.toggle("show");
                var animate = setInterval(bouncingArrow, 5);
                var pos = 1100;
                var dir = "left";
                function bouncingArrow(){
                    if($('#clickInstruct0').attr('data-timesClicked') == "2"){
                        clearInterval(animate);
                    } else{
                        if(pos <= 1000 && dir=="left"){
                            dir = "right";
                        } else if(pos >= 1100 && dir=="right"){
                            dir = "left";
                        } else{
                            if(dir=="left"){
                                pos = pos-.75;
                                pointer.style.left = pos + 'px';
                            } else{
                                pos = pos+.75;
                                pointer.style.left = pos + 'px';
                            }
                        }
                    }
                }
                $('#clickInstruct0').attr('data-timesClicked', "1");
            }
            else if($('#clickInstruct0').attr('data-timesClicked') == "1"){
                $('#instruct0txt').html('Your partner will give you a hint about where <strong>NOT</strong> to shoot.');
                var pointer = document.getElementById("leftPointBoard");
                pointer.classList.toggle("hide");
                $('#clickInstruct0').attr('data-timesClicked', "2");
            }
            else if($('#clickInstruct0').attr('data-timesClicked') == "2"){
                isPaused = false;
                $('#instruct0txt').html("The bullseye must be in one of the remaining non-shaded spaces.");
                $('#clickInstruct0').attr('data-timesClicked', "3");
            }
            else if($('#clickInstruct0').attr('data-timesClicked') == "3"){
                $('#instruct0txt').html("<b>Now you can prepare to guess the location of the bullseye.</b> Scroll over to see what's available, and click the space to shoot the arrow at that location.");
                $(".practiceLearnCell").css("pointer-events", "auto");
                tutorialPause0 = false;
                $('#clickInstruct0').attr('data-timesClicked', "4");
                $('#clickInstruct0').hide();
            }
            else{
                var popup = document.getElementById("popupInstruct0");
                popup.classList.toggle("hide");
                
            }
        })
    }
    else{
        $('#practiceInstruct').css('opacity','1');
    }

    var practiceTurns = setInterval(function(){
        if(guessCheck){
            clearInterval(practiceTurns);
            $(".practiceLearnCell").css("pointer-events", "none");
            document.getElementById('nextPractice').disabled = false;
        }
        if(!isPaused && practiceGuess && !guessCheck){
            teacherHint();
            turn++;
            practiceGuess = false;
            if(!tutorialPause0){
                $(".practiceLearnCell").css("pointer-events", "auto");
            }
        }
    }, 1000)

    startTime = Date.now();
}

function practiceDone(){
    // record what the subject said
    document.getElementById('scoreboard').style.display = 'none';

    recordData();

    ++practiceTrialNumber;

    if(role == 'learner'){
        if(practiceTrialNumber == PracticeTrial){
            document.getElementById('next').setAttribute('onclick','trialPaint();');
            practiceTrialNumber = 0;
            role = 'teacher';
            $('#practiceRole').html(role);
            document.getElementById('practiceRoleInstruct').style.display = 'block';
        } else{
            practiceLearner();
        }
    } else{
        if(practiceTrialNumber == PracticeTrial){
            document.getElementById('postpractice').style.display = 'block';
        } else{
            document.getElementById('next').setAttribute('onclick','trialPaint();');
            trialStart();
        }
    }
}

function clickFinalScore(){
    document.getElementById('finalscore').style.display = 'none';
    document.getElementById('participantFeedback').style.display = 'block';
}

function clickFeedback(){
    document.getElementById('participantFeedback').style.display = 'none';
    document.getElementById('completed').style.display = 'block';

    recordData(true);

    // these lines write to server
    //console.log(trialData);
    data = {client: client, trials: trialData};
    writeServer(data);
}

function experimentDone(){
    submitExternal(client);
}


//Miscellaneous Functions
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

function sampleInt(min,max) {
  return(Math.floor(Math.random() * (max-min)) + min);
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

function toIndex(cell){
    return(cell.r * cols + cell.c);
}

//create array of 0s and 1s of the board length
// learner/teacher/painted board
//      0 = cells closed
//      1 = cells open/painted, e.g. teacher board = 11111111
// eliminated by turn
//      0 = cells removed in a turn
//      1 = cells not removed in a turn
// uncertain
//      0 = not marked as being uncertain
//      1 = marked as being uncertain
function toByte(array, halfSpace=false, inverse=true){ //inverse applied for eliminated by turn
    var byte = "";
    var yes = "1"
    var no = "0"
    if(!inverse){
        yes = "0"
        no = "1"
    }
    if(!halfSpace){ //coverts standard arrays (array of true cells) to byte
        for(var i=0; i<rows*cols; i++){
            if(array.indexOf(i) !== -1){
                byte = byte + yes;
            } else{
                byte = byte + no;
            }
        }
    } else{ //converts halfSpace array (array of lower & upper row & column) to byte
        for(var i=0; i<rows*cols; i++){
            if(Math.floor(i / rows) >= array.lowerR && Math.floor(i / rows) <= array.higherR &&
                i % rows >= array.lowerC && i % rows <= array.higherC){
                byte = byte + yes;
            } else{
                byte = byte + no;
            }
        }
    }

    return(byte);
}

function arrayToIndices(array){
    newArray = [];
    for(var i=0; i<array.length; i++){
        newArray.push(toIndex(array[i]));
    }
    return(newArray);
}

function randGeom(p){
    var val = Math.floor(Math.log(1-Math.random())/Math.log(1-p));
    if(val >= (maxpoints-1)){
        return(maxpoints - 1);
    } else{
        return(val+1);
    }
}

function recordData(feedback=false){
    if(!feedback){
        trialData.push({
            exptPart: exptPart,
            role: role,
            trialNumber: trialNumber,
            totalTurns: turn,
            numTeachSpaces: rows*cols,
            teachOrigSpaces: toByte(arrayToIndices(teachOrigSpaces)),
            numLearnSpaces: rows*cols/2,
            learnOrigSpaces: toByte(arrayToIndices(learnOrigSpaces)),
            bullseyeLocation: toIndex(battleship),
            spacesOpenAtTurnStart: spacesOpenAtTurnStart,
            halfSpacesByTurn: halfSpacesByTurn,
            halfSpacesNumElimByTurn: halfSpacesNumElimByTurn,
            eliminatedByChoice: eliminatedChoice,
            numElimRounds: numElimRounds,
            guessedSpaces: guessedSpaces, //spaces guessed by teacher about learner's hypothesis space
            cellsCorrect: cellsCorr, //0 in the learner role
            cellsPainted: toByte(arrayToIndices(cellsPainted.slice(0))),
            uncertain: toByte(arrayToIndices(uncertain.slice(0))),
            playerPoints: plaPoints,
            opponentPoints: oppPoints,
            playerTotalPoints: plaTotalPoints,
            opponentTotalPoints: oppTotalPoints,
            teachRT: teachRT,
            paintRT: paintRT});
    } else{
        trialData.push({
            exptPart: 'feedback',
            role: $('#textFeedback').val(),
            trialNumber: 'NA',
            totalTurns: 'NA',
            numTeachSpaces: 'NA',
            teachOrigSpaces: 'NA',
            numLearnSpaces: 'NA',
            learnOrigSpaces: 'NA',
            bullseyeLocation: 'NA',
            spacesOpenAtTurnStart: 'NA',
            halfSpacesByTurn: 'NA',
            halfSpacesNumElimByTurn: 'NA',
            eliminatedByChoice: 'NA',
            numElimRounds: 'NA',
            guessedSpaces: 'NA',
            cellsCorrect: 'NA',
            cellsPainted: 'NA',
            uncertain: 'NA',
            playerPoints: 'NA',
            opponentPoints: 'NA',
            playerTotalPoints: 'NA',
            opponentTotalPoints: 'NA',
            teachRT: 'NA',
            paintRT: 'NA'});
    }
}


