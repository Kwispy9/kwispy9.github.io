import { CommandProcessor } from './commandProcessor.js';
import { FileSystem } from './fileSystem.js';

const commandInput = document.getElementById('command-input');
const output = document.getElementById('output');
const currentPath = document.getElementById('current-path');
const terminal = document.querySelector('.terminal');

const fileSystem = new FileSystem();
const commandProcessor = new CommandProcessor(fileSystem);

let commandHistory = [];
let historyIndex = -1;

function addToOutput(text, className = '') {
  const line = document.createElement('div');
  line.textContent = text;
  if (className) line.classList.add(className);
  output.appendChild(line);
  // Scroll the terminal to the input line
  terminal.scrollTop = terminal.scrollHeight;
}

function processCommand(command) {
  if (!command) return;
  
  addToOutput(`${currentPath.textContent}${command}`);
  
  try {
    const result = commandProcessor.execute(command);
    if (result) {
      addToOutput(result);
    }
    currentPath.textContent = `${fileSystem.getCurrentPath()}>`;
  } catch (error) {
    addToOutput(error.message, 'error');
  }
  
  // Ensure input is visible after command execution
  requestAnimationFrame(() => {
    commandInput.scrollIntoView({ behavior: 'smooth', block: 'end' });
  });
}

commandInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const command = commandInput.value.trim();
    if (command) {
      commandHistory.push(command);
      historyIndex = commandHistory.length;
      processCommand(command);
    }
    commandInput.value = '';
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (historyIndex > 0) {
      historyIndex--;
      commandInput.value = commandHistory[historyIndex];
    }
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (historyIndex < commandHistory.length - 1) {
      historyIndex++;
      commandInput.value = commandHistory[historyIndex];
    } else {
      historyIndex = commandHistory.length;
      commandInput.value = '';
    }
  }
});

// Initial welcome message
addToOutput('Microsoft Windows [Version 10.0.19044.2728]');
addToOutput('(c) Microsoft Corporation. All rights reserved.\n');
addToOutput('-\n');
addToOutput("Type 'help' for a list of commands\n");