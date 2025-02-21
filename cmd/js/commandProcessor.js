import { InstanceManager } from './instanceManager.js';

export class CommandProcessor {
  constructor(fileSystem) {
    this.fs = fileSystem;
    this.instanceManager = new InstanceManager();
    this.commands = {
      'CD': this.changeDirectory.bind(this),
      'CHDIR': this.changeDirectory.bind(this),
      'DIR': this.listDirectory.bind(this),
      'MD': this.makeDirectory.bind(this),
      'MKDIR': this.makeDirectory.bind(this),
      'RD': this.removeDirectory.bind(this),
      'RMDIR': this.removeDirectory.bind(this),
      'CLS': this.clearScreen.bind(this),
      'HELP': this.showHelp.bind(this),
      'VER': this.showVersion.bind(this),
      'EXIT': this.exit.bind(this),
      'ECHO': this.echo.bind(this),
      'TIME': this.showTime.bind(this),
      'DATE': this.showDate.bind(this),
      'TYPE': this.type.bind(this),
      'EDIT': this.edit.bind(this),
      'DEL': this.deleteFile.bind(this),
      'RUN': this.runFile.bind(this),
      'MOVE': this.moveItem.bind(this),
      'SAVE': this.saveInstance.bind(this),
      'LOAD': this.loadInstance.bind(this)
    };
  }

  execute(commandLine) {
    const parts = commandLine.trim().split(' ');
    const command = parts[0].toUpperCase();
    const args = parts.slice(1).join(' ');

    if (this.commands[command]) {
      return this.commands[command](args);
    }

    throw new Error(`'${command}' is not recognized as an internal or external command, operable program or batch file.`);
  }

  changeDirectory(path) {
    if (!path) {
      return this.fs.getCurrentPath();
    }
    this.fs.changeDirectory(path);
  }

  listDirectory() {
    return this.fs.listDirectory();
  }

  makeDirectory(name) {
    if (!name) {
      throw new Error('The syntax of the command is incorrect.');
    }
    this.fs.makeDirectory(name);
  }

  removeDirectory(name) {
    if (!name) {
      throw new Error('The syntax of the command is incorrect.');
    }
    this.fs.removeDirectory(name);
  }

  clearScreen() {
    document.getElementById('output').innerHTML = '';
  }

  showHelp() {
    return `
Available commands:
CD      - Displays the current directory or changes to another directory
DIR     - Displays a list of files and subdirectories in a directory
MD      - Creates a directory
RD      - Removes a directory
EDIT    - Creates or edits a file (only works for .js file extensions)
TYPE    - Displays the contents of a file
DEL     - Deletes a file
MOVE    - Moves a file or directory to a new location
RUN     - Executes a JavaScript file
SAVE    - Saves current instance with a name and password
LOAD    - Loads a saved instance using its name and password
CLS     - Clears the screen
HELP    - Provides help information for Windows commands
VER     - Displays the Windows version
EXIT    - Quits the command interpreter
ECHO    - Displays messages
TIME    - Displays or sets the system time
DATE    - Displays or sets the system date
    `.trim();
  }

  showVersion() {
    return 'Microsoft Windows [Version 10.0.19044.2728]';
  }

  exit() {
    return 'To exit the command prompt simulator, close the browser tab or window.';
  }

  echo(message) {
    if (!message) return '';
    return message;
  }

  showTime() {
    return new Date().toLocaleTimeString();
  }

  showDate() {
    return new Date().toLocaleDateString();
  }

  type(filename) {
    if (!filename) {
      throw new Error('The syntax of the command is incorrect.');
    }
    return this.fs.readFile(filename);
  }

  edit(filename) {
    if (!filename) {
      throw new Error('The syntax of the command is incorrect.');
    }

    let content = '';
    try {
      content = this.fs.readFile(filename);
    } catch (error) {
      // File doesn't exist, will create new
    }

    const editor = document.createElement('div');
    editor.className = 'editor-overlay';
    editor.innerHTML = `
      <div class="editor">
        <div class="editor-header">
          <span>Editing: ${filename}</span>
          <button class="save-button">Save</button>
        </div>
        <textarea class="editor-textarea">${content}</textarea>
      </div>
    `;

    document.body.appendChild(editor);

    const textarea = editor.querySelector('.editor-textarea');
    const saveButton = editor.querySelector('.save-button');

    const save = () => {
      try {
        if (content === '') {
          this.fs.createFile(filename, textarea.value);
        } else {
          this.fs.writeFile(filename, textarea.value);
        }
        document.body.removeChild(editor);
        return 'File saved successfully.';
      } catch (error) {
        return `Error: ${error.message}`;
      }
    };

    saveButton.addEventListener('click', save);
    textarea.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        save();
      }
    });

    editor.addEventListener('click', (e) => {
      if (e.target === editor) {
        document.body.removeChild(editor);
      }
    });
  }

  deleteFile(filename) {
    if (!filename) {
      throw new Error('The syntax of the command is incorrect.');
    }
    this.fs.deleteFile(filename);
    return `${filename} deleted successfully.`;
  }

  async runFile(filename) {
    if (!filename) {
      throw new Error('The syntax of the command is incorrect.');
    }
    
    if (!this.fs.fileExists(filename)) {
      throw new Error(`File not found: ${filename}`);
    }
    
    const code = this.fs.readFile(filename);
    const outputDiv = document.getElementById('output');
    
    // Create a sandbox console
    const sandbox = {
      log: (...args) => {
        const line = document.createElement('div');
        line.textContent = args.join(' ');
        outputDiv.appendChild(line);
      },
      error: (...args) => {
        const line = document.createElement('div');
        line.textContent = args.join(' ');
        line.className = 'error';
        outputDiv.appendChild(line);
      }
    };

    try {
      let jsCode = await this.convertToJavaScript(filename, code);
      const func = new Function('console', jsCode);
      await func(sandbox);
      return 'Program executed successfully.';
    } catch (error) {
      throw new Error(`Runtime error: ${error.message}`);
    }
  }

  async convertToJavaScript(filename, code) {
    const extension = filename.split('.').pop().toLowerCase();
    
    switch (extension) {
      case 'js':
        return code;
        
      case 'java':
        return this.convertJavaToJS(code);
        
      case 'cs':
        return this.convertCSharpToJS(code);
        
      case 'rb':
        return this.convertRubyToJS(code);
        
      case 'go':
        return this.convertGoToJS(code);

      case 'html':
      case 'css':
        return this.createWebPreview(code, extension);
        
      default:
        // For unknown extensions, try to detect the language and convert
        return this.detectAndConvert(code);
    }
  }

  createWebPreview(code, extension) {
    // Create a preview container
    const previewContainerId = 'preview-' + Math.random().toString(36).substr(2, 9);
    
    let previewCode = '';
    
    if (extension === 'html') {
      // For HTML, create an iframe to display the content
      previewCode = `
        const previewContainer = document.createElement('div');
        previewContainer.id = '${previewContainerId}';
        previewContainer.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 80%; height: 80%; background: white; border: 1px solid #ccc; border-radius: 5px; overflow: hidden; z-index: 1000;';
        
        const toolbar = document.createElement('div');
        toolbar.style.cssText = 'padding: 10px; background: #f5f5f5; border-bottom: 1px solid #ccc; display: flex; justify-content: flex-end;';
        
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.cssText = 'border: none; background: #ff4444; color: white; width: 24px; height: 24px; border-radius: 3px; cursor: pointer;';
        closeButton.onclick = () => document.body.removeChild(previewContainer);
        
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'width: 100%; height: calc(100% - 45px); border: none;';
        iframe.srcdoc = \`${code.replace(/`/g, '\\`')}\`;
        
        toolbar.appendChild(closeButton);
        previewContainer.appendChild(toolbar);
        previewContainer.appendChild(iframe);
        document.body.appendChild(previewContainer);
      `;
    } else if (extension === 'css') {
      // For CSS, create a preview with some demo elements
      const demoHTML = `
        <div class="demo-box">Demo Box</div>
        <button class="demo-button">Demo Button</button>
        <p class="demo-text">Demo Text</p>
      `;
      
      previewCode = `
        const previewContainer = document.createElement('div');
        previewContainer.id = '${previewContainerId}';
        previewContainer.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 80%; height: 80%; background: white; border: 1px solid #ccc; border-radius: 5px; overflow: auto; z-index: 1000; padding: 20px;';
        
        const toolbar = document.createElement('div');
        toolbar.style.cssText = 'padding: 10px; background: #f5f5f5; border-bottom: 1px solid #ccc; display: flex; justify-content: flex-end; position: sticky; top: 0;';
        
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.cssText = 'border: none; background: #ff4444; color: white; width: 24px; height: 24px; border-radius: 3px; cursor: pointer;';
        closeButton.onclick = () => document.body.removeChild(previewContainer);
        
        const style = document.createElement('style');
        style.textContent = \`${code.replace(/`/g, '\\`')}\`;
        
        const content = document.createElement('div');
        content.innerHTML = \`${demoHTML}\`;
        
        toolbar.appendChild(closeButton);
        previewContainer.appendChild(toolbar);
        previewContainer.appendChild(style);
        previewContainer.appendChild(content);
        document.body.appendChild(previewContainer);
      `;
    }
    
    return previewCode;
  }

  convertJavaToJS(code) {
    // Enhanced Java to JavaScript conversion
    let jsCode = code
      // Remove package declarations
      .replace(/package\s+[\w.]+;/g, '')
      // Remove import statements
      .replace(/import\s+[\w.]+;/g, '')
      // Convert System.out.println to console.log
      .replace(/System\.out\.println\((.*)\);/g, 'console.log($1);')
      // Convert System.out.print to console.log
      .replace(/System\.out\.print\((.*)\);/g, 'console.log($1);')
      // Convert public class to class
      .replace(/public\s+class\s+(\w+)\s*\{/g, 'class $1 {')
      // Convert private/protected/public methods to regular methods
      .replace(/(private|protected|public)\s+static\s+(\w+)\s+(\w+)\s*\((.*?)\)\s*\{/g, 'static $3($4) {')
      .replace(/(private|protected|public)\s+(\w+)\s+(\w+)\s*\((.*?)\)\s*\{/g, '$3($4) {')
      // Convert main method to an async function expression
      .replace(/public\s+static\s+void\s+main\s*\(\s*String\s*\[\]\s*args\s*\)\s*\{/g, 'const main = async () => {')
      // Remove type declarations
      .replace(/(int|String|boolean|double|float|long|char)\s+(\w+)\s*=/g, 'let $2 =')
      .replace(/(int|String|boolean|double|float|long|char)\s+(\w+)\s*;/g, 'let $2;')
      // Convert array declarations
      .replace(/(\w+)\s*\[\]\s+(\w+)\s*=\s*new\s+\w+\[(\d+)\]/g, 'let $2 = new Array($3)')
      // Convert ArrayList initialization
      .replace(/ArrayList<[\w<>]+>\s+(\w+)\s*=\s*new\s+ArrayList<[\w<>]+>\(\)/g, 'let $1 = []')
      // Convert List initialization
      .replace(/List<[\w<>]+>\s+(\w+)\s*=\s*new\s+ArrayList<[\w<>]+>\(\)/g, 'let $1 = []')
      // Convert .length() to .length
      .replace(/\.length\(\)/g, '.length')
      // Convert String methods
      .replace(/\.substring/g, '.slice')
      .replace(/\.charAt/g, '.charAt')
      // Convert for loops
      .replace(/for\s*\(\s*int\s+(\w+)\s*=\s*(\d+)\s*;\s*\1\s*<\s*([^;]+)\s*;\s*\1\+\+\s*\)/g, 'for(let $1 = $2; $1 < $3; $1++)');

    // Add closing braces and main() call at the end
    jsCode = jsCode.trim();
    if (!jsCode.endsWith('}')) {
      jsCode += '\n}';
    }
    jsCode += '\n\nmain().catch(console.error);';
    
    return jsCode;
  }

  convertRubyToJS(code) {
    // Enhanced Ruby to JavaScript conversion
    let jsCode = code
      // Convert puts/print to console.log
      .replace(/puts\s+(.*)/g, 'console.log($1)')
      .replace(/print\s+(.*)/g, 'console.log($1)')
      // Convert Ruby style comments
      .replace(/#/g, '//')
      // Convert Ruby class definitions
      .replace(/class\s+(\w+)\s*(<\s*\w+)?\s*$/g, 'class $1 {')
      // Convert Ruby's def to function
      .replace(/def\s+(\w+)\s*(\(.*?\))?\s*$/g, (match, name, params) => {
        params = params ? params : '()';
        return `function ${name}${params} {`;
      })
      // Convert Ruby's attr_accessor
      .replace(/attr_accessor\s+:(\w+)/g, 'get $1() { return this._$1 }\nset $1(v) { this._$1 = v }')
      // Convert Ruby's if conditions
      .replace(/if\s+err\s+!=\s+nil\s*$/g, 'if (err) {')
      .replace(/elsif\s+(.*?)\s*$/g, '} else if ($1) {')
      // Convert Ruby's unless to if !
      .replace(/unless\s+(.*?)\s*$/g, 'if (!$1) {')
      // Convert Ruby's while loops
      .replace(/while\s+(.*?)\s*do\s*$/g, 'while ($1) {')
      // Convert Ruby's until loops to while
      .replace(/until\s+(.*?)\s*do\s*$/g, 'while (!$1) {')
      // Convert Ruby's each loops
      .replace(/(\w+)\.each\s+do\s+\|\s*(\w+)\s*\|\s*$/g, '$1.forEach(($2) => {')
      // Convert Ruby's end statements
      .replace(/^(\s*)end\s*$/gm, '$1}')
      // Convert Ruby's string interpolation
      .replace(/#\{(.*?)\}/g, '${$1}')
      // Convert Ruby's array methods
      .replace(/\.collect/g, '.map')
      .replace(/\.select/g, '.filter')
      .replace(/\.inject/g, '.reduce')
      // Convert Ruby's hash rocket syntax
      .replace(/=>\s*/g, ': ');

    return jsCode;
  }

  convertGoToJS(code) {
    // Enhanced Go to JavaScript conversion
    let jsCode = code
      // Remove package declaration
      .replace(/package\s+[\w.]+\s*/, '')
      // Convert imports
      .replace(/import\s*\(([\s\S]*?)\)/g, '')
      .replace(/import\s+[\w./"]+\s*/g, '')
      // Convert fmt.Println to console.log
      .replace(/fmt\.Println\((.*)\)/g, 'console.log($1)')
      .replace(/fmt\.Printf\((.*)\)/g, 'console.log($1)')
      // Convert function declarations
      .replace(/func\s+(\w+)\s*\((.*?)\)\s*(?:\(?(.*?)\)?)?\s*\{/g, (match, name, params, returns) => {
        // Remove type information from parameters
        params = params.split(',')
          .map(p => p.trim().split(' ')[0])
          .join(', ');
        return `function ${name}(${params}) {`;
      })
      // Convert variable declarations
      .replace(/var\s+(\w+)\s+[\w.]+\s*=/g, 'let $1 =')
      .replace(/const\s+(\w+)\s+[\w.]+\s*=/g, 'const $1 =')
      // Convert short variable declaration
      .replace(/:=/g, '=')
      // Convert for loops
      .replace(/for\s+(\w+)\s*:=\s*range\s+(\w+)\s*{/g, 'for (const $1 in $2) {')
      // Convert if statements
      .replace(/if\s+err\s+!=\s+nil\s*{/g, 'if (err) {')
      // Convert maps
      .replace(/make\(map\[[\w.]+\][\w.]+\)/g, '{}')
      // Convert slices
      .replace(/make\(\[\][\w.]+,\s*\d+\)/g, '[]')
      // Convert struct initialization
      .replace(/&(\w+)\{(.*?)\}/g, 'new $1({$2})')
      // Convert defer to try/finally
      .replace(/defer\s+(.*?)\((.*?)\)/g, 'try {\n} finally {\n  $1($2)\n}')
      // Convert nil to null
      .replace(/nil/g, 'null')
      // Convert main function
      .replace(/func\s+main\s*\(\s*\)\s*{/g, 'async function main() {');

    // Add main() call at the end if it exists
    if (jsCode.includes('function main()')) {
      jsCode += '\nmain().catch(console.error);';
    }

    return jsCode;
  }

  detectAndConvert(code) {
    // Enhanced language detection based on common patterns
    if (code.includes('System.out.println') || code.includes('public class')) {
      return this.convertJavaToJS(code);
    } else if (code.includes('Console.WriteLine') || code.includes('using System;')) {
      return this.convertCSharpToJS(code);
    } else if (code.includes('puts') || code.includes('def') || code.includes('end')) {
      return this.convertRubyToJS(code);
    } else if (code.includes('fmt.Println') || code.includes('func main()')) {
      return this.convertGoToJS(code);
    }
    
    // If no pattern is recognized, return the code as-is
    return code;
  }

  convertCSharpToJS(code) {
    // Enhanced C# to JavaScript conversion
    let jsCode = code
      // Remove using statements
      .replace(/using\s+[\w.]+;/g, '')
      // Convert namespace declarations
      .replace(/namespace\s+[\w.]+\s*\{/g, '')
      // Convert Console.WriteLine to console.log
      .replace(/Console\.WriteLine\((.*)\);/g, 'console.log($1);')
      // Convert Console.Write to console.log
      .replace(/Console\.Write\((.*)\);/g, 'console.log($1);')
      // Convert public class to regular class
      .replace(/public\s+class\s+(\w+)\s*\{/g, 'class $1 {')
      // Convert other access modifiers
      .replace(/(private|protected|internal)\s+/g, '')
      // Convert property declarations
      .replace(/public\s+(\w+)\s+(\w+)\s*\{\s*get;\s*set;\s*\}/g, '$2;')
      // Convert public static void Main
      .replace(/public\s+static\s+void\s+Main\s*\(\s*string\[\]\s*args\s*\)\s*\{/g, 
        'async function main() {')
      // Remove type declarations but keep variable names
      .replace(/(int|string|bool|double|float|long|var|List<[\w<>]+>)\s+(\w+)\s*=/g, 'let $2 =')
      // Convert C# string interpolation
      .replace(/\$"([^"]*)"/g, '`$1`')
      // Convert List initialization
      .replace(/new\s+List<[\w<>]+>\(\)/g, '[]')
      // Convert array initialization
      .replace(/new\s+(\w+)\[\]\s*\{(.*?)\}/g, '[$2]')
      // Convert foreach loops
      .replace(/foreach\s*\(\s*var\s+(\w+)\s+in\s+(\w+)\s*\)/g, 'for(let $1 of $2)')
      // Convert for loops
      .replace(/for\s*\(\s*int\s+(\w+)\s*=\s*(\d+)\s*;\s*([^;]+)\s*;\s*([^)]+)\)/g, 'for(let $1 = $2; $3; $4)')
      // Remove remaining type declarations in method parameters
      .replace(/\(([\w\s,]+)\)/g, (match, params) => {
        return '(' + params.replace(/\w+\s+(\w+)(?=\s*,|\s*$)/g, '$1') + ')';
      })
      // Convert method declarations
      .replace(/(public|private|protected)\s+(?:static\s+)?(\w+)\s+(\w+)\s*\((.*?)\)/g, 'function $3($4)')
      // Convert string methods
      .replace(/\.ToString\(\)/g, '.toString()')
      // Convert number parsing
      .replace(/Int32\.Parse\((.*?)\)/g, 'parseInt($1)')
      .replace(/Double\.Parse\((.*?)\)/g, 'parseFloat($1)')
      // Remove extra closing braces from namespace/class
      .replace(/}\s*}$/g, '}');

    // Add main() call if it exists in the code
    if (jsCode.includes('function main()')) {
      jsCode += '\nmain().catch(console.error);';
    }
    
    return jsCode;
  }

  convertPHPToJS(code) {
    // Basic PHP to JavaScript conversion
    let jsCode = code
      // Remove PHP tags
      .replace(/<\?php|\?>/g, '')
      // Convert echo to console.log
      .replace(/echo\s+(.*?);/g, 'console.log($1);')
      // Convert PHP variables
      .replace(/\$(\w+)/g, '$1')
      // Convert PHP arrays
      .replace(/array\((.*)\)/g, '[$1]')
      // Convert PHP foreach
      .replace(/foreach\s*\(\s*\$(\w+)\s+as\s+\$(\w+)\s*\)\s*\{/g, 'for(let $2 of $1) {');
    
    return jsCode;
  }

  moveItem(args) {
    const parts = args.split(' ');
    if (parts.length !== 2) {
      throw new Error('The syntax of the command is incorrect.\nSyntax: MOVE <source> <destination>');
    }

    const [source, destination] = parts;
    try {
      this.fs.moveItem(source, destination);
      return `1 file(s) moved.`;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  saveInstance(args) {
    const parts = args.split(' ');
    if (parts.length !== 2) {
      throw new Error('The syntax of the command is incorrect.\nSyntax: SAVE <name> <password>');
    }

    const [name, password] = parts;
    return this.instanceManager.saveInstance(name, password, this.fs);
  }

  loadInstance(args) {
    const parts = args.split(' ');
    if (parts.length !== 2) {
      throw new Error('The syntax of the command is incorrect.\nSyntax: LOAD <name> <password>');
    }

    const [name, password] = parts;
    const result = this.instanceManager.loadInstance(name, password, this.fs);
    document.getElementById('current-path').textContent = `${this.fs.getCurrentPath()}>`;
    return result;
  }
}