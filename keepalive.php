<?php
    session_start();
    $incomingVal = $_GET['lastActive'];
    $sessionVal = $_SESSION['lastActive'];
    if($incomingVal > $sessionVal) {
        $_SESSION['lastActive'] = $incomingVal;
        $returnVal = $incomingVal;
    }
    else {
        $returnVal = $sessionVal;
    }
?>{
    "msg": "OK",
    "lastActive": "<?php echo $returnVal; ?>"
}