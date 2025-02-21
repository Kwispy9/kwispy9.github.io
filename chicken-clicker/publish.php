<?php
// Path to the leaderboard file
$filePath = "account-database.txt";

// Read POST data
$requestPayload = file_get_contents("php://input");
$data = json_decode($requestPayload, true);

$username = isset($data['username']) ? strtolower(trim($data['username'])) : null;
$score = isset($data['score']) ? intval($data['score']) : null;

// Validate input
if (!$username || $score === null) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid input. Username and score are required."
    ]);
    exit;
}

// Load existing leaderboard
$leaderboard = [];
if (file_exists($filePath)) {
    $fileContents = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($fileContents as $line) {
        list($existingUsername, $existingScore) = explode(":", $line);
        $leaderboard[strtolower(trim($existingUsername))] = intval(trim($existingScore));
    }
}

// Check if the username already exists and update the score if necessary
if (isset($leaderboard[$username])) {
    if ($leaderboard[$username] >= $score) {
        echo json_encode([
            "success" => false,
            "message" => "A higher or equal score already exists for this username."
        ]);
        exit;
    }
}

// Update or add the username and score
$leaderboard[$username] = $score;

// Write updated leaderboard to the file
$leaderboardData = [];
foreach ($leaderboard as $name => $highScore) {
    $leaderboardData[] = "$name:$highScore";
}
file_put_contents($filePath, implode("\n", $leaderboardData));

// Return success response
echo json_encode([
    "success" => true,
    "message" => "Score published successfully."
]);
?>
