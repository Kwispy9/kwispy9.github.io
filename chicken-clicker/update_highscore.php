<?php
// Path to your highscore database file
$databaseFile = 'databases/highscore-database.txt';

// Ensure the file exists
if (!file_exists($databaseFile)) {
    file_put_contents($databaseFile, '');
}

// Get POST data
$username = isset($_POST['username']) ? trim($_POST['username']) : '';
$score = isset($_POST['score']) ? intval($_POST['score']) : 0;

if (empty($username) || $score <= 0) {
    http_response_code(400); // Bad request
    echo json_encode(["error" => "Invalid username or score"]);
    exit;
}

// Load the existing data
$data = file($databaseFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
$entries = [];

foreach ($data as $line) {
    list($storedUsername, $storedScore) = explode(':', $line);
    $entries[trim($storedUsername)] = intval($storedScore);
}

// Update or add the new score
if (!isset($entries[$username]) || $score > $entries[$username]) {
    $entries[$username] = $score;
}

// Sort the entries by score in descending order
arsort($entries);

// Save the updated data back to the file
$newData = "";
foreach ($entries as $user => $userScore) {
    $newData .= "$user:$userScore\n";
}

if (file_put_contents($databaseFile, $newData) !== false) {
    echo json_encode(["success" => true]);
} else {
    http_response_code(500); // Internal Server Error
    echo json_encode(["error" => "Failed to save the data"]);
}
?>
