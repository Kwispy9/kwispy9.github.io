let updateInterval;

async function initLeaderboard() {
  await refreshLeaderboard();
  
  // Add refresh button event listener
  const refreshButton = document.getElementById('leaderboard-refresh');
  refreshButton.addEventListener('click', refreshLeaderboard);
}

async function refreshLeaderboard() {
  const leaderboardEl = document.getElementById('leaderboard-entries');
  leaderboardEl.innerHTML = '';

  try {
    const response = await fetch('highscore-database.txt');
    if (!response.ok) {
      throw new Error('Failed to load leaderboard data');
    }
    
    const data = await response.text();
    
    // Parse entries 
    const entries = data.trim() ? data.split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [username, score] = line.split(':');
        return {
          username: username.trim(),
          score: score.trim() === '' ? NaN : parseInt(score.trim()),
          isExample: score.trim() === ''
        };
      }) : [];

    // Separate example and real entries
    const exampleEntries = entries.filter(entry => entry.isExample);
    const realEntries = entries.filter(entry => !entry.isExample);

    // Sort real entries by score (highest first)
    realEntries.sort((a, b) => b.score - a.score);

    // Combine example entries and real entries
    let sortedEntries = [...exampleEntries, ...realEntries];

    if (sortedEntries.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.style.textAlign = 'center';
      emptyMessage.style.color = '#666';
      emptyMessage.style.padding = '20px';
      emptyMessage.textContent = 'No scores yet! Be the first to submit!';
      leaderboardEl.appendChild(emptyMessage);
      return;
    }

    sortedEntries.forEach((entry, index) => {
      const entryEl = document.createElement('div');
      
      // Determine class based on entry type
      if (entry.isExample) {
        entryEl.className = 'leaderboard-entry example';
        entryEl.style.backgroundColor = 'lightblue';
      } else {
        entryEl.className = 'leaderboard-entry' + (index === exampleEntries.length ? ' gold' : '');
      }
      
      const usernameSpan = document.createElement('span');
      usernameSpan.textContent = entry.username;
      
      const scoreEl = document.createElement('span');
      scoreEl.className = 'score';
      
      if (isNaN(entry.score)) {
        scoreEl.innerHTML = '<i>20</i>';
      } else {
        scoreEl.textContent = entry.score;
      }
      
      entryEl.appendChild(usernameSpan);
      entryEl.appendChild(scoreEl);
      
      leaderboardEl.appendChild(entryEl);
    });
  } catch (err) {
    console.error('Failed to load leaderboard:', err);
  }
}

async function getLeaderboardData() {
  try {
    const response = await fetch('highscore-database.txt');
    if (!response.ok) {
      throw new Error('Failed to load leaderboard data');
    }
    const data = await response.text();
    
    return data.trim() ? data.split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [username, score] = line.split(':');
        return {
          username: username.trim(),
          score: score.trim() === '' ? NaN : parseInt(score.trim()),
          isExample: score.trim() === ''
        };
      })
      : [];
  } catch (err) {
    console.error('Failed to get leaderboard data:', err);
    return [];
  }
}

async function appendToDatabase(username, score) {
  try {
    // Load existing data first
    const existingData = await getLeaderboardData();
    
    // Remove any existing entry for this username
    const filteredData = existingData.filter(entry => 
      entry.username.toLowerCase() !== username.toLowerCase()
    );
    
    // Add new entry
    filteredData.push({ username, score, isExample: false });
    
    // Sort by score (highest first)
    filteredData.sort((a, b) => {
      if (isNaN(a.score) && !isNaN(b.score)) return -1;
      if (!isNaN(a.score) && isNaN(b.score)) return 1;
      if (isNaN(a.score) && isNaN(b.score)) return 0;
      return b.score - a.score;
    });
    
    // Convert back to string format
    const newData = filteredData
      .map(entry => {
        if (isNaN(entry.score)) {
          return `${entry.username}:`;
        } else {
          return `${entry.username}:${entry.score}`;
        }
      })
      .join('\n') + '\n';
    
    // Save to file
    const saveResponse = await fetch('highscore-database.txt', {
      method: 'PUT', 
      headers: {
        'Content-Type': 'text/plain',
      },
      body: newData
    });

    if (!saveResponse.ok) {
      throw new Error('Failed to save to database');
    }

    await refreshLeaderboard();
    return true;
  } catch (err) {
    console.error('Failed to append to database:', err);
    return false;
  }
}

export async function publishScore(score) {
  const popup = document.createElement('div');
  popup.className = 'score-popup';
  popup.innerHTML = `
    <div class="score-popup-content">
      <h2>Submit Score</h2>
      <p>Enter your username:</p>
      <input type="text" id="username-input" maxlength="20">
      <p id="score-warning" class="warning hidden"></p>
      <button id="submit-score">Submit</button>
      <button id="cancel-score">Cancel</button>
    </div>
  `;
  document.body.appendChild(popup);

  const submitButton = popup.querySelector('#submit-score');
  const cancelButton = popup.querySelector('#cancel-score');
  const usernameInput = popup.querySelector('#username-input');
  const warning = popup.querySelector('#score-warning');

  return new Promise((resolve) => {
    submitButton.addEventListener('click', async () => {
      submitButton.disabled = true; 
      
      const username = usernameInput.value.trim();
      if (!username) {
        warning.textContent = 'Please enter a username';
        warning.classList.remove('hidden');
        submitButton.disabled = false;
        return;
      }

      const leaderboardData = await getLeaderboardData();
      
      const existingEntry = leaderboardData.find(entry => 
        entry.username.toLowerCase() === username.toLowerCase() && !entry.isExample
      );
      
      if (existingEntry && existingEntry.score >= score) {
        warning.textContent = `${username} already has a higher score of ${existingEntry.score}`;
        warning.classList.remove('hidden');
        submitButton.disabled = false;
        return;
      }

      const success = await appendToDatabase(username, score);
      
      if (success) {
        popup.querySelector('.score-popup-content').innerHTML = `
          <h2 style="color: #4CAF50;">SUCCESS!</h2>
          <p>Your highscore has successfully been published to the leaderboard</p>
          <button id="close-success">Close</button>
        `;
        
        popup.querySelector('#close-success').addEventListener('click', () => {
          popup.remove();
          resolve(true);
        });
      } else {
        popup.querySelector('.score-popup-content').innerHTML = `
          <h2 style="color: #ff0000;">FAILURE!</h2>
          <p style="color: #ff0000;">Your score failed to submit! Please comment that this has happened</p>
          <button id="close-failure">Close</button>
        `;
        
        popup.querySelector('#close-failure').addEventListener('click', () => {
          popup.remove();
          resolve(false);
        });
      }
    });

    cancelButton.addEventListener('click', () => {
      popup.remove();
      resolve(false);
    });
  });
}

window.addEventListener('unload', () => {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
});

document.addEventListener('DOMContentLoaded', initLeaderboard);