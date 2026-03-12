// ═══════════════════════════════════════════════════════════════
//  SUDO QUEST — Game Engine
// ═══════════════════════════════════════════════════════════════

import { CATEGORIES, getCategoryByKey, getLevelsForCategory } from './levels.js';

// ── Sound System (Web Audio API) ─────────────────────────────

class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    try {
      const saved = localStorage.getItem('sudoquest_sound');
      if (saved === 'off') this.enabled = false;
    } catch (_) {}
  }

  getCtx() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (_) { this.enabled = false; }
    }
    return this.ctx;
  }

  toggle() {
    this.enabled = !this.enabled;
    try { localStorage.setItem('sudoquest_sound', this.enabled ? 'on' : 'off'); } catch (_) {}
    return this.enabled;
  }

  playNote(freq, duration, startTime, gain = 0.15, type = 'sine') {
    const ctx = this.getCtx();
    if (!ctx || !this.enabled) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(g).connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  playLevelComplete() {
    const ctx = this.getCtx();
    if (!ctx || !this.enabled) return;
    const t = ctx.currentTime;
    // Ascending 3-note chime: C5 - E5 - G5
    this.playNote(523.25, 0.15, t, 0.12);
    this.playNote(659.25, 0.15, t + 0.12, 0.12);
    this.playNote(783.99, 0.25, t + 0.24, 0.15);
  }

  playCategoryComplete() {
    const ctx = this.getCtx();
    if (!ctx || !this.enabled) return;
    const t = ctx.currentTime;
    // Triumphant fanfare: C5 - E5 - G5 - C6
    this.playNote(523.25, 0.18, t, 0.12);
    this.playNote(659.25, 0.18, t + 0.15, 0.12);
    this.playNote(783.99, 0.18, t + 0.30, 0.14);
    this.playNote(1046.50, 0.4, t + 0.45, 0.16);
    // Harmony
    this.playNote(523.25, 0.35, t + 0.45, 0.06, 'triangle');
  }

  playAchievement() {
    const ctx = this.getCtx();
    if (!ctx || !this.enabled) return;
    const t = ctx.currentTime;
    // Sparkle: quick rising arpeggio
    [523, 659, 784, 1047, 1319].forEach((f, i) => {
      this.playNote(f, 0.12, t + i * 0.07, 0.08, 'triangle');
    });
  }

  playError() {
    const ctx = this.getCtx();
    if (!ctx || !this.enabled) return;
    const t = ctx.currentTime;
    // Low buzz
    this.playNote(180, 0.15, t, 0.08, 'sawtooth');
  }

  playWrongAnswer() {
    const ctx = this.getCtx();
    if (!ctx || !this.enabled) return;
    const t = ctx.currentTime;
    // Descending two-tone "nope": E4 → C4
    this.playNote(329.63, 0.12, t, 0.10, 'square');
    this.playNote(261.63, 0.18, t + 0.10, 0.10, 'square');
  }
}

const sound = new SoundManager();

// ── Learning Sandbox Curriculum ──────────────────────────────

const SANDBOX_LESSONS = {
  js: [
    { title: 'Variables & Data Types', concepts: [
      { name: 'console.log()', desc: 'Prints output to the terminal. Your main debugging tool.', example: 'console.log("Hello, World!")' },
      { name: 'Variables (let / const)', desc: 'Store data for later use. "let" can be reassigned, "const" cannot.', example: 'let name = "Ada";\nconst PI = 3.14;\nconsole.log(name, PI)' },
      { name: 'Data Types', desc: 'JS has strings ("text"), numbers (42), booleans (true/false), null, undefined.', example: 'let text = "hello";  // string\nlet num = 42;        // number\nlet flag = true;     // boolean\nconsole.log(typeof text, typeof num, typeof flag)' },
      { name: 'Template Literals', desc: 'Use backticks ` with ${} to embed expressions inside strings.', example: 'let name = "World";\nconsole.log(`Hello, ${name}!`)' },
    ]},
    { title: 'Operators & Conditions', concepts: [
      { name: 'Arithmetic', desc: 'Math operators: + - * / % (remainder) ** (power)', example: 'console.log(10 + 5);\nconsole.log(10 % 3);  // remainder = 1\nconsole.log(2 ** 8);  // 256' },
      { name: 'Comparison', desc: '=== (strict equal), !== (not equal), >, <, >=, <=. Always use === over ==.', example: 'console.log(5 === 5);    // true\nconsole.log("5" === 5);  // false\nconsole.log(10 > 3);     // true' },
      { name: 'If / Else', desc: 'Run code only when a condition is true. else runs when false.', example: 'let score = 85;\nif (score >= 90) {\n  console.log("A");\n} else if (score >= 80) {\n  console.log("B");\n} else {\n  console.log("C");\n}' },
      { name: 'Logical Operators', desc: '&& (AND) requires both true. || (OR) requires at least one. ! (NOT) inverts.', example: 'let logged = true, admin = false;\nif (logged && admin) {\n  console.log("admin panel");\n} else if (logged || admin) {\n  console.log("basic access");\n}' },
    ]},
    { title: 'Functions', concepts: [
      { name: 'Function Declaration', desc: 'Reusable blocks of code. Define once, call many times.', example: 'function greet(name) {\n  return "Hello, " + name;\n}\nconsole.log(greet("Ada"))' },
      { name: 'Arrow Functions', desc: 'Shorter syntax using =>. Great for callbacks and one-liners.', example: 'const double = (n) => n * 2;\nconst add = (a, b) => a + b;\nconsole.log(double(5));\nconsole.log(add(3, 4))' },
      { name: 'Default Parameters', desc: 'Set fallback values if an argument is not provided.', example: 'function greet(name = "World") {\n  console.log(`Hello, ${name}!`);\n}\ngreet();       // Hello, World!\ngreet("Ada");  // Hello, Ada!' },
    ]},
    { title: 'Arrays & Loops', concepts: [
      { name: 'Arrays', desc: 'Ordered lists of values. Access by index (starting at 0).', example: 'let fruits = ["apple", "banana", "cherry"];\nconsole.log(fruits[0]);    // apple\nconsole.log(fruits.length); // 3' },
      { name: 'Array Methods', desc: 'push() adds, pop() removes last, includes() checks membership.', example: 'let arr = [1, 2, 3];\narr.push(4);\nconsole.log(arr);       // [1,2,3,4]\nconsole.log(arr.pop()); // 4' },
      { name: 'For Loop', desc: 'Repeat code a specific number of times.', example: 'for (let i = 0; i < 5; i++) {\n  console.log("Step " + i);\n}' },
      { name: 'forEach / map', desc: 'Iterate arrays. forEach runs a function on each. map transforms and returns new array.', example: 'let nums = [1, 2, 3];\nnums.forEach(n => console.log(n * 10));\nlet doubled = nums.map(n => n * 2);\nconsole.log(doubled)' },
    ]},
    { title: 'Objects & Advanced', concepts: [
      { name: 'Objects', desc: 'Key-value pairs. Access with dot or bracket notation.', example: 'let user = { name: "Ada", age: 28 };\nconsole.log(user.name);\nuser.role = "dev";\nconsole.log(user)' },
      { name: 'Destructuring', desc: 'Extract values from objects/arrays into variables.', example: 'let [a, b] = [1, 2];\nlet { name, age } = { name: "Ada", age: 28 };\nconsole.log(a, b, name, age)' },
      { name: 'Spread Operator', desc: '... spreads arrays/objects into new ones. Great for copies and merging.', example: 'let arr = [1, 2, 3];\nlet copy = [...arr, 4, 5];\nconsole.log(copy)' },
      { name: 'Ternary Operator', desc: 'Shorthand if/else: condition ? ifTrue : ifFalse', example: 'let age = 20;\nlet status = age >= 18 ? "adult" : "minor";\nconsole.log(status)' },
    ]},
    { title: 'Error Handling & Async', concepts: [
      { name: 'Try / Catch', desc: 'Handle errors gracefully instead of crashing. catch receives the error.', example: 'try {\n  let data = JSON.parse("bad json");\n} catch (err) {\n  console.log("Error:", err.message);\n}' },
      { name: 'Promises', desc: 'Represent future values. .then() for success, .catch() for errors.', example: 'const wait = (ms) => new Promise(resolve =>\n  setTimeout(resolve, ms)\n);\nwait(1000).then(() => console.log("Done!"))' },
      { name: 'Async / Await', desc: 'Cleaner syntax for Promises. async functions return Promises, await pauses execution.', example: 'async function fetchData() {\n  try {\n    const res = await fetch("/api/data");\n    const json = await res.json();\n    console.log(json);\n  } catch (err) {\n    console.log("Failed:", err.message);\n  }\n}' },
    ]},
    { title: 'String & Array Tricks', concepts: [
      { name: 'String Methods', desc: 'slice, split, replace, trim, includes, startsWith, endsWith, repeat.', example: 'let s = "  Hello, World!  ";\nconsole.log(s.trim());         // "Hello, World!"\nconsole.log(s.trim().split(","));  // ["Hello", " World!"]\nconsole.log("ha".repeat(3));   // "hahaha"' },
      { name: 'filter / find / reduce', desc: 'filter keeps matching items, find returns first match, reduce accumulates.', example: 'let nums = [1, 2, 3, 4, 5];\nlet evens = nums.filter(n => n % 2 === 0);\nconsole.log(evens);  // [2, 4]\nlet sum = nums.reduce((a, b) => a + b, 0);\nconsole.log(sum);    // 15' },
      { name: 'Chaining Methods', desc: 'Array methods return arrays, so you can chain them together.', example: 'let result = [5, 3, 8, 1, 9]\n  .filter(n => n > 3)\n  .map(n => n * 2)\n  .sort((a, b) => a - b);\nconsole.log(result); // [10, 16, 18]' },
    ]},
    { title: 'DOM & Events', concepts: [
      { name: 'Selecting Elements', desc: 'querySelector finds one element, querySelectorAll finds all matches.', example: 'const btn = document.querySelector("#myBtn");\nconst items = document.querySelectorAll(".item");\nconsole.log(btn, items.length)' },
      { name: 'Event Listeners', desc: 'addEventListener attaches behavior to user actions like clicks and key presses.', example: 'const btn = document.querySelector("#myBtn");\nbtn.addEventListener("click", () => {\n  console.log("Button clicked!");\n})' },
      { name: 'Modifying the DOM', desc: 'Change text, HTML, styles, classes, and attributes of elements.', example: 'const el = document.querySelector("#output");\nel.textContent = "Updated!";\nel.classList.add("active");\nel.style.color = "green"' },
      { name: 'Creating Elements', desc: 'createElement + appendChild to dynamically add content to the page.', example: 'const li = document.createElement("li");\nli.textContent = "New item";\ndocument.querySelector("ul").appendChild(li)' },
    ]},
  ],
  git: [
    { title: 'Getting Started', concepts: [
      { name: 'git init', desc: 'Initialize a new Git repository in the current directory.', example: 'git init' },
      { name: 'Creating Files', desc: 'Use echo to create files that Git can track.', example: 'echo "hello" > readme.txt' },
      { name: 'git add', desc: 'Stage files for commit. "git add ." stages everything.', example: 'git add readme.txt\n# or stage all:\ngit add .' },
      { name: 'git commit', desc: 'Save staged changes as a snapshot with a message.', example: 'git commit -m "Initial commit"' },
    ]},
    { title: 'Branching', concepts: [
      { name: 'git branch', desc: 'Create or list branches. Branches let you work on features in isolation.', example: 'git branch feature\ngit branch  # list all' },
      { name: 'git checkout / switch', desc: 'Move between branches. Use -b (checkout) or -c (switch) to create and switch.', example: 'git checkout feature\n# or modern:\ngit switch feature\ngit switch -c new-branch' },
      { name: 'git merge', desc: 'Combine another branch into the current one.', example: 'git checkout main\ngit merge feature' },
      { name: 'git stash', desc: 'Temporarily save uncommitted changes. Pop them back later.', example: 'git stash\ngit stash pop\ngit stash list' },
    ]},
    { title: 'History & Inspection', concepts: [
      { name: 'git log', desc: 'View commit history. --oneline for compact view, --graph for branch visualization.', example: 'git log\ngit log --oneline\ngit log --oneline --graph --all' },
      { name: 'git diff', desc: 'See changes between working tree and staging, or between commits.', example: 'git diff              # unstaged changes\ngit diff --staged     # staged changes\ngit diff main feature  # between branches' },
      { name: 'git status', desc: 'Show the state of working directory and staging area.', example: 'git status\ngit status -s  # short format' },
      { name: 'git blame', desc: 'Show who changed each line of a file and when.', example: 'git blame index.html' },
    ]},
    { title: 'Undoing & Remote', concepts: [
      { name: 'git restore', desc: 'Discard changes in working directory or unstage files.', example: 'git restore file.txt          # discard changes\ngit restore --staged file.txt  # unstage' },
      { name: 'git revert', desc: 'Create a new commit that undoes a previous commit. Safer than reset.', example: 'git revert HEAD       # undo last commit\ngit revert abc1234    # undo specific commit' },
      { name: 'git remote & push', desc: 'Connect to remote repos. push sends commits, pull fetches and merges.', example: 'git remote add origin https://github.com/user/repo.git\ngit push -u origin main\ngit pull origin main' },
      { name: 'git clone', desc: 'Download a complete copy of a remote repository.', example: 'git clone https://github.com/user/repo.git\ngit clone https://github.com/user/repo.git my-folder' },
    ]},
  ],
  cmd: [
    { title: 'Navigation & Files', concepts: [
      { name: 'pwd / ls / cd', desc: 'pwd = print directory, ls = list files, cd = change directory.', example: 'pwd\nls\ncd Documents' },
      { name: 'touch / mkdir', desc: 'touch creates files, mkdir creates directories. mkdir -p for nested.', example: 'touch hello.txt\nmkdir projects\nmkdir -p deep/nested/dir' },
      { name: 'cat / echo', desc: 'cat reads files, echo prints text. Use > to redirect output to files.', example: 'echo "hello" > file.txt\ncat file.txt' },
      { name: 'cp / mv / rm', desc: 'cp = copy, mv = move/rename, rm = delete files.', example: 'cp file.txt backup.txt\nmv backup.txt archive.txt\nrm archive.txt' },
    ]},
    { title: 'Pipes & Environment', concepts: [
      { name: 'Pipes |', desc: 'Send output of one command as input to another. Chain operations.', example: 'echo "hello world" | wc' },
      { name: 'Redirection > / >>', desc: '> overwrites file, >> appends to file.', example: 'echo "line 1" > log.txt\necho "line 2" >> log.txt\ncat log.txt' },
      { name: 'Environment Variables', desc: 'export sets, $VAR reads, env lists all variables.', example: 'export MY_VAR=hello\necho $MY_VAR\nenv' },
      { name: 'grep / sort / wc', desc: 'grep searches text, sort orders lines, wc counts lines/words/chars.', example: 'echo "apple\nbanana\napricot" | grep ap\necho "c\na\nb" | sort' },
    ]},
    { title: 'Permissions & Processes', concepts: [
      { name: 'chmod', desc: 'Change file permissions. u/g/o for user/group/other, r/w/x for read/write/execute.', example: 'chmod +x script.sh       # make executable\nchmod 755 script.sh      # rwx r-x r-x\nchmod 644 readme.txt     # rw- r-- r--' },
      { name: 'ps / kill / top', desc: 'ps lists processes, kill stops them, top shows real-time resource usage.', example: 'ps aux               # all processes\nkill 1234             # terminate PID 1234\nkill -9 1234          # force kill\ntop                   # live monitor' },
      { name: 'sudo', desc: 'Run commands as superuser (admin). Required for system-level changes.', example: 'sudo apt update\nsudo rm /etc/old-config\nsudo chmod 755 /usr/local/bin/tool' },
      { name: 'which / whereis', desc: 'Find the location of a program on your system.', example: 'which python\nwhereis git\nwhich node' },
    ]},
    { title: 'Networking & Archives', concepts: [
      { name: 'curl / wget', desc: 'Download files or make HTTP requests from the command line.', example: 'curl https://api.example.com/data\ncurl -o file.zip https://example.com/file.zip\nwget https://example.com/file.tar.gz' },
      { name: 'tar / zip', desc: 'Archive and compress files. tar for tarballs, zip for zip archives.', example: 'tar -czf archive.tar.gz folder/\ntar -xzf archive.tar.gz\nzip -r archive.zip folder/\nunzip archive.zip' },
      { name: 'ssh / scp', desc: 'ssh connects to remote servers, scp copies files between machines.', example: 'ssh user@server.com\nscp file.txt user@server.com:/path/\nscp user@server.com:/remote/file.txt ./local/' },
      { name: 'find / xargs', desc: 'find searches for files by name/type/size. xargs passes results as arguments.', example: 'find . -name "*.js"\nfind . -type f -size +1M\nfind . -name "*.log" | xargs rm' },
    ]},
  ],
  html: [
    { title: 'Document Structure', concepts: [
      { name: 'HTML Skeleton', desc: 'Every page needs: <!DOCTYPE html>, <html>, <head>, <body>.', example: '<!DOCTYPE html>\n<html>\n<head>\n  <title>My Page</title>\n</head>\n<body>\n  <h1>Hello!</h1>\n</body>\n</html>' },
      { name: 'Headings & Paragraphs', desc: '<h1>-<h6> for headings, <p> for paragraphs. Semantic structure matters.', example: '<h1>Main Title</h1>\n<h2>Subtitle</h2>\n<p>Some paragraph text.</p>' },
      { name: 'Links & Images', desc: '<a href="url"> for links, <img src="file" alt="desc"> for images.', example: '<a href="https://example.com">Click here</a>\n<img src="photo.jpg" alt="A photo">' },
    ]},
    { title: 'Forms & Semantic HTML', concepts: [
      { name: 'Lists', desc: '<ul> for unordered, <ol> for ordered. Each item in <li>.', example: '<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ul>' },
      { name: 'Forms & Inputs', desc: '<form>, <input>, <button>, <textarea>, <select> build interactive forms.', example: '<form>\n  <input type="text" placeholder="Name">\n  <button type="submit">Send</button>\n</form>' },
      { name: 'Semantic Tags', desc: '<header>, <nav>, <main>, <section>, <article>, <footer> describe page structure.', example: '<header>\n  <nav><a href="/">Home</a></nav>\n</header>\n<main>\n  <article>Content here</article>\n</main>\n<footer>Copyright 2026</footer>' },
    ]},
    { title: 'Tables & Media', concepts: [
      { name: 'Tables', desc: '<table>, <tr> for rows, <th> for headers, <td> for data cells.', example: '<table>\n  <tr><th>Name</th><th>Score</th></tr>\n  <tr><td>Ada</td><td>95</td></tr>\n  <tr><td>Bob</td><td>87</td></tr>\n</table>' },
      { name: 'Audio & Video', desc: '<audio> and <video> embed media with playback controls.', example: '<audio controls>\n  <source src="song.mp3" type="audio/mpeg">\n</audio>\n<video controls width="400">\n  <source src="clip.mp4" type="video/mp4">\n</video>' },
      { name: 'Iframes', desc: '<iframe> embeds another webpage inside your page.', example: '<iframe src="https://example.com"\n  width="600" height="400"\n  title="Embedded page">\n</iframe>' },
    ]},
    { title: 'Attributes & Accessibility', concepts: [
      { name: 'Data Attributes', desc: 'Custom data-* attributes store extra info on elements for JS access.', example: '<button data-action="save" data-id="42">\n  Save\n</button>\n<!-- JS: el.dataset.action === "save" -->' },
      { name: 'ARIA & Accessibility', desc: 'aria-label, role, alt text make pages usable for screen readers.', example: '<button aria-label="Close dialog">X</button>\n<img src="chart.png" alt="Sales chart for Q1">\n<nav role="navigation">\n  <a href="/">Home</a>\n</nav>' },
      { name: 'Meta Tags', desc: '<meta> tags in <head> control viewport, charset, SEO, and social sharing.', example: '<meta charset="UTF-8">\n<meta name="viewport"\n  content="width=device-width, initial-scale=1.0">\n<meta name="description"\n  content="My awesome website">' },
    ]},
  ],
  css: [
    { title: 'Selectors & Box Model', concepts: [
      { name: 'Selectors', desc: 'element, .class, #id, element > child. Target what to style.', example: 'h1 { color: blue; }\n.card { padding: 16px; }\n#main { width: 100%; }' },
      { name: 'Box Model', desc: 'Every element is a box: content + padding + border + margin.', example: '.box {\n  width: 200px;\n  padding: 16px;\n  border: 2px solid black;\n  margin: 8px;\n}' },
      { name: 'Colors & Typography', desc: 'color for text, background-color for bg. font-size, font-weight for type.', example: 'body {\n  color: #333;\n  background-color: #f0f0f0;\n  font-size: 16px;\n  font-family: sans-serif;\n}' },
    ]},
    { title: 'Layout', concepts: [
      { name: 'Flexbox', desc: 'display: flex makes a flex container. Align and distribute child elements.', example: '.container {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  gap: 16px;\n}' },
      { name: 'Grid', desc: 'display: grid for 2D layouts. Define columns and rows.', example: '.grid {\n  display: grid;\n  grid-template-columns: 1fr 1fr 1fr;\n  gap: 16px;\n}' },
      { name: 'Positioning', desc: 'static (default), relative, absolute, fixed, sticky. Control element placement.', example: '.modal {\n  position: fixed;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%);\n  z-index: 100;\n}' },
    ]},
    { title: 'Animations & Transitions', concepts: [
      { name: 'Transitions', desc: 'Smoothly animate property changes over time.', example: '.btn {\n  background: #333;\n  transition: background 0.3s ease,\n             transform 0.2s ease;\n}\n.btn:hover {\n  background: #0af;\n  transform: scale(1.05);\n}' },
      { name: '@keyframes', desc: 'Define multi-step animations with keyframes and animation property.', example: '@keyframes fadeIn {\n  from { opacity: 0; transform: translateY(10px); }\n  to { opacity: 1; transform: translateY(0); }\n}\n.card {\n  animation: fadeIn 0.5s ease;\n}' },
      { name: 'Transforms', desc: 'Move, rotate, scale, skew elements without affecting layout.', example: '.icon {\n  transform: rotate(45deg);\n}\n.card:hover {\n  transform: scale(1.1) translateY(-4px);\n}' },
    ]},
    { title: 'Responsive & Variables', concepts: [
      { name: 'Media Queries', desc: 'Apply styles based on screen size, orientation, or preferences.', example: '@media (max-width: 768px) {\n  .sidebar { display: none; }\n  .main { width: 100%; }\n}\n@media (prefers-color-scheme: dark) {\n  body { background: #111; }\n}' },
      { name: 'CSS Variables', desc: 'Define reusable values with --name. Access with var(--name).', example: ':root {\n  --primary: #0af;\n  --gap: 16px;\n}\n.card {\n  color: var(--primary);\n  padding: var(--gap);\n}' },
      { name: 'Responsive Units', desc: 'Use rem, em, vw, vh, % for flexible sizing. rem = relative to root font-size.', example: '.container {\n  width: 90vw;\n  max-width: 1200px;\n  font-size: 1rem;\n  padding: 2em;\n  height: 100vh;\n}' },
      { name: 'Pseudo-classes & Pseudo-elements', desc: ':hover, :focus, :nth-child for states. ::before, ::after for generated content.', example: 'a:hover { color: #0af; }\nli:nth-child(odd) { background: #f5f5f5; }\n.quote::before {\n  content: "\\201C";\n  font-size: 2em;\n}' },
    ]},
  ],
  csharp: [
    { title: 'C# Basics', concepts: [
      { name: 'Hello World', desc: 'Console.WriteLine() prints to console. Every C# program starts in Main().', example: 'using System;\nConsole.WriteLine("Hello, World!");' },
      { name: 'Variables & Types', desc: 'C# is strongly typed: int, string, bool, double. Declare with type first.', example: 'int score = 100;\nstring name = "Ada";\nbool active = true;\ndouble pi = 3.14;' },
      { name: 'If / Else', desc: 'Same structure as JS but strongly typed comparisons.', example: 'int x = 10;\nif (x > 5) {\n  Console.WriteLine("big");\n} else {\n  Console.WriteLine("small");\n}' },
    ]},
    { title: 'Methods & Collections', concepts: [
      { name: 'Methods', desc: 'Define with return type, name, parameters. void for no return.', example: 'static int Add(int a, int b) {\n  return a + b;\n}\nConsole.WriteLine(Add(3, 4));' },
      { name: 'Loops', desc: 'for, while, foreach. foreach is great for collections.', example: 'for (int i = 0; i < 5; i++) {\n  Console.WriteLine(i);\n}\nstring[] names = {"Ada", "Bob"};\nforeach (var n in names) {\n  Console.WriteLine(n);\n}' },
      { name: 'Classes', desc: 'Blueprints for objects. Properties store data, methods define behavior.', example: 'class Dog {\n  public string Name { get; set; }\n  public void Bark() {\n    Console.WriteLine(Name + " barks!");\n  }\n}' },
    ]},
    { title: 'OOP & Interfaces', concepts: [
      { name: 'Inheritance', desc: 'A class can inherit from a parent class. Use : to extend.', example: 'class Animal {\n  public string Name { get; set; }\n  public virtual void Speak() {\n    Console.WriteLine("...");\n  }\n}\nclass Dog : Animal {\n  public override void Speak() {\n    Console.WriteLine(Name + " barks!");\n  }\n}' },
      { name: 'Interfaces', desc: 'Define contracts that classes must implement. Use "interface" keyword.', example: 'interface IMovable {\n  void Move(int x, int y);\n}\nclass Player : IMovable {\n  public void Move(int x, int y) {\n    Console.WriteLine($"Moving to ({x},{y})");\n  }\n}' },
      { name: 'Properties & Access', desc: 'public, private, protected control visibility. Properties wrap fields.', example: 'class User {\n  private string _name;\n  public string Name {\n    get { return _name; }\n    set { _name = value.Trim(); }\n  }\n  public int Age { get; private set; }\n}' },
    ]},
    { title: 'LINQ & Error Handling', concepts: [
      { name: 'LINQ Basics', desc: 'Query collections with SQL-like syntax. Where, Select, OrderBy.', example: 'int[] nums = {1, 2, 3, 4, 5};\nvar evens = nums.Where(n => n % 2 == 0);\nvar doubled = nums.Select(n => n * 2);\nvar sorted = nums.OrderByDescending(n => n);' },
      { name: 'Try / Catch / Finally', desc: 'Handle exceptions gracefully. Finally always runs.', example: 'try {\n  int result = 10 / 0;\n} catch (DivideByZeroException ex) {\n  Console.WriteLine("Error: " + ex.Message);\n} finally {\n  Console.WriteLine("Cleanup done");\n}' },
      { name: 'Generics', desc: 'Write type-safe code that works with any data type.', example: 'List<string> names = new List<string>();\nnames.Add("Ada");\nnames.Add("Bob");\nDictionary<string, int> scores = new();\nscores["Ada"] = 95;' },
    ]},
  ],
  python: [
    { title: 'Python Basics', concepts: [
      { name: 'print()', desc: 'Output text to the console. Adds a newline automatically.', example: 'print("Hello, World!")\nprint("Score:", 100)' },
      { name: 'Variables', desc: 'No type declarations needed. Python infers the type from the value.', example: 'name = "Ada"\nscore = 100\npi = 3.14\nactive = True' },
      { name: 'f-Strings', desc: 'Format strings with embedded expressions using f"...{expr}...".', example: 'name = "Ada"\nage = 28\nprint(f"Hello, {name}! Age: {age}")' },
    ]},
    { title: 'Data Structures & Control Flow', concepts: [
      { name: 'Lists', desc: 'Ordered, mutable collections. append(), pop(), slicing.', example: 'fruits = ["apple", "banana"]\nfruits.append("cherry")\nprint(fruits[0])  # apple\nprint(fruits[:2]) # first two' },
      { name: 'Dicts', desc: 'Key-value stores with fast lookup.', example: 'user = {"name": "Ada", "age": 28}\nprint(user["name"])\nuser["role"] = "dev"' },
      { name: 'If / For / While', desc: 'Control flow uses indentation, not braces. Colon required.', example: 'for i in range(5):\n    if i % 2 == 0:\n        print(f"{i} is even")\n    else:\n        print(f"{i} is odd")' },
    ]},
    { title: 'Functions & Modules', concepts: [
      { name: 'Functions', desc: 'def keyword defines functions. Return values with return.', example: 'def greet(name):\n    return f"Hello, {name}!"\n\nprint(greet("Ada"))' },
      { name: 'List Comprehensions', desc: 'Create lists in one line with [expr for item in iterable if condition].', example: 'squares = [x**2 for x in range(10)]\nevens = [x for x in range(20) if x % 2 == 0]\nprint(squares)\nprint(evens)' },
      { name: 'Importing Modules', desc: 'import brings in libraries. from...import for specific items.', example: 'import math\nprint(math.sqrt(16))\nfrom random import randint\nprint(randint(1, 100))' },
    ]},
  ],
  c: [
    { title: 'C Fundamentals', concepts: [
      { name: 'printf()', desc: 'Print formatted output. Use format specifiers: %d, %s, %f.', example: '#include <stdio.h>\nprintf("Hello, World!\\n");\nprintf("Score: %d\\n", 100);' },
      { name: 'Variables & Types', desc: 'C is statically typed: int, float, double, char. Declare before use.', example: 'int score = 100;\nfloat price = 9.99;\nchar grade = \'A\';\nchar name[] = "Ada";' },
      { name: 'Pointers', desc: '* declares a pointer, & gets address. Foundation of C memory management.', example: 'int x = 42;\nint *ptr = &x;\nprintf("%d\\n", *ptr);  // 42\n*ptr = 100;  // x is now 100' },
    ]},
    { title: 'Functions & Memory', concepts: [
      { name: 'Functions', desc: 'Return type, name, parameters. Must declare before use.', example: 'int add(int a, int b) {\n  return a + b;\n}\nprintf("%d", add(3, 4));' },
      { name: 'Arrays & Strings', desc: 'Arrays are fixed-size. Strings are null-terminated char arrays.', example: 'int nums[] = {1, 2, 3};\nchar name[] = "Ada";\nprintf("%c", name[0]); // A' },
      { name: 'malloc / free', desc: 'Dynamic memory allocation on the heap. Always free what you malloc.', example: 'int *arr = malloc(5 * sizeof(int));\narr[0] = 42;\nfree(arr);' },
    ]},
  ],
  java: [
    { title: 'Java Basics', concepts: [
      { name: 'System.out.println()', desc: 'Print to console. Every Java program needs a main method in a class.', example: 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello!");\n  }\n}' },
      { name: 'Variables & Types', desc: 'Strongly typed: int, double, String, boolean. Primitives vs Objects.', example: 'int score = 100;\ndouble price = 9.99;\nString name = "Ada";\nboolean active = true;' },
      { name: 'Control Flow', desc: 'if/else, for, while, switch. Same syntax as C/C++ family.', example: 'for (int i = 0; i < 5; i++) {\n  if (i % 2 == 0) {\n    System.out.println(i + " even");\n  }\n}' },
    ]},
    { title: 'OOP & Collections', concepts: [
      { name: 'Classes & Objects', desc: 'Everything is in a class. Constructors, methods, access modifiers.', example: 'class Dog {\n  String name;\n  Dog(String n) { name = n; }\n  void bark() {\n    System.out.println(name + " barks!");\n  }\n}' },
      { name: 'ArrayList', desc: 'Dynamic array from java.util. Generics for type safety.', example: 'ArrayList<String> names = new ArrayList<>();\nnames.add("Ada");\nnames.add("Bob");\nSystem.out.println(names.get(0));' },
      { name: 'Interfaces', desc: 'Define contracts. Classes implement them. Multiple allowed.', example: 'interface Drawable {\n  void draw();\n}\nclass Circle implements Drawable {\n  public void draw() {\n    System.out.println("drawing circle");\n  }\n}' },
    ]},
    { title: 'Exceptions & Streams', concepts: [
      { name: 'Try / Catch', desc: 'Handle checked and unchecked exceptions. throws declares exceptions.', example: 'try {\n  int result = 10 / 0;\n} catch (ArithmeticException e) {\n  System.out.println("Error: " + e.getMessage());\n} finally {\n  System.out.println("Done");\n}' },
      { name: 'Streams API', desc: 'Process collections functionally with filter, map, reduce.', example: 'List<Integer> nums = List.of(1, 2, 3, 4, 5);\nint sum = nums.stream()\n  .filter(n -> n % 2 == 0)\n  .mapToInt(n -> n * 2)\n  .sum();\n// sum = 12' },
      { name: 'HashMap', desc: 'Key-value pairs with fast O(1) lookup. Part of java.util.', example: 'HashMap<String, Integer> scores = new HashMap<>();\nscores.put("Ada", 95);\nscores.put("Bob", 87);\nSystem.out.println(scores.get("Ada")); // 95' },
    ]},
  ],
  cpp: [
    { title: 'C++ Fundamentals', concepts: [
      { name: 'cout / cin', desc: 'Output with cout <<, input with cin >>. Include <iostream>.', example: '#include <iostream>\nusing namespace std;\ncout << "Hello!" << endl;\nint x;\ncin >> x;' },
      { name: 'Variables & Types', desc: 'Like C but with string, bool, auto. Strongly typed.', example: 'int score = 100;\ndouble pi = 3.14;\nstd::string name = "Ada";\nbool active = true;\nauto x = 42; // inferred' },
      { name: 'References & Pointers', desc: '& = reference (alias), * = pointer (address). References are safer.', example: 'int x = 10;\nint& ref = x;  // reference\nint* ptr = &x; // pointer\nref = 20; // x is now 20' },
    ]},
    { title: 'Modern C++', concepts: [
      { name: 'Vectors & Range For', desc: 'std::vector is a dynamic array. Range-for iterates easily.', example: 'std::vector<int> nums = {1, 2, 3};\nnums.push_back(4);\nfor (auto n : nums) {\n  cout << n << endl;\n}' },
      { name: 'Classes', desc: 'Like C# classes. Constructors, destructors, access modifiers.', example: 'class Dog {\npublic:\n  string name;\n  Dog(string n) : name(n) {}\n  void bark() { cout << name << " barks!"; }\n};' },
      { name: 'Smart Pointers & Templates', desc: 'unique_ptr/shared_ptr manage memory. Templates enable generics.', example: 'auto p = std::make_unique<int>(42);\ntemplate<typename T>\nT maximum(T a, T b) {\n  return (a > b) ? a : b;\n}' },
    ]},
  ],
  typescript: [
    { title: 'Type System Basics', concepts: [
      { name: 'Type Annotations', desc: 'Add types after variable names with : type. Checked at compile time.', example: 'let name: string = "Ada";\nlet score: number = 100;\nlet active: boolean = true;\nlet items: string[] = ["a", "b"];' },
      { name: 'Interfaces', desc: 'Define object shapes. Properties, optional (?), readonly.', example: 'interface User {\n  name: string;\n  age: number;\n  email?: string; // optional\n}' },
      { name: 'Union & Literal Types', desc: '| for "either/or" types. Literal types restrict to exact values.', example: 'type ID = string | number;\ntype Status = "active" | "inactive";\nlet id: ID = "abc";\nlet s: Status = "active";' },
    ]},
    { title: 'Advanced Types', concepts: [
      { name: 'Generics', desc: 'Type parameters for reusable, type-safe code.', example: 'function identity<T>(value: T): T {\n  return value;\n}\nidentity<string>("hello");\nidentity(42); // inferred' },
      { name: 'Utility Types', desc: 'Built-in type transformers: Partial, Pick, Omit, Record.', example: 'type User = { name: string; age: number };\ntype Partial_User = Partial<User>;\ntype NameOnly = Pick<User, "name">;\ntype Scores = Record<string, number>;' },
      { name: 'Type Guards', desc: 'Narrow types at runtime with typeof, instanceof, in, custom guards.', example: 'function process(value: string | number) {\n  if (typeof value === "string") {\n    console.log(value.toUpperCase());\n  } else {\n    console.log(value.toFixed(2));\n  }\n}' },
    ]},
  ],
  react: [
    { title: 'Components & JSX', concepts: [
      { name: 'Function Components', desc: 'Components are functions returning JSX. Props pass data down.', example: 'function Greeting({ name }) {\n  return <h1>Hello, {name}!</h1>;\n}\n// <Greeting name="Ada" />' },
      { name: 'JSX Expressions', desc: 'Use {} to embed JS expressions. Conditional rendering with ternary.', example: 'function Status({ online }) {\n  return (\n    <span>{online ? "Online" : "Offline"}</span>\n  );\n}' },
      { name: 'Lists & Keys', desc: 'Use .map() to render lists. key prop helps React track items.', example: 'function TodoList({ items }) {\n  return (\n    <ul>\n      {items.map(item =>\n        <li key={item.id}>{item.text}</li>\n      )}\n    </ul>\n  );\n}' },
    ]},
    { title: 'Hooks & State', concepts: [
      { name: 'useState', desc: 'Add state to function components. Returns [value, setter].', example: 'const [count, setCount] = useState(0);\nreturn (\n  <button onClick={() => setCount(count + 1)}>\n    Clicked {count} times\n  </button>\n);' },
      { name: 'useEffect', desc: 'Run side effects after render. Cleanup on unmount.', example: 'useEffect(() => {\n  document.title = `Count: ${count}`;\n  return () => { /* cleanup */ };\n}, [count]); // runs when count changes' },
      { name: 'Custom Hooks', desc: 'Extract reusable logic into use-prefixed functions.', example: 'function useToggle(initial = false) {\n  const [value, setValue] = useState(initial);\n  const toggle = () => setValue(v => !v);\n  return [value, toggle];\n}' },
    ]},
  ],
  sql: [
    { title: 'Queries & Filtering', concepts: [
      { name: 'SELECT', desc: 'Retrieve data from tables. * for all columns, or list specific ones.', example: 'SELECT * FROM users;\nSELECT name, email FROM users;\nSELECT DISTINCT country FROM users;' },
      { name: 'WHERE & Operators', desc: 'Filter rows with conditions. AND, OR, IN, LIKE, BETWEEN.', example: 'SELECT * FROM users WHERE age > 18;\nSELECT * FROM users\n  WHERE country IN ("US", "UK")\n  AND name LIKE "A%";' },
      { name: 'ORDER BY & LIMIT', desc: 'Sort results and limit row count.', example: 'SELECT * FROM users\n  ORDER BY score DESC\n  LIMIT 10;' },
    ]},
    { title: 'Joins & Aggregation', concepts: [
      { name: 'JOINs', desc: 'Combine related tables. INNER, LEFT, RIGHT, FULL.', example: 'SELECT u.name, o.total\nFROM users u\nINNER JOIN orders o\n  ON u.id = o.user_id;' },
      { name: 'GROUP BY & Aggregates', desc: 'Group rows and compute: COUNT, SUM, AVG, MIN, MAX.', example: 'SELECT country, COUNT(*) as total\nFROM users\nGROUP BY country\nHAVING COUNT(*) > 5;' },
      { name: 'INSERT / UPDATE / DELETE', desc: 'Modify data. Always use WHERE with UPDATE/DELETE!', example: 'INSERT INTO users (name, age)\n  VALUES ("Ada", 28);\nUPDATE users SET age = 29\n  WHERE name = "Ada";\nDELETE FROM users\n  WHERE name = "Ada";' },
    ]},
  ],
  rust: [
    { title: 'Rust Fundamentals', concepts: [
      { name: 'Variables & Mutability', desc: 'Immutable by default. Use let mut for mutable. Strong typing.', example: 'let name = "Ada";        // immutable\nlet mut score = 0;       // mutable\nscore = 100;\nlet x: i32 = 42;        // explicit type' },
      { name: 'Ownership & Borrowing', desc: 'Each value has one owner. & borrows without taking ownership.', example: 'let s1 = String::from("hello");\nlet s2 = &s1;  // borrow\nprintln!("{}", s2); // OK\nprintln!("{}", s1); // also OK' },
      { name: 'Match & Enums', desc: 'match is exhaustive pattern matching. Enums can hold data.', example: 'enum Shape {\n  Circle(f64),\n  Rect(f64, f64),\n}\nmatch shape {\n  Shape::Circle(r) => println!("r={}", r),\n  Shape::Rect(w, h) => println!("{}x{}", w, h),\n}' },
    ]},
    { title: 'Traits & Error Handling', concepts: [
      { name: 'Traits', desc: 'Define shared behavior (like interfaces). impl Trait for Type.', example: 'trait Greet {\n  fn hello(&self) -> String;\n}\nimpl Greet for Player {\n  fn hello(&self) -> String {\n    format!("Hi, {}", self.name)\n  }\n}' },
      { name: 'Option & Result', desc: 'No null! Option<T> = Some/None. Result<T,E> = Ok/Err.', example: 'let val: Option<i32> = Some(42);\nmatch val {\n  Some(n) => println!("{}", n),\n  None => println!("nothing"),\n}\n// ? propagates errors\nlet content = std::fs::read_to_string("f.txt")?;' },
      { name: 'Iterators & Closures', desc: 'Lazy iterators chain operations. Closures capture environment.', example: 'let nums = vec![1, 2, 3, 4, 5];\nlet evens: Vec<_> = nums.iter()\n  .filter(|&&n| n % 2 == 0)\n  .map(|&n| n * 10)\n  .collect();\n// [20, 40]' },
    ]},
  ],
  go: [
    { title: 'Go Fundamentals', concepts: [
      { name: 'Hello World', desc: 'Go uses package main and func main(). fmt.Println for output.', example: 'package main\nimport "fmt"\nfunc main() {\n  fmt.Println("Hello, World!")\n}' },
      { name: 'Variables & Types', desc: ':= for short declaration, var for explicit. Strongly typed.', example: 'name := "Ada"        // inferred\nvar score int = 100  // explicit\nconst PI = 3.14\nfmt.Println(name, score)' },
      { name: 'Functions', desc: 'func keyword. Multiple return values are idiomatic in Go.', example: 'func divide(a, b float64) (float64, error) {\n  if b == 0 {\n    return 0, fmt.Errorf("division by zero")\n  }\n  return a / b, nil\n}' },
    ]},
    { title: 'Structs & Concurrency', concepts: [
      { name: 'Structs', desc: 'Custom data types with named fields. Methods attach via receivers.', example: 'type User struct {\n  Name string\n  Age  int\n}\nfunc (u User) Greet() string {\n  return "Hi, " + u.Name\n}' },
      { name: 'Slices & Maps', desc: 'Slices are dynamic arrays. Maps are key-value stores.', example: 'nums := []int{1, 2, 3}\nnums = append(nums, 4)\nscores := map[string]int{\n  "Ada": 95,\n  "Bob": 87,\n}' },
      { name: 'Goroutines & Channels', desc: 'go starts concurrent functions. Channels communicate between goroutines.', example: 'ch := make(chan string)\ngo func() {\n  ch <- "hello"\n}()\nmsg := <-ch\nfmt.Println(msg)' },
    ]},
  ],
  swift: [
    { title: 'Swift Basics', concepts: [
      { name: 'Variables & Constants', desc: 'var for mutable, let for immutable. Type inference or explicit typing.', example: 'let name = "Ada"           // constant\nvar score: Int = 100       // mutable\nvar pi: Double = 3.14\nprint(name, score)' },
      { name: 'Optionals', desc: 'Values that might be nil. Use ? to declare, if let or ?? to unwrap safely.', example: 'var email: String? = nil\nemail = "ada@example.com"\nif let e = email {\n  print("Email: \\(e)")\n}\nlet safe = email ?? "none"' },
      { name: 'Functions', desc: 'func keyword with labeled parameters. Return type after ->.', example: 'func greet(name: String, times: Int = 1) -> String {\n  return String(repeating: "Hello, \\(name)! ", count: times)\n}\nprint(greet(name: "Ada"))' },
    ]},
    { title: 'Collections & OOP', concepts: [
      { name: 'Arrays & Dictionaries', desc: 'Type-safe collections. Arrays are ordered, dictionaries are key-value.', example: 'var fruits = ["apple", "banana"]\nfruits.append("cherry")\nvar scores: [String: Int] = [\n  "Ada": 95, "Bob": 87\n]\nprint(scores["Ada"] ?? 0)' },
      { name: 'Structs & Classes', desc: 'Structs are value types (copied), classes are reference types (shared).', example: 'struct Point {\n  var x: Double\n  var y: Double\n}\nclass Player {\n  var name: String\n  init(name: String) { self.name = name }\n}' },
      { name: 'Enums & Switch', desc: 'Enums can have associated values. Switch must be exhaustive.', example: 'enum Direction {\n  case north, south, east, west\n}\nlet dir = Direction.north\nswitch dir {\n  case .north: print("Going up")\n  default: print("Other")\n}' },
    ]},
  ],
};

const THEMES = {
  green:  { name: 'Matrix Green',  key: 'green' },
  amber:  { name: 'Amber CRT',    key: 'amber' },
  cyan:   { name: 'Cyan Neon',    key: 'cyan' },
  purple: { name: 'Purple Haze',  key: 'purple' },
  red:    { name: 'Red Alert',    key: 'red' },
  pink:   { name: 'Hot Pink',     key: 'pink' },
  blue:   { name: 'Ocean Blue',   key: 'blue' },
  white:  { name: 'Monochrome',   key: 'white' },
};

class SudoQuest {
  constructor() {
    // Game state
    this.currentLevelIndex = 0;
    this.attempts = {};
    this.hintsRevealed = {};
    this.completedLevels = new Set();
    this.commandHistory = [];
    this.historyIndex = -1;
    this.isExecuting = false;

    // Category state
    this.currentCategory = null; // category key
    this.levels = [];            // levels for current category
    this.gameStarted = false;
    this.awaitingReady = false;
    this.awaitingCategory = false;

    // Timer state
    this.sessionStartTime = null;
    this.levelStartTime = null;
    this.levelTimes = {};
    this.timerInterval = null;
    this.timerRunning = false;

    // Git state (persists across commands within a git level)
    this.gitState = null;

    // CMD state (persists across commands within a cmd level)
    this.cmdState = null;

    // Score & achievements
    this.score = {};            // per-level score (100 base, -25 per hint)
    this.personalBests = {};    // per-category best total times
    this.achievements = new Set();
    this.firstTryStreak = 0;

    // Sandbox state
    this.sandboxMode = false;
    this.sandboxCategory = null;
    this.sandboxLessonIndex = 0;
    this.sandboxConceptIndex = 0;

    // Playground state
    this.playgroundMode = false;

    // Streak state
    this.loginDates = [];      // array of 'YYYY-MM-DD' strings
    this.currentStreak = 0;
    this.longestStreak = 0;

    // Daily challenge state
    this.dailyChallengeCompleted = {}; // { 'YYYY-MM-DD': true }

    // Spaced repetition
    this.reviewQueue = [];     // [{catKey, levelId, dueDate}]

    // Tab completion
    this.tabCommands = ['hint','clear','reset','restart','levels','categories','skip','next','theme','help','explain','save','load','achievements','score','learn','sandbox','sound','timestop','stats','playground','streak','daily','review','projects'];

    // DOM elements
    this.output = document.getElementById('output');
    this.input = document.getElementById('input');
    this.runBtn = document.getElementById('run-btn');
    this.levelIndicator = document.getElementById('level-indicator');
    this.progressFill = document.getElementById('progress-fill');
    this.categoryDisplay = document.getElementById('category-display');
    this.timerClock = document.getElementById('timer-clock');
    this.segmentTime = document.getElementById('segment-time');
    this.splitsList = document.getElementById('splits-list');
    this.timerSidebar = document.getElementById('timer-sidebar');
    this.toolbar = document.getElementById('action-toolbar');
    this.scoreDisplay = document.getElementById('score-display');
    this.achievementToast = document.getElementById('achievement-toast');
    this.kbOverlay = document.getElementById('kb-overlay');
    this.hamburger = document.getElementById('hamburger');
    this.mobileDrawer = document.getElementById('mobile-drawer');
    this.mobileOverlay = document.getElementById('mobile-overlay');
    this.musicPanel = document.getElementById('music-panel');
    this.musicToggleBtn = document.getElementById('music-toggle-btn');
    this.musicCloseBtn = document.getElementById('music-close-btn');
    this.musicUrlInput = document.getElementById('music-url-input');
    this.musicLoadBtn = document.getElementById('music-load-btn');
    this.musicEmbedWrap = document.getElementById('music-embed-wrap');
    this.musicVolumeRow = document.getElementById('music-volume-row');
    this.musicVolumeSlider = document.getElementById('music-volume-slider');
    this.musicVolumeValue = document.getElementById('music-volume-value');
    this.musicVolumeIcon = document.getElementById('music-volume-icon');
    this.musicPlayerType = null; // 'youtube' or 'spotify'
    this.ytPlayer = null;       // YouTube iframe reference
    this.musicVolume = 80;      // default volume

    if (!this.input || !this.output) {
      console.error('Required DOM elements not found');
      return;
    }

    this.init();
  }

  // ── Initialization ──────────────────────────────────────────

  init() {
    this.loadTheme();
    this.loadProgress();
    this.recordLogin();
    this.setupEventListeners();
    this.setupMobileViewport();
    this.setupTimerDisplay();
    if (this.gameStarted && this.currentCategory) {
      this.levels = getLevelsForCategory(this.currentCategory);
      // Clamp index to valid range (guards against stale/corrupt localStorage)
      if (this.currentLevelIndex < 0 || this.currentLevelIndex >= this.levels.length) {
        this.currentLevelIndex = 0;
      }
      this.showTimerSidebar(true);
      this.startTimer();
      this.renderSplits();
      this.loadLevel(this.currentLevelIndex);
    } else {
      this.showTimerSidebar(false);
      this.showReadyScreen();
    }
  }

  setupEventListeners() {
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !this.isExecuting) {
        e.preventDefault();
        this.handleInput();
      }
      if (e.key === 'ArrowUp' && !e.shiftKey) {
        e.preventDefault();
        this.navigateHistory(-1);
      }
      if (e.key === 'ArrowDown' && !e.shiftKey) {
        e.preventDefault();
        this.navigateHistory(1);
      }
    });

    // Auto-resize textarea
    this.input.addEventListener('input', () => {
      this.input.style.height = 'auto';
      this.input.style.height = Math.min(this.input.scrollHeight, 120) + 'px';
    });

    this.runBtn.addEventListener('click', () => {
      if (!this.isExecuting) this.handleInput();
    });

    this.output.addEventListener('click', () => this.input.focus());

    if (this.toolbar) {
      this.toolbar.addEventListener('click', (e) => {
        const btn = e.target.closest('.toolbar-btn');
        if (!btn) return;
        const cmd = btn.dataset.cmd;
        if (cmd && !this.isExecuting) {
          this.addLine(`$ ${cmd}`, 'command');
          this.handleSpecialCommand(cmd);
        }
      });
    }

    // Tab completion
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        this.handleTabComplete();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        this.clearTerminal();
        if (this.gameStarted) this.loadLevel(this.currentLevelIndex, true);
      }
      // Ctrl+/ or ? for keyboard overlay
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        this.toggleKbOverlay();
      }
      if (e.key === 'Escape' && this.kbOverlay && !this.kbOverlay.hidden) {
        this.kbOverlay.hidden = true;
      }
      if (e.key === 'Escape' && this.mobileDrawer?.classList.contains('open')) {
        this.closeMobileDrawer();
      }
    });

    // Keyboard overlay click-to-close
    if (this.kbOverlay) {
      this.kbOverlay.addEventListener('click', (e) => {
        if (e.target === this.kbOverlay) this.kbOverlay.hidden = true;
      });
    }

    // Mobile hamburger
    if (this.hamburger) {
      this.hamburger.addEventListener('click', () => this.toggleMobileDrawer());
    }
    if (this.mobileOverlay) {
      this.mobileOverlay.addEventListener('click', () => this.closeMobileDrawer());
    }
    if (this.mobileDrawer) {
      this.mobileDrawer.addEventListener('click', (e) => {
        const btn = e.target.closest('.drawer-btn');
        if (!btn) return;
        const cmd = btn.dataset.cmd;
        if (cmd && !this.isExecuting) {
          this.closeMobileDrawer();
          this.addLine(`$ ${cmd}`, 'command');
          this.handleSpecialCommand(cmd);
        }
      });
    }

    // Music panel
    if (this.musicToggleBtn) {
      this.musicToggleBtn.addEventListener('click', () => this.toggleMusicPanel());
    }
    if (this.musicCloseBtn) {
      this.musicCloseBtn.addEventListener('click', () => this.toggleMusicPanel(false));
    }
    if (this.musicLoadBtn) {
      this.musicLoadBtn.addEventListener('click', () => this.loadMusicUrl());
    }
    if (this.musicUrlInput) {
      this.musicUrlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); this.loadMusicUrl(); }
        e.stopPropagation();
      });
      this.musicUrlInput.addEventListener('input', (e) => e.stopPropagation());
    }

    // Volume slider
    if (this.musicVolumeSlider) {
      try {
        const savedVol = localStorage.getItem('sudoquest_music_volume');
        if (savedVol !== null) {
          this.musicVolume = parseInt(savedVol, 10);
          this.musicVolumeSlider.value = this.musicVolume;
          if (this.musicVolumeValue) this.musicVolumeValue.textContent = this.musicVolume + '%';
        }
      } catch (_) {}
      this.musicVolumeSlider.addEventListener('input', (e) => {
        e.stopPropagation();
        this.musicVolume = parseInt(e.target.value, 10);
        if (this.musicVolumeValue) this.musicVolumeValue.textContent = this.musicVolume + '%';
        this.applyMusicVolume();
        try { localStorage.setItem('sudoquest_music_volume', String(this.musicVolume)); } catch (_) {}
      });
    }
    if (this.musicVolumeIcon) {
      this.musicVolumeIcon.addEventListener('click', () => {
        if (this.musicVolume > 0) {
          this._preMuteVolume = this.musicVolume;
          this.musicVolume = 0;
        } else {
          this.musicVolume = this._preMuteVolume || 80;
        }
        if (this.musicVolumeSlider) this.musicVolumeSlider.value = this.musicVolume;
        if (this.musicVolumeValue) this.musicVolumeValue.textContent = this.musicVolume + '%';
        this.applyMusicVolume();
        try { localStorage.setItem('sudoquest_music_volume', String(this.musicVolume)); } catch (_) {}
      });
    }
  }

  // ── Mobile Viewport (virtual keyboard) ─────────────────────

  setupMobileViewport() {
    // Compensate for mobile virtual keyboard pushing content up
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => {
        const keyboardOpen = window.visualViewport.height < window.innerHeight * 0.75;
        if (keyboardOpen && document.activeElement === this.input) {
          // Scroll input into view after keyboard settles
          setTimeout(() => {
            this.input.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 50);
        }
      });
    }

    // Ensure input stays visible when focused on mobile
    this.input.addEventListener('focus', () => {
      if (window.innerWidth <= 768) {
        setTimeout(() => {
          this.input.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 300);
      }
    });
  }

  // ── Ready Screen ──────────────────────────────────────────

  showReadyScreen() {
    this.clearTerminal();
    const art = `
 ╔═╗ ╦ ╦ ╔╦╗ ╔═╗   ╔═╗ ╦ ╦ ╔═╗ ╔═╗ ╔╦╗
 ╚═╗ ║ ║  ║║ ║ ║   ║ ║ ║ ║ ║╣  ╚═╗  ║
 ╚═╝ ╚═╝ ═╩╝ ╚═╝   ╚╩╝ ╚═╝ ╚═╝ ╚═╝  ╩`;

    this.addHTML(`<pre class="ascii-art">${art}</pre>`, 'system');
    this.addBlank();
    this.addLine('Welcome to sudo quest! Learn to code, one command at a time.', 'system');
    this.addBlank();
    this.addLine('New here? Type "learn" to start the guided sandbox.', 'hint');
    this.addLine('Type "playground" for a free JS REPL, "daily" for today\'s challenge.', 'hint');
    if (this.currentStreak > 1) {
      this.addLine(`Login streak: ${this.currentStreak} days!`, 'success');
    }
    const dueReviews = this.getDueReviews();
    if (dueReviews.length) {
      this.addLine(`${dueReviews.length} review${dueReviews.length > 1 ? 's' : ''} due — type "review" to practice.`, 'hint');
    }
    this.addBlank();
    this.addLine('Are you ready?  (y/n)', 'question');
    this.addBlank();
    this.awaitingReady = true;
  }

  showCategoryScreen() {
    this.clearTerminal();
    this.addLine('Choose a category:', 'question');
    this.addBlank();
    CATEGORIES.forEach((cat) => {
      const count = cat.levels.length;
      const completed = cat.levels.filter(l => this.completedLevels.has(l.id)).length;
      const pct = Math.round((completed / count) * 100);
      const status = completed === count ? ' \u2713 COMPLETE' : completed > 0 ? ` ${completed}/${count}` : '';
      this.addLine(`  ${cat.key.padEnd(8)} \u2014 ${cat.name} (${count} levels)${status}`, 'system');
      // Visual progress bar
      if (completed > 0) {
        const barWidth = 20;
        const filled = Math.round((completed / count) * barWidth);
        const empty = barWidth - filled;
        const bar = `           [${'█'.repeat(filled)}${'░'.repeat(empty)}] ${pct}%`;
        this.addLine(bar, completed === count ? 'success' : 'dim');
      }
    });
    this.addBlank();
    this.addLine('Type a category name to begin (e.g. "js", "git", "html"):', 'dim');
    this.addBlank();
    this.awaitingCategory = true;
  }

  handleReadyInput(input) {
    if (input === 'learn' || input === 'sandbox') {
      this.awaitingReady = false;
      this.enterSandbox();
      return true;
    }
    if (input === 'playground') {
      this.awaitingReady = false;
      this.enterPlayground();
      return true;
    }
    if (input === 'stats') { this.showStats(); return true; }
    if (input === 'streak') { this.showStreak(); return true; }
    if (input === 'daily') { this.showDailyChallenge(); return true; }
    if (input === 'review') { this.showReview(); return true; }
    if (input === 'y' || input === 'yes') {
      this.awaitingReady = false;
      this.showCategoryScreen();
      return true;
    }
    if (input === 'n' || input === 'no') {
      this.addLine('Take your time. Type "y" when ready!', 'dim');
      return true;
    }
    return false;
  }

  handleCategoryInput(input) {
    const cat = getCategoryByKey(input);
    if (cat) {
      this.awaitingCategory = false;
      this.currentCategory = input;
      this.levels = cat.levels;
      this.gameStarted = true;

      // Resume from first incomplete level, or start at 0
      const resumeIndex = cat.levels.findIndex(l => !this.completedLevels.has(l.id));
      this.currentLevelIndex = resumeIndex >= 0 ? resumeIndex : 0;

      // Reset timer for new category
      this.levelTimes = {};
      this.showTimerSidebar(true);
      this.startTimer();
      this.renderSplits();
      this.clearTerminal();
      const completed = cat.levels.filter(l => this.completedLevels.has(l.id)).length;
      if (completed > 0) {
        this.addLine(`Resuming ${cat.name} (${completed}/${cat.levels.length} completed)...`, 'system');
      } else {
        this.addLine(`Starting ${cat.name}...`, 'system');
      }
      this.addBlank();
      this.loadLevel(this.currentLevelIndex);
      this.saveProgress();
      return true;
    }
    // Don't show error for known special commands — let them fall through
    return false;
  }

  // ── Progress Persistence ────────────────────────────────────

  saveProgress() {
    const data = {
      currentLevelIndex: this.currentLevelIndex,
      completedLevels: [...this.completedLevels],
      attempts: this.attempts,
      hintsRevealed: this.hintsRevealed,
      levelTimes: this.levelTimes,
      currentCategory: this.currentCategory,
      gameStarted: this.gameStarted,
      score: this.score,
      personalBests: this.personalBests,
      achievements: [...this.achievements],
      loginDates: this.loginDates,
      currentStreak: this.currentStreak,
      longestStreak: this.longestStreak,
      dailyChallengeCompleted: this.dailyChallengeCompleted,
      reviewQueue: this.reviewQueue,
      firstTryStreak: this.firstTryStreak
    };
    try {
      localStorage.setItem('sudoquest_progress', JSON.stringify(data));
    } catch (_) {}
  }

  loadProgress() {
    try {
      const data = JSON.parse(localStorage.getItem('sudoquest_progress'));
      if (data) {
        this.currentLevelIndex = data.currentLevelIndex || 0;
        this.completedLevels = new Set(data.completedLevels || []);
        this.attempts = data.attempts || {};
        this.hintsRevealed = data.hintsRevealed || {};
        this.levelTimes = data.levelTimes || {};
        this.currentCategory = data.currentCategory || null;
        this.gameStarted = data.gameStarted || false;
        this.score = data.score || {};
        this.personalBests = data.personalBests || {};
        this.achievements = new Set(data.achievements || []);
        this.loginDates = data.loginDates || [];
        this.currentStreak = data.currentStreak || 0;
        this.longestStreak = data.longestStreak || 0;
        this.dailyChallengeCompleted = data.dailyChallengeCompleted || {};
        this.reviewQueue = data.reviewQueue || [];
        this.firstTryStreak = data.firstTryStreak || 0;
      }
    } catch (_) {}
  }

  // ── Command History ─────────────────────────────────────────

  navigateHistory(dir) {
    if (!this.commandHistory.length) return;
    this.historyIndex += dir;
    if (this.historyIndex < 0) { this.historyIndex = -1; this.input.value = ''; return; }
    if (this.historyIndex >= this.commandHistory.length) this.historyIndex = this.commandHistory.length - 1;
    this.input.value = this.commandHistory[this.commandHistory.length - 1 - this.historyIndex] || '';
  }

  // ── Terminal Output ─────────────────────────────────────────

  addLine(text, type = 'default') {
    const line = document.createElement('div');
    line.className = `line line-${type}`;
    line.textContent = text;
    this.output.appendChild(line);
    this.scrollToBottom();
  }

  addHTML(html, type = 'default') {
    const line = document.createElement('div');
    line.className = `line line-${type}`;
    line.innerHTML = html;
    this.output.appendChild(line);
    this.scrollToBottom();
  }

  addBlank() {
    const line = document.createElement('div');
    line.className = 'line';
    line.innerHTML = '&nbsp;';
    this.output.appendChild(line);
    this.scrollToBottom();
  }

  scrollToBottom() {
    this.output.scrollTop = this.output.scrollHeight;
  }

  clearTerminal() {
    this.output.innerHTML = '';
  }

  // ── Level Display ───────────────────────────────────────────

  loadLevel(index, quiet = false) {
    const level = this.levels[index];
    if (!level) return;

    if (level.type === 'git') this.gitState = this.createInitialGitState();
    if (level.type === 'cmd') this.cmdState = this.createInitialCmdState();

    this.updateHeader(level);
    this.renderSplits();

    // Init score for this level
    if (!this.score[level.id]) this.score[level.id] = 100;
    this.updateScoreDisplay();

    if (!quiet) {
      const bar = '\u2550'.repeat(56);
      const stars = this.getDifficulty(index, this.levels.length);
      const diffLabel = ['Easy','Medium','Hard'][stars - 1];
      this.addLine(`\u2554${bar}\u2557`, 'level-header');
      const title = `  LEVEL ${index + 1}: ${level.title}`;
      const cat = `  Category: ${level.category}  |  ${'*'.repeat(stars)} ${diffLabel}`;
      this.addLine(`\u2551${title.padEnd(56)}\u2551`, 'level-header');
      this.addLine(`\u2551${cat.padEnd(56)}\u2551`, 'level-header');
      this.addLine(`\u255A${bar}\u255D`, 'level-header');
      this.addBlank();
      this.addLine(`> ${level.question}`, 'question');
      this.addBlank();

      const id = level.id;
      const hintsUsed = this.hintsRevealed[id] || 0;
      this.addLine(hintsUsed > 0
        ? `Type 'hint' for help (${hintsUsed}/3 hints revealed).`
        : "Type 'hint' if you need help (0/3 hints used).", 'dim');

      // Show multi-line tip for questions that might need it
      if (level.type !== 'git' && level.type !== 'cmd') {
        this.addLine("Shift+Enter for new line.", 'dim');
      }
      this.addLine('\u2500'.repeat(58), 'dim');
    }

    this.input.focus();
  }

  updateHeader(level) {
    const total = this.levels.length;
    const levelNum = this.currentLevelIndex + 1;
    const completed = this.levels.filter(l => this.completedLevels.has(l.id)).length;
    const pct = Math.round((completed / total) * 100);
    if (this.levelIndicator) this.levelIndicator.textContent = `Level ${levelNum}/${total} (${pct}%)`;
    if (this.progressFill) {
      this.progressFill.style.width = `${pct}%`;
    }
    if (this.categoryDisplay) this.categoryDisplay.textContent = level.category;
  }

  // ── Input Handling ──────────────────────────────────────────

  async handleInput() {
    const raw = this.input.value;
    const trimmed = raw.trim();
    this.input.value = '';
    this.input.style.height = 'auto';

    if (!trimmed) return;

    // Save to history
    if (this.commandHistory[this.commandHistory.length - 1] !== trimmed) {
      this.commandHistory.push(trimmed);
      if (this.commandHistory.length > 100) this.commandHistory.shift();
    }
    this.historyIndex = -1;

    // Show command (truncate display for multi-line)
    const display = trimmed.includes('\n') ? trimmed.split('\n')[0] + ' ...' : trimmed;
    this.addLine(`$ ${display}`, 'command');

    // Ready/Category screens
    const lower = trimmed.toLowerCase();
    if (this.playgroundMode) { this.handlePlaygroundInput(trimmed); return; }
    if (this.sandboxMode) { this.handleSandboxInput(trimmed); return; }
    if (this.awaitingReady) {
      if (this.handleReadyInput(lower)) return;
      // Fall through to special commands
    }
    if (this.awaitingCategory) {
      if (this.handleCategoryInput(lower)) return;
      // Fall through to special commands
    }

    // Special commands
    if (this.handleSpecialCommand(lower)) return;

    // If still on ready/category screen, show hint instead of trying to execute code
    if (this.awaitingReady) {
      this.addLine('Type "y" to start, or "help" for available commands.', 'dim');
      return;
    }
    if (this.awaitingCategory) {
      this.addLine(`Unknown category "${lower}". Type one of: ${CATEGORIES.map(c => c.key).join(', ')}`, 'error');
      return;
    }

    // Execute
    this.isExecuting = true;
    this.runBtn.textContent = '...';
    this.runBtn.disabled = true;

    try {
      const level = this.levels[this.currentLevelIndex];
      if (!level) return;

      switch (level.type) {
        case 'git':
          await this.executeGit(trimmed, level);
          break;
        case 'cmd':
          await this.executeCmd(trimmed, level);
          break;
        case 'html':
        case 'css':
        case 'csharp':
        case 'python':
        case 'c':
        case 'java':
        case 'cpp':
        case 'typescript':
        case 'react':
        case 'sql':
        case 'rust':
          await this.executeText(trimmed, level);
          break;
        default: // js
          await this.executeJS(trimmed, level);
      }
    } catch (err) {
      this.addLine(`Error: ${err.message}`, 'error');
    } finally {
      this.isExecuting = false;
      this.runBtn.textContent = 'RUN';
      this.runBtn.disabled = false;
      this.input.focus();
    }
  }

  handleSpecialCommand(cmd) {
    if (this.isExecuting) return false;
    const commands = {
      help: () => this.showHelp(),
      hint: () => this.revealHint(),
      clear: () => { this.clearTerminal(); this.loadLevel(this.currentLevelIndex, true); },
      reset: () => this.resetLevel(),
      restart: () => this.restartGame(),
      levels: () => this.showLevels(),
      categories: () => { this.gameStarted = false; this.showTimerSidebar(false); this.showCategoryScreen(); },
      skip: () => this.skipLevel(),
      next: () => this.skipLevel(),
      explain: () => this.showExplain(),
      save: () => this.exportProgress(),
      achievements: () => this.showAchievements(),
      score: () => this.showScore(),
      '?': () => this.toggleKbOverlay(),
      learn: () => this.enterSandbox(),
      sandbox: () => this.enterSandbox(),
      sound: () => this.toggleSound(),
      timestop: () => this.toggleTimer(),
      stats: () => this.showStats(),
      playground: () => this.enterPlayground(),
      streak: () => this.showStreak(),
      daily: () => this.showDailyChallenge(),
      review: () => this.showReview(),
      projects: () => this.showProjects(),
    };

    const run = (fn) => {
      this.isExecuting = true;
      try { fn(); } finally { this.isExecuting = false; }
      return true;
    };

    if (commands[cmd]) return run(commands[cmd]);

    if (cmd.startsWith('level ')) {
      const num = parseInt(cmd.split(' ')[1]);
      if (!isNaN(num)) return run(() => this.jumpToLevel(num));
    }
    if (cmd === 'theme' || cmd.startsWith('theme ')) {
      return run(() => this.handleThemeCommand(cmd.slice(5).trim()));
    }
    if (cmd.startsWith('load ')) {
      return run(() => this.importProgress(cmd.slice(5).trim()));
    }
    return false;
  }

  // ── Special Commands ────────────────────────────────────────

  showHelp() {
    this.addBlank();
    this.addLine('\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557', 'system');
    this.addLine('\u2551             AVAILABLE COMMANDS             \u2551', 'system');
    this.addLine('\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563', 'system');
    const cmds = [
      ['hint',         'Reveal next hint (-25 pts)'],
      ['explain',      'Concept deep-dive'],
      ['clear',        'Clear terminal'],
      ['reset',        'Reset current level'],
      ['restart',      'Restart everything'],
      ['levels',       'Show all levels'],
      ['categories',   'Pick a new category'],
      ['level N',      'Jump to level N'],
      ['skip',         'Skip to next level'],
      ['theme',        'Change color theme'],
      ['save',         'Export progress'],
      ['load <data>',  'Import progress'],
      ['achievements', 'View badges'],
      ['score',        'Score summary'],
      ['stats',        'Progress dashboard'],
      ['learn',        'Learning sandbox'],
      ['playground',   'JS code playground'],
      ['streak',       'Login streak calendar'],
      ['daily',        'Daily challenge'],
      ['review',       'Spaced review queue'],
      ['projects',     'Mini-project tracker'],
      ['sound',        'Toggle sound fx'],
      ['timestop',     'Pause/resume timer'],
      ['?',            'Keyboard shortcuts'],
      ['help',         'Show this help'],
    ];
    cmds.forEach(([c, d]) => {
      this.addLine(`\u2551  ${c.padEnd(14)}\u2014 ${d.padEnd(26)}\u2551`, 'system');
    });
    this.addLine('\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D', 'system');
    this.addLine('Shift+Enter for multi-line input.', 'dim');
    this.addBlank();
  }

  // ── Theme System ────────────────────────────────────────────

  loadTheme() {
    try {
      const saved = localStorage.getItem('sudoquest_theme');
      if (saved && THEMES[saved]) this.applyTheme(saved);
    } catch (_) {}
  }

  applyTheme(key) {
    if (key === 'green') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', key);
    }
    try { localStorage.setItem('sudoquest_theme', key); } catch (_) {}
  }

  handleThemeCommand(args) {
    const name = args.trim().toLowerCase();
    if (!name) {
      this.addBlank();
      this.addLine('Available themes:', 'system');
      Object.values(THEMES).forEach(t => {
        this.addLine(`  ${t.key.padEnd(10)} — ${t.name}`, 'system');
      });
      this.addBlank();
      this.addLine('Usage: theme <name>  (e.g. "theme cyan")', 'dim');
      this.addBlank();
      return;
    }
    if (THEMES[name]) {
      this.applyTheme(name);
      this.addLine(`Theme set to ${THEMES[name].name}.`, 'success');
    } else {
      this.addLine(`Unknown theme "${name}". Type "theme" to see options.`, 'error');
    }
  }

  revealHint() {
    const level = this.levels[this.currentLevelIndex];
    if (!level) return;
    const id = level.id;
    const revealed = this.hintsRevealed[id] || 0;

    if (revealed >= 3) {
      this.addLine('All hints revealed:', 'dim');
      level.hints.forEach((h, i) => this.addLine(`  ${i === 2 ? 'ANSWER' : `Hint ${i + 1}`}: ${h}`, 'hint'));
      return;
    }

    if ((this.attempts[id] || 0) < 1 && revealed === 0) {
      this.addLine('Try at least once before asking for a hint!', 'dim');
      return;
    }

    this.hintsRevealed[id] = revealed + 1;
    // Deduct score for hint
    if (!this.score[id]) this.score[id] = 100;
    this.score[id] = Math.max(0, this.score[id] - 25);
    this.updateScoreDisplay();

    const prefix = revealed === 2 ? 'ANSWER' : `Hint ${revealed + 1}`;
    this.addBlank();
    this.addLine(`\uD83D\uDCA1 ${prefix}: ${level.hints[revealed]}`, 'hint');
    this.addLine(`  Score: ${this.score[id]} pts (-25 for hint)`, 'dim');
    this.addBlank();
    this.saveProgress();
  }

  resetLevel() {
    const level = this.levels[this.currentLevelIndex];
    if (!level) return;
    this.attempts[level.id] = 0;
    this.hintsRevealed[level.id] = 0;
    if (level.type === 'git') this.gitState = this.createInitialGitState();
    if (level.type === 'cmd') this.cmdState = this.createInitialCmdState();
    this.clearTerminal();
    this.addLine('[SYSTEM] Level reset.', 'dim');
    this.addBlank();
    this.loadLevel(this.currentLevelIndex);
    this.saveProgress();
  }

  restartGame() {
    // Stop timer
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerRunning = false;

    // Reset all state
    this.currentLevelIndex = 0;
    this.attempts = {};
    this.hintsRevealed = {};
    this.completedLevels = new Set();
    this.levelTimes = {};
    this.currentCategory = null;
    this.levels = [];
    this.gameStarted = false;
    this.sessionStartTime = null;
    this.levelStartTime = null;
    this.score = {};
    this.firstTryStreak = 0;
    this.dailyChallengeCompleted = {};
    this.reviewQueue = [];
    // Keep loginDates/streaks — those are persistent across restarts

    // Reset display
    if (this.timerClock) this.timerClock.textContent = '0:00.00';
    if (this.segmentTime) this.segmentTime.textContent = '0:00.00';
    if (this.splitsList) this.splitsList.innerHTML = '';
    if (this.progressFill) this.progressFill.style.width = '0%';

    this.showTimerSidebar(false);
    this.saveProgress();
    this.showReadyScreen();
  }

  showLevels() {
    this.addBlank();
    let lastCat = '';
    this.levels.forEach((l, i) => {
      if (l.category !== lastCat) {
        lastCat = l.category;
        this.addLine(`  \u2500\u2500 ${l.category} \u2500\u2500`, 'level-header');
      }
      const done = this.completedLevels.has(l.id);
      const current = i === this.currentLevelIndex;
      const marker = done ? '\u2713' : current ? '>' : ' ';
      const status = done ? 'success' : current ? 'question' : 'dim';
      const time = this.levelTimes[l.id] ? ` (${this.formatTime(this.levelTimes[l.id])})` : '';
      this.addLine(`  ${marker} Level ${i + 1}: ${l.title}${time}`, status);
    });
    this.addBlank();
    this.addLine('Type "level N" to jump to a level (1-' + this.levels.length + ').', 'dim');
    this.addBlank();
  }

  skipLevel() {
    if (this.currentLevelIndex < this.levels.length - 1) {
      this.currentLevelIndex++;
      this.levelStartTime = Date.now();
      this.addBlank();
      this.addLine('[SYSTEM] Skipping to next level...', 'dim');
      this.addBlank();
      this.loadLevel(this.currentLevelIndex);
      this.saveProgress();
    } else {
      this.addLine("You're on the last level!", 'dim');
    }
  }

  jumpToLevel(num) {
    // Accept 1-based level number within category
    const idx = num - 1;
    if (idx < 0 || idx >= this.levels.length) {
      this.addLine(`Level ${num} not found. Valid range: 1-${this.levels.length}. Type 'levels' to see all.`, 'error');
      return;
    }
    this.currentLevelIndex = idx;
    this.levelStartTime = Date.now();
    this.clearTerminal();
    this.loadLevel(this.currentLevelIndex);
    this.saveProgress();
  }

  // ── JavaScript Execution ────────────────────────────────────

  async executeJS(code, level) {
    const result = await this.runInSandbox(code);

    if (result.consoleLogs?.length) {
      result.consoleLogs.forEach(log => this.addLine(log, 'output'));
    }

    if (result.errors?.length) {
      result.errors.forEach(err => this.addLine(`Error: ${err}`, 'error'));
    }

    const validation = level.validate(code, result);
    validation.passed ? this.onLevelPassed(level) : this.onLevelFailed(level, validation.feedback);
  }

  async runInSandbox(code, timeout = 3000) {
    return new Promise((resolve) => {
      let worker;
      try {
        worker = new Worker('workers/sandbox-worker.js');
      } catch (_) {
        resolve(this.executeInline(code));
        return;
      }

      const timer = setTimeout(() => {
        worker.terminate();
        resolve({ variables: {}, functions: {}, consoleLogs: [], errors: ['Code timed out \u2014 possible infinite loop.'], timeout: true });
      }, timeout);

      worker.onmessage = (e) => { clearTimeout(timer); worker.terminate(); resolve(e.data); };
      worker.onerror = (e) => { clearTimeout(timer); worker.terminate(); resolve({ variables: {}, functions: {}, consoleLogs: [], errors: [e.message || 'Execution error'], timeout: false }); };
      worker.postMessage({ code, requestId: Date.now().toString() });
    });
  }

  executeInline(code) {
    const logs = [];
    const mockConsole = {
      log: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '))
    };
    try {
      const names = new Set();
      for (const m of code.matchAll(/(?:var|let|const)\s+([a-zA-Z_$]\w*)/g)) names.add(m[1]);
      for (const m of code.matchAll(/function\s+([a-zA-Z_$]\w*)/g)) names.add(m[1]);

      const captures = [...names].map(n => `try{__v["${n}"]=${n};__t["${n}"]=typeof ${n}}catch(_){}`).join(';');
      const wrapped = `var console=arguments[0];${code};var __v={},__t={};${captures};return{v:__v,t:__t}`;
      const fn = new Function(wrapped);
      const r = fn(mockConsole);

      const variables = {}, functions = {};
      for (const k in r.v) {
        if (r.t[k] === 'function') functions[k] = true;
        else variables[k] = r.v[k];
      }
      return { variables, functions, consoleLogs: logs, errors: [], timeout: false };
    } catch (e) {
      return { variables: {}, functions: {}, consoleLogs: logs, errors: [e.message], timeout: false };
    }
  }

  // ── Text Execution (HTML/CSS/C#) ────────────────────────────

  async executeText(code, level) {
    // Show the user's code
    code.split('\n').forEach(line => this.addLine(line, 'output'));

    const validation = level.validate(code);
    validation.passed ? this.onLevelPassed(level) : this.onLevelFailed(level, validation.feedback);
  }

  // ── CMD Execution ──────────────────────────────────────────

  createInitialCmdState() {
    return {
      cwd: '~',
      files: {},
      dirs: new Set(['~', '~/Documents', '~/Downloads']),
      env: { USER: 'coder', HOME: '~', PATH: '/usr/bin:/bin' },
      output: [],
      history: []
    };
  }

  async executeCmd(input, level) {
    if (!this.cmdState) this.cmdState = this.createInitialCmdState();
    this.cmdState.history.push(input);

    const result = this.executeCmdCommand(input);
    if (result.error) {
      this.addLine(result.error, 'error');
    } else if (result.output) {
      result.output.split('\n').forEach(line => this.addLine(line, 'output'));
    }

    const validation = level.validate(input, this.cmdState);
    if (validation.passed) {
      this.onLevelPassed(level);
    } else if (!result.error) {
      sound.playWrongAnswer();
      this.addLine(validation.feedback, 'dim');
    }
  }

  executeCmdCommand(input) {
    const trimmed = input.trim();
    const s = this.cmdState;

    // Handle pipes (basic)
    if (trimmed.includes(' | ')) {
      const parts = trimmed.split(' | ').map(p => p.trim());
      let lastOutput = '';
      for (const part of parts) {
        const r = this.executeSingleCmd(part, lastOutput);
        if (r.error) return r;
        lastOutput = r.output || '';
      }
      return { output: lastOutput };
    }

    // Handle redirect > and >>
    const appendMatch = trimmed.match(/^(.+?)\s*>>\s*(\S+)$/);
    if (appendMatch) {
      const r = this.executeSingleCmd(appendMatch[1].trim());
      if (r.error) return r;
      const path = this.resolvePath(appendMatch[2]);
      s.files[path] = (s.files[path] || '') + (r.output || '') + '\n';
      return { output: '' };
    }

    const redirectMatch = trimmed.match(/^(.+?)\s*>\s*(\S+)$/);
    if (redirectMatch) {
      const r = this.executeSingleCmd(redirectMatch[1].trim());
      if (r.error) return r;
      const path = this.resolvePath(redirectMatch[2]);
      s.files[path] = (r.output || '') + '\n';
      return { output: '' };
    }

    return this.executeSingleCmd(trimmed);
  }

  executeSingleCmd(input, pipeInput) {
    const parts = this.parseShellArgs(input);
    const cmd = parts[0];
    const args = parts.slice(1);
    const s = this.cmdState;

    switch (cmd) {
      case 'echo': {
        // Check for env var
        if (args[0]?.startsWith('$')) {
          const varName = args[0].substring(1);
          return { output: s.env[varName] || '' };
        }
        return { output: args.join(' ') };
      }
      case 'pwd':
        return { output: s.cwd };
      case 'whoami':
        return { output: s.env.USER || 'coder' };
      case 'ls': {
        const target = args[0] ? this.resolvePath(args[0]) : s.cwd;
        const items = [];
        // List dirs
        for (const d of s.dirs) {
          const parent = d.substring(0, d.lastIndexOf('/')) || '~';
          if (parent === target && d !== target) items.push(d.split('/').pop() + '/');
        }
        // List files
        for (const f in s.files) {
          const parent = f.substring(0, f.lastIndexOf('/')) || '~';
          if (parent === target) items.push(f.split('/').pop());
        }
        return { output: items.length ? items.join('  ') : '' };
      }
      case 'cd': {
        if (!args[0] || args[0] === '~') { s.cwd = '~'; return { output: '' }; }
        if (args[0] === '..') {
          s.cwd = s.cwd.substring(0, s.cwd.lastIndexOf('/')) || '~';
          return { output: '' };
        }
        const target = this.resolvePath(args[0]);
        if (s.dirs.has(target)) { s.cwd = target; return { output: '' }; }
        return { error: `cd: no such directory: ${args[0]}` };
      }
      case 'mkdir': {
        const recursive = args[0] === '-p';
        const dirName = recursive ? args[1] : args[0];
        if (!dirName) return { error: 'mkdir: missing operand' };
        if (recursive) {
          const parts = dirName.split('/');
          let current = s.cwd;
          for (const part of parts) {
            current = current === '~' ? `~/${part}` : `${current}/${part}`;
            s.dirs.add(current);
          }
        } else {
          s.dirs.add(this.resolvePath(dirName));
        }
        return { output: '' };
      }
      case 'touch': {
        if (!args[0]) return { error: 'touch: missing operand' };
        const path = this.resolvePath(args[0]);
        if (!(path in s.files)) s.files[path] = '';
        return { output: '' };
      }
      case 'cat': {
        if (!args[0]) return { output: pipeInput || '' };
        const path = this.resolvePath(args[0]);
        if (path in s.files) return { output: s.files[path] };
        return { error: `cat: ${args[0]}: No such file or directory` };
      }
      case 'cp': {
        if (args.length < 2) return { error: 'cp: missing operand' };
        const src = this.resolvePath(args[0]);
        const dest = this.resolvePath(args[1]);
        if (!(src in s.files)) return { error: `cp: cannot stat '${args[0]}': No such file` };
        // If dest is a directory, put file inside it
        const destPath = s.dirs.has(dest) ? `${dest}/${args[0].split('/').pop()}` : dest;
        s.files[destPath] = s.files[src];
        return { output: '' };
      }
      case 'mv': {
        if (args.length < 2) return { error: 'mv: missing operand' };
        const src = this.resolvePath(args[0]);
        const dest = this.resolvePath(args[1]);
        if (!(src in s.files)) return { error: `mv: cannot stat '${args[0]}': No such file` };
        const destPath = s.dirs.has(dest) ? `${dest}/${args[0].split('/').pop()}` : dest;
        s.files[destPath] = s.files[src];
        delete s.files[src];
        return { output: '' };
      }
      case 'rm': {
        if (!args[0]) return { error: 'rm: missing operand' };
        const path = this.resolvePath(args[0]);
        if (path in s.files) { delete s.files[path]; return { output: '' }; }
        return { error: `rm: cannot remove '${args[0]}': No such file` };
      }
      case 'rmdir': {
        if (!args[0]) return { error: 'rmdir: missing operand' };
        const path = this.resolvePath(args[0]);
        if (!s.dirs.has(path)) return { error: `rmdir: '${args[0]}': No such directory` };
        // Check if empty
        const hasFiles = Object.keys(s.files).some(f => f.startsWith(path + '/'));
        const hasSubdirs = [...s.dirs].some(d => d !== path && d.startsWith(path + '/'));
        if (hasFiles || hasSubdirs) return { error: `rmdir: '${args[0]}': Directory not empty` };
        s.dirs.delete(path);
        return { output: '' };
      }
      case 'head': {
        const content = pipeInput || '';
        const n = args.includes('-n') ? parseInt(args[args.indexOf('-n') + 1]) || 10 : 10;
        return { output: content.split('\n').slice(0, n).join('\n') };
      }
      case 'tail': {
        const content = pipeInput || '';
        const n = args.includes('-n') ? parseInt(args[args.indexOf('-n') + 1]) || 10 : 10;
        return { output: content.split('\n').slice(-n).join('\n') };
      }
      case 'wc': {
        const content = pipeInput || '';
        const lines = content.split('\n').length;
        const words = content.split(/\s+/).filter(Boolean).length;
        const chars = content.length;
        return { output: `  ${lines}  ${words}  ${chars}` };
      }
      case 'sort': {
        const content = pipeInput || '';
        return { output: content.split('\n').sort().join('\n') };
      }
      case 'grep': {
        const pattern = args[0] || '';
        const content = pipeInput || '';
        const matches = content.split('\n').filter(l => l.includes(pattern));
        return { output: matches.join('\n') };
      }
      case 'export': {
        const match = args[0]?.match(/^(\w+)=(.*)$/);
        if (match) { s.env[match[1]] = match[2]; return { output: '' }; }
        return { error: 'export: invalid syntax. Use: export VAR=value' };
      }
      case 'env':
      case 'printenv': {
        return { output: Object.entries(s.env).map(([k, v]) => `${k}=${v}`).join('\n') };
      }
      case 'history':
        return { output: s.history.map((h, i) => `  ${i + 1}  ${h}`).join('\n') };
      case 'clear':
        return { output: '' };
      default:
        return { error: `${cmd}: command not found` };
    }
  }

  resolvePath(p) {
    if (p.startsWith('~/') || p === '~') return p;
    if (p.startsWith('/')) return p;
    return this.cmdState.cwd === '~' ? `~/${p}` : `${this.cmdState.cwd}/${p}`;
  }

  parseShellArgs(input) {
    const parts = [];
    let current = '';
    let inQuote = false;
    let quoteChar = '';
    for (const char of input) {
      if ((char === '"' || char === "'") && !inQuote) { inQuote = true; quoteChar = char; }
      else if (char === quoteChar && inQuote) { inQuote = false; }
      else if (char === ' ' && !inQuote) { if (current) parts.push(current); current = ''; }
      else { current += char; }
    }
    if (current) parts.push(current);
    return parts;
  }

  // ── Git Execution ──────────────────────────────────────────

  createInitialGitState() {
    return {
      initialized: false, HEAD: null, currentBranch: null,
      branches: {}, commits: [], index: {}, workingDirectory: {},
      stash: [], merged: [],
      _fileCreated: false, _fileStaged: false, _committed: false
    };
  }

  async executeGit(command, level) {
    if (!this.gitState) this.gitState = this.createInitialGitState();

    const result = this.executeGitCommand(command);
    if (result.error) {
      this.addLine(`error: ${result.error}`, 'error');
    } else if (result.message) {
      this.addLine(result.message, 'output');
    }

    const validation = level.validate(this.gitState);
    if (validation.passed) {
      this.onLevelPassed(level);
    } else if (!result.error) {
      sound.playWrongAnswer();
      this.addLine(validation.feedback, 'dim');
    }
  }

  executeGitCommand(input) {
    const trimmed = input.trim();
    const parts = this.parseShellArgs(trimmed);

    if (trimmed.startsWith('echo ') || trimmed.includes('>')) {
      return this.handleGitFileCreation(trimmed);
    }

    if (!trimmed.startsWith('git ')) {
      return { error: 'Not a recognized command. Use git commands or echo to create files.' };
    }

    const gitCmd = parts[1];
    const args = parts.slice(2);

    switch (gitCmd) {
      case 'init': return this.gitInit();
      case 'add': return this.gitAdd(args);
      case 'commit': return this.gitCommit(args);
      case 'branch': return this.gitBranch(args);
      case 'checkout': return this.gitCheckout(args);
      case 'switch': return this.gitSwitch(args);
      case 'merge': return this.gitMerge(args);
      case 'stash': return this.gitStash(args);
      case 'status': return this.gitStatus();
      case 'log': return this.gitLog();
      default: return { error: `Unknown git command: ${gitCmd}` };
    }
  }

  gitInit() {
    if (this.gitState.initialized) return { message: 'Reinitialized existing Git repository' };
    this.gitState.initialized = true;
    this.gitState.HEAD = 'refs/heads/main';
    this.gitState.currentBranch = 'main';
    this.gitState.branches = { main: { name: 'main', commit: null, commits: [] } };
    this.gitState.commits = [];
    this.gitState.index = {};
    return { message: 'Initialized empty Git repository in .git/' };
  }

  gitAdd(args) {
    if (!this.gitState.initialized) return { error: 'Not a git repository. Run "git init" first.' };
    const file = args[0];
    if (!file) return { error: 'No file specified. Usage: git add <filename>' };
    if (file === '.') {
      const files = Object.keys(this.gitState.workingDirectory);
      if (!files.length) return { error: 'Nothing to add.' };
      files.forEach(f => { this.gitState.index[f] = this.gitState.workingDirectory[f]; });
      this.gitState._fileStaged = true;
      return { message: `Staged ${files.length} file(s)` };
    }
    if (!(file in this.gitState.workingDirectory)) return { error: `fatal: pathspec '${file}' did not match any files` };
    this.gitState.index[file] = this.gitState.workingDirectory[file];
    this.gitState._fileStaged = true;
    return { message: `Staged '${file}'` };
  }

  gitCommit(args) {
    if (!this.gitState.initialized) return { error: 'Not a git repository.' };
    const mIdx = args.indexOf('-m');
    if (mIdx === -1 || !args[mIdx + 1]) return { error: 'Commit message required. Usage: git commit -m "message"' };

    const message = args[mIdx + 1];
    const staged = Object.keys(this.gitState.index);
    if (!staged.length) return { error: 'Nothing to commit. Stage files with git add first.' };

    const hash = Math.random().toString(36).substring(2, 9);
    const branch = this.gitState.currentBranch || 'main';
    this.gitState.commits.unshift({
      hash, message, files: [...staged], timestamp: Date.now(),
      parent: this.gitState.branches[branch]?.commit || null
    });
    this.gitState.branches[branch].commit = hash;
    this.gitState.branches[branch].commits.push(hash);
    this.gitState.index = {};
    this.gitState._committed = true;
    return { message: `[${branch} ${hash}] ${message}\n ${staged.length} file(s) changed` };
  }

  gitBranch(args) {
    if (!this.gitState.initialized) return { error: 'Not a git repository.' };
    if (!args[0]) {
      const lines = Object.keys(this.gitState.branches).map(b =>
        `${b === this.gitState.currentBranch ? '* ' : '  '}${b}`
      );
      return { message: lines.join('\n') };
    }
    const name = args[0];
    if (this.gitState.branches[name]) return { error: `Branch '${name}' already exists.` };
    if (!this.gitState.commits.length) return { error: 'Cannot create branch: no commits yet.' };
    const currentCommit = this.gitState.branches[this.gitState.currentBranch]?.commit;
    this.gitState.branches[name] = { name, commit: currentCommit, commits: currentCommit ? [currentCommit] : [] };
    return { message: `Created branch '${name}'` };
  }

  gitCheckout(args) {
    if (!this.gitState.initialized) return { error: 'Not a git repository.' };
    if (!args[0]) return { error: 'Branch name required.' };
    if (args[0] === '-b') {
      const name = args[1];
      if (!name) return { error: 'Branch name required after -b.' };
      if (!this.gitState.commits.length) return { error: 'Cannot create branch: no commits yet.' };
      const r = this.gitBranch([name]);
      if (r.error) return r;
      this.gitState.HEAD = `refs/heads/${name}`;
      this.gitState.currentBranch = name;
      return { message: `Switched to a new branch '${name}'` };
    }
    if (!this.gitState.branches[args[0]]) return { error: `error: pathspec '${args[0]}' did not match any branch.` };
    this.gitState.HEAD = `refs/heads/${args[0]}`;
    this.gitState.currentBranch = args[0];
    return { message: `Switched to branch '${args[0]}'` };
  }

  gitSwitch(args) {
    if (!this.gitState.initialized) return { error: 'Not a git repository.' };
    if (!args[0]) return { error: 'Branch name required.' };
    if (args[0] === '-c') {
      const name = args[1];
      if (!name) return { error: 'Branch name required after -c.' };
      if (!this.gitState.commits.length) return { error: 'Cannot create branch: no commits yet.' };
      const r = this.gitBranch([name]);
      if (r.error) return r;
      this.gitState.HEAD = `refs/heads/${name}`;
      this.gitState.currentBranch = name;
      return { message: `Switched to a new branch '${name}'` };
    }
    if (!this.gitState.branches[args[0]]) return { error: `error: pathspec '${args[0]}' did not match any branch.` };
    this.gitState.HEAD = `refs/heads/${args[0]}`;
    this.gitState.currentBranch = args[0];
    return { message: `Switched to branch '${args[0]}'` };
  }

  gitMerge(args) {
    if (!this.gitState.initialized) return { error: 'Not a git repository.' };
    const source = args[0];
    if (!source) return { error: 'Branch name required. Usage: git merge <branch>' };
    if (!this.gitState.branches[source]) return { error: `merge: ${source} - not something we can merge.` };
    if (source === this.gitState.currentBranch) return { error: 'Cannot merge a branch into itself.' };
    const hash = Math.random().toString(36).substring(2, 9);
    const branch = this.gitState.currentBranch;
    this.gitState.commits.unshift({
      hash, message: `Merge branch '${source}' into ${branch}`,
      files: [], timestamp: Date.now(),
      parent: this.gitState.branches[branch]?.commit || null
    });
    this.gitState.branches[branch].commit = hash;
    this.gitState.branches[branch].commits.push(hash);
    this.gitState.merged.push(source);
    return { message: `Merge made by the 'ort' strategy.\nMerged '${source}' into '${branch}'.` };
  }

  gitStash(args) {
    if (!this.gitState.initialized) return { error: 'Not a git repository.' };
    const sub = args[0] || 'push';
    if (sub === 'push' || sub === undefined) {
      const files = { ...this.gitState.workingDirectory };
      const staged = { ...this.gitState.index };
      if (!Object.keys(files).length && !Object.keys(staged).length) return { error: 'No local changes to save.' };
      this.gitState.stash.push({ files, staged });
      this.gitState.workingDirectory = {};
      this.gitState.index = {};
      return { message: `Saved working directory and index state WIP on ${this.gitState.currentBranch}` };
    }
    if (sub === 'pop') {
      if (!this.gitState.stash.length) return { error: 'No stash entries found.' };
      const entry = this.gitState.stash.pop();
      Object.assign(this.gitState.workingDirectory, entry.files);
      Object.assign(this.gitState.index, entry.staged);
      return { message: 'Dropped refs/stash@{0}. Applied stashed changes.' };
    }
    if (sub === 'list') {
      if (!this.gitState.stash.length) return { message: 'No stash entries.' };
      return { message: this.gitState.stash.map((_, i) => `stash@{${i}}: WIP`).join('\n') };
    }
    return { error: `Unknown stash command. Use: git stash, git stash pop, git stash list` };
  }

  gitStatus() {
    if (!this.gitState.initialized) return { error: 'Not a git repository.' };
    const staged = Object.keys(this.gitState.index);
    const unstaged = Object.keys(this.gitState.workingDirectory).filter(f => !(f in this.gitState.index));
    let msg = `On branch ${this.gitState.currentBranch}\n`;
    if (staged.length) { msg += '\nChanges to be committed:\n'; staged.forEach(f => { msg += `  new file: ${f}\n`; }); }
    if (unstaged.length) { msg += '\nUntracked files:\n'; unstaged.forEach(f => { msg += `  ${f}\n`; }); }
    if (!staged.length && !unstaged.length) msg += '\nNothing to commit, working tree clean';
    return { message: msg };
  }

  gitLog() {
    if (!this.gitState.initialized) return { error: 'Not a git repository.' };
    if (!this.gitState.commits.length) return { message: 'No commits yet.' };
    return { message: this.gitState.commits.map(c => `commit ${c.hash}\n  ${c.message}`).join('\n\n') };
  }

  handleGitFileCreation(command) {
    const match = command.match(/echo\s+["']?([^"'>]+)["']?\s*>\s*(\S+)/);
    if (match) {
      this.gitState.workingDirectory[match[2]] = match[1].trim();
      this.gitState._fileCreated = true;
      return { message: `Created file '${match[2]}'` };
    }
    return { error: 'Invalid syntax. Use: echo "content" > filename' };
  }

  // ── Level Pass/Fail ─────────────────────────────────────────

  onLevelPassed(level) {
    const id = level.id;

    // Finalize score
    if (!this.score[id]) this.score[id] = 100;
    const pts = this.score[id];

    // Track first-try streak
    if ((this.attempts[id] || 0) === 0 && (this.hintsRevealed[id] || 0) === 0) {
      this.firstTryStreak++;
    } else {
      this.firstTryStreak = 0;
    }

    // Play completion sound
    sound.playLevelComplete();

    this.addBlank();
    this.addLine('\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557', 'success');
    this.addLine(`\u2551    \u2713  LEVEL COMPLETE!  (${pts} pts)     \u2551`, 'success');
    this.addLine('\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D', 'success');
    this.addBlank();
    if (level.successMessage) this.addLine(level.successMessage, 'success-message');
    this.addLine('Type "explain" for a deeper dive on this concept.', 'dim');
    this.addBlank();

    // Record time
    this.onLevelCompleteTimer(level.id);

    // Mark completed
    this.completedLevels.add(level.id);
    this.saveProgress();
    this.updateScoreDisplay();
    this.updateHeader(level);

    // Check achievements
    this.checkAchievements();

    // Daily challenge check
    this.checkDailyChallenge(id);

    // Spaced repetition: schedule review for struggled levels (2+ attempts or hints used)
    if ((this.attempts[id] || 0) >= 2 || (this.hintsRevealed[id] || 0) > 0) {
      this.scheduleReview(this.currentCategory, id);
    }

    // Remove from review queue if re-completing a review item
    this.removeFromReviewQueue(id);

    // Check category complete
    const allDone = this.levels.every(l => this.completedLevels.has(l.id));
    if (allDone) {
      this.updatePersonalBest();
      this.showCategoryComplete();
      return;
    }

    // Advance
    if (this.currentLevelIndex < this.levels.length - 1) {
      this.currentLevelIndex++;
      this.saveProgress();
      this.addLine('Loading next level...', 'dim');
      this.addBlank();
      setTimeout(() => this.loadLevel(this.currentLevelIndex), 1500);
    }
  }

  onLevelFailed(level, feedback) {
    const id = level.id;
    this.attempts[id] = (this.attempts[id] || 0) + 1;
    this.saveProgress();
    sound.playWrongAnswer();
    this.addLine(`\u2717 ${feedback}`, 'error');
    const hintsUsed = this.hintsRevealed[id] || 0;
    if (hintsUsed < 3) this.addLine(`Type 'hint' for help (${hintsUsed}/3 hints revealed).`, 'dim');
  }

  // ── Timer System ───────────────────────────────────────────

  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.sessionStartTime = Date.now();
    this.levelStartTime = Date.now();
    this.timerRunning = true;
    this.timerInterval = setInterval(() => this.updateTimerDisplay(), 50);
  }

  setupTimerDisplay() {
    if (this.timerClock) this.timerClock.textContent = '0:00.00';
    if (this.segmentTime) this.segmentTime.textContent = '0:00.00';
  }

  updateTimerDisplay() {
    if (!this.sessionStartTime || !this.timerRunning) return;
    const now = Date.now();
    if (this.timerClock) this.timerClock.textContent = this.formatTime(now - this.sessionStartTime);
    if (this.levelStartTime && this.segmentTime) this.segmentTime.textContent = this.formatTime(now - this.levelStartTime);
  }

  formatTime(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    const cs = Math.floor((ms % 1000) / 10);
    if (m >= 60) {
      return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    }
    return `${m}:${String(sec).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  }

  toggleTimer() {
    if (!this.gameStarted) {
      this.addLine('Timer is only active during gameplay.', 'dim');
      return;
    }
    if (this.timerRunning) {
      // Pause
      this.timerElapsedBeforeStop = Date.now() - this.sessionStartTime;
      this.levelElapsedBeforeStop = Date.now() - this.levelStartTime;
      this.timerRunning = false;
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.timerInterval = null;
      this.timerPausedByUser = true;
      this.addLine('[TIMER] Paused. Type "timestop" again to resume.', 'system');
    } else if (this.timerPausedByUser) {
      // Resume
      this.sessionStartTime = Date.now() - this.timerElapsedBeforeStop;
      this.levelStartTime = Date.now() - this.levelElapsedBeforeStop;
      this.timerRunning = true;
      this.timerInterval = setInterval(() => this.updateTimerDisplay(), 50);
      this.timerPausedByUser = false;
      this.addLine('[TIMER] Resumed.', 'system');
    }
  }

  onLevelCompleteTimer(levelId) {
    if (!this.levelStartTime) return;
    this.levelTimes[levelId] = Date.now() - this.levelStartTime;
    this.levelStartTime = Date.now();
    this.renderSplits();
    this.saveProgress();
  }

  renderSplits() {
    if (!this.splitsList) return;
    const frag = document.createDocumentFragment();

    this.levels.forEach((level, i) => {
      const done = this.completedLevels.has(level.id);
      const active = i === this.currentLevelIndex;

      const row = document.createElement('div');
      row.className = `split-row${done ? ' completed' : active ? ' active' : ' pending'}`;

      const icon = document.createElement('span');
      icon.className = `split-icon${done ? ' completed' : active ? ' active' : ' pending'}`;
      icon.textContent = done ? '\u2713' : active ? '\u25B6' : '\u25CB';

      const name = document.createElement('span');
      name.className = 'split-name';
      name.textContent = level.title;
      name.title = `Level ${i + 1}: ${level.title}`;

      const diff = document.createElement('span');
      diff.className = 'split-difficulty';
      const stars = this.getDifficulty(i, this.levels.length);
      diff.textContent = '*'.repeat(stars);
      diff.title = ['Easy','Medium','Hard'][stars - 1];

      const time = document.createElement('span');
      time.className = `split-time${done ? ' completed' : active ? ' active' : ' pending'}`;
      time.textContent = done && this.levelTimes[level.id]
        ? this.formatTime(this.levelTimes[level.id])
        : active ? '--:--.--' : '';

      row.append(icon, name, diff, time);
      frag.appendChild(row);
    });

    this.splitsList.innerHTML = '';
    this.splitsList.appendChild(frag);

    const activeRow = this.splitsList.querySelector('.split-row.active');
    if (activeRow) activeRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  // ── Difficulty ─────────────────────────────────────────────

  getDifficulty(levelIndex, totalLevels) {
    // First ~30% very easy, middle ~40% medium, last ~30% hard
    // Within first 10 levels: always easy; within last 10: always hard
    if (levelIndex < 10) return 1;
    if (levelIndex >= totalLevels - 10) return 3;
    const pos = (levelIndex - 10) / Math.max(1, totalLevels - 20);
    if (pos < 0.4) return 1;
    if (pos < 0.75) return 2;
    return 3;
  }

  // ── Score Display ─────────────────────────────────────────

  updateScoreDisplay() {
    if (this.scoreDisplay) {
      let total = 0;
      for (const id of this.completedLevels) {
        total += (this.score[id] ?? 100);
      }
      this.scoreDisplay.textContent = `${total}pts`;
    }
  }

  showScore() {
    this.addBlank();
    this.addLine('Score Summary:', 'system');
    let total = 0, count = 0;
    for (const l of this.levels) {
      if (this.completedLevels.has(l.id)) {
        const pts = this.score[l.id] ?? 100;
        total += pts;
        count++;
      }
    }
    this.addLine(`  Levels completed: ${count}/${this.levels.length}`, 'system');
    this.addLine(`  Total score: ${total} pts`, 'system');
    if (count > 0) this.addLine(`  Average: ${Math.round(total / count)} pts/level`, 'system');
    const pb = this.personalBests[this.currentCategory];
    if (pb) this.addLine(`  Personal best: ${this.formatTime(pb)}`, 'system');
    this.addBlank();
  }

  // ── Explain Command ───────────────────────────────────────

  showExplain() {
    // Show explanation for the most recently completed level or current level
    const idx = this.currentLevelIndex;
    const prevLevel = idx > 0 ? this.levels[idx - 1] : null;
    const level = (prevLevel && this.completedLevels.has(prevLevel.id)) ? prevLevel : this.levels[idx];
    if (!level) return;

    const stars = this.getDifficulty(this.levels.indexOf(level), this.levels.length);
    const diffLabel = ['Easy', 'Medium', 'Hard'][stars - 1];

    this.addBlank();
    this.addLine(`\u2554${'═'.repeat(50)}\u2557`, 'system');
    this.addLine(`\u2551  ${level.title.padEnd(48)}\u2551`, 'system');
    this.addLine(`\u255A${'═'.repeat(50)}\u255D`, 'system');
    this.addBlank();

    // Concept explanation
    if (level.successMessage) {
      this.addLine('Why it works:', 'level-header');
      this.addLine(`  ${level.successMessage}`, 'success-message');
      this.addBlank();
    }

    // Hints as learning notes
    if (level.hints?.length) {
      this.addLine('Key concepts:', 'level-header');
      level.hints.forEach((h, i) => {
        this.addLine(`  ${i + 1}. ${h}`, 'dim');
      });
      this.addBlank();
    }

    // Performance on this level
    const id = level.id;
    const attempts = this.attempts[id] || 0;
    const hints = this.hintsRevealed[id] || 0;
    const pts = this.score[id] ?? 100;
    const time = this.levelTimes[id];
    this.addLine('Your performance:', 'level-header');
    this.addLine(`  Difficulty: ${'*'.repeat(stars)} ${diffLabel}`, 'dim');
    this.addLine(`  Attempts: ${attempts}  |  Hints: ${hints}/3  |  Score: ${pts} pts`, 'dim');
    if (time) this.addLine(`  Time: ${this.formatTime(time)}`, 'dim');

    // Tip based on performance
    if (attempts > 3) {
      this.addBlank();
      this.addLine('Tip: This one was tough! It\'s queued for spaced review.', 'hint');
    } else if (hints === 0 && attempts === 0) {
      this.addBlank();
      this.addLine('Perfect solve — no hints, no mistakes!', 'success');
    }
    this.addBlank();
  }

  // ── Tab Completion ────────────────────────────────────────

  handleTabComplete() {
    const val = this.input.value.trim().toLowerCase();
    if (!val) return;
    const matches = this.tabCommands.filter(c => c.startsWith(val));
    if (matches.length === 1) {
      this.input.value = matches[0];
    } else if (matches.length > 1) {
      this.addLine(`$ ${val}`, 'command');
      this.addLine(matches.join('  '), 'dim');
    }
  }

  // ── Timer Sidebar Visibility ─────────────────────────────

  showTimerSidebar(visible) {
    if (this.timerSidebar) this.timerSidebar.style.display = visible ? '' : 'none';
  }

  // ── Keyboard Overlay ──────────────────────────────────────

  toggleKbOverlay() {
    if (this.kbOverlay) {
      this.kbOverlay.hidden = !this.kbOverlay.hidden;
    }
  }

  // ── Mobile Drawer ─────────────────────────────────────────

  toggleMobileDrawer() {
    if (!this.mobileDrawer) return;
    const open = this.mobileDrawer.classList.contains('open');
    if (open) this.closeMobileDrawer();
    else this.openMobileDrawer();
  }

  openMobileDrawer() {
    if (this.mobileDrawer) {
      this.mobileDrawer.hidden = false;
      if (this.mobileOverlay) this.mobileOverlay.hidden = false;
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => this.mobileDrawer.classList.add('open'));
    }
  }

  closeMobileDrawer() {
    if (this.mobileDrawer) {
      this.mobileDrawer.classList.remove('open');
      document.body.style.overflow = '';
      setTimeout(() => {
        this.mobileDrawer.hidden = true;
        if (this.mobileOverlay) this.mobileOverlay.hidden = true;
      }, 250);
    }
  }

  // ── Export/Import Progress ────────────────────────────────

  exportProgress() {
    try {
      const raw = localStorage.getItem('sudoquest_progress');
      if (!raw) { this.addLine('No progress to export.', 'dim'); return; }
      const encoded = btoa(raw);
      navigator.clipboard.writeText(encoded).then(() => {
        this.addLine('Progress copied to clipboard!', 'success');
        this.addLine('Use "load <data>" to import on another device.', 'dim');
      }).catch(() => {
        this.addLine('Progress string (copy manually):', 'system');
        this.addLine(encoded, 'output');
      });
    } catch (_) {
      this.addLine('Failed to export progress.', 'error');
    }
  }

  importProgress(data) {
    try {
      const raw = atob(data);
      const parsed = JSON.parse(raw);
      if (!parsed.completedLevels) throw new Error('Invalid data');
      localStorage.setItem('sudoquest_progress', raw);
      this.loadProgress();
      if (this.currentCategory) {
        this.levels = getLevelsForCategory(this.currentCategory);
        this.renderSplits();
      }
      this.addLine('Progress imported successfully! Reload to apply fully.', 'success');
    } catch (_) {
      this.addLine('Invalid progress data. Make sure you pasted the full string.', 'error');
    }
  }

  // ── Personal Best ─────────────────────────────────────────

  updatePersonalBest() {
    if (!this.currentCategory || !this.sessionStartTime) return;
    const totalTime = Date.now() - this.sessionStartTime;
    const prev = this.personalBests[this.currentCategory];
    if (!prev || totalTime < prev) {
      this.personalBests[this.currentCategory] = totalTime;
      this.saveProgress();
      if (prev) {
        this.addLine(`NEW PERSONAL BEST! ${this.formatTime(totalTime)} (was ${this.formatTime(prev)})`, 'success');
      }
    }
  }

  // ── Achievement System ────────────────────────────────────

  checkAchievements() {
    const defs = [
      { key: 'js_master', title: 'JS Master', desc: 'Complete all JavaScript levels', icon: '\uD83C\uDFC6',
        check: () => this.isCategoryDone('js') },
      { key: 'git_master', title: 'Git Guru', desc: 'Complete all Git levels', icon: '\uD83C\uDFC6',
        check: () => this.isCategoryDone('git') },
      { key: 'cmd_master', title: 'Terminal Pro', desc: 'Complete all Terminal levels', icon: '\uD83C\uDFC6',
        check: () => this.isCategoryDone('cmd') },
      { key: 'html_master', title: 'HTML Hero', desc: 'Complete all HTML levels', icon: '\uD83C\uDFC6',
        check: () => this.isCategoryDone('html') },
      { key: 'css_master', title: 'CSS Wizard', desc: 'Complete all CSS levels', icon: '\uD83C\uDFC6',
        check: () => this.isCategoryDone('css') },
      { key: 'csharp_master', title: 'C# Champion', desc: 'Complete all C# levels', icon: '\uD83C\uDFC6',
        check: () => this.isCategoryDone('csharp') },
      { key: 'python_master', title: 'Python Tamer', desc: 'Complete all Python levels', icon: '\uD83C\uDFC6',
        check: () => this.isCategoryDone('python') },
      { key: 'c_master', title: 'C Veteran', desc: 'Complete all C levels', icon: '\uD83C\uDFC6',
        check: () => this.isCategoryDone('c') },
      { key: 'cpp_master', title: 'C++ Architect', desc: 'Complete all C++ levels', icon: '\uD83C\uDFC6',
        check: () => this.isCategoryDone('cpp') },
      { key: 'java_master', title: 'Java Juggernaut', desc: 'Complete all Java levels', icon: '\uD83C\uDFC6',
        check: () => this.isCategoryDone('java') },
      { key: 'ts_master', title: 'TypeScript Titan', desc: 'Complete all TypeScript levels', icon: '\uD83C\uDFC6',
        check: () => this.isCategoryDone('typescript') },
      { key: 'react_master', title: 'React Rockstar', desc: 'Complete all React levels', icon: '\uD83C\uDFC6',
        check: () => this.isCategoryDone('react') },
      { key: 'sql_master', title: 'SQL Sage', desc: 'Complete all SQL levels', icon: '\uD83C\uDFC6',
        check: () => this.isCategoryDone('sql') },
      { key: 'rust_master', title: 'Rust Ranger', desc: 'Complete all Rust levels', icon: '\uD83C\uDFC6',
        check: () => this.isCategoryDone('rust') },
      { key: 'speed_demon', title: 'Speed Demon', desc: 'Complete a category under 10 min', icon: '\u26A1',
        check: () => Object.values(this.personalBests).some(t => t < 600000) },
      { key: 'no_hints', title: 'Solo Solver', desc: 'Complete a category without hints', icon: '\uD83E\uDDE0',
        check: () => this.levels.every(l => this.completedLevels.has(l.id)) && this.levels.every(l => !(this.hintsRevealed[l.id])) },
      { key: 'streak_5', title: 'On Fire!', desc: '5 levels in a row on first try', icon: '\uD83D\uDD25',
        check: () => this.firstTryStreak >= 5 },
      { key: 'perfectionist', title: 'Perfectionist', desc: 'Score 100 on 10 levels', icon: '\uD83D\uDCAF',
        check: () => Object.values(this.score).filter(s => s === 100).length >= 10 },
      { key: 'completionist', title: 'Completionist', desc: 'Complete all 490 levels', icon: '\uD83C\uDF1F',
        check: () => this.completedLevels.size >= 490 },
    ];

    for (const def of defs) {
      if (this.achievements.has(def.key)) continue;
      if (def.check()) {
        this.achievements.add(def.key);
        this.saveProgress();
        this.showAchievementToast(def);
      }
    }
  }

  isCategoryDone(key) {
    const cat = getCategoryByKey(key);
    return cat && cat.levels.every(l => this.completedLevels.has(l.id));
  }

  showAchievementToast(def) {
    if (!this.achievementToast) return;
    const el = document.createElement('div');
    el.className = 'achievement-badge';
    el.innerHTML = `<span class="badge-icon">${def.icon}</span><div class="badge-text"><span class="badge-title">${def.title}</span><span class="badge-desc">${def.desc}</span></div>`;
    sound.playAchievement();
    this.achievementToast.appendChild(el);
    setTimeout(() => el.remove(), 4200);
  }

  showAchievements() {
    this.addBlank();
    this.addLine('\u2550\u2550 Achievements \u2550\u2550', 'system');
    this.addBlank();
    const allDefs = [
      { key: 'js_master', title: 'JS Master', desc: 'Complete all JavaScript levels', icon: '\uD83C\uDFC6' },
      { key: 'git_master', title: 'Git Guru', desc: 'Complete all Git levels', icon: '\uD83C\uDFC6' },
      { key: 'cmd_master', title: 'Terminal Pro', desc: 'Complete all Terminal levels', icon: '\uD83C\uDFC6' },
      { key: 'html_master', title: 'HTML Hero', desc: 'Complete all HTML levels', icon: '\uD83C\uDFC6' },
      { key: 'css_master', title: 'CSS Wizard', desc: 'Complete all CSS levels', icon: '\uD83C\uDFC6' },
      { key: 'csharp_master', title: 'C# Champion', desc: 'Complete all C# levels', icon: '\uD83C\uDFC6' },
      { key: 'python_master', title: 'Python Tamer', desc: 'Complete all Python levels', icon: '\uD83C\uDFC6' },
      { key: 'c_master', title: 'C Veteran', desc: 'Complete all C levels', icon: '\uD83C\uDFC6' },
      { key: 'cpp_master', title: 'C++ Architect', desc: 'Complete all C++ levels', icon: '\uD83C\uDFC6' },
      { key: 'java_master', title: 'Java Juggernaut', desc: 'Complete all Java levels', icon: '\uD83C\uDFC6' },
      { key: 'ts_master', title: 'TypeScript Titan', desc: 'Complete all TypeScript levels', icon: '\uD83C\uDFC6' },
      { key: 'react_master', title: 'React Rockstar', desc: 'Complete all React levels', icon: '\uD83C\uDFC6' },
      { key: 'sql_master', title: 'SQL Sage', desc: 'Complete all SQL levels', icon: '\uD83C\uDFC6' },
      { key: 'rust_master', title: 'Rust Ranger', desc: 'Complete all Rust levels', icon: '\uD83C\uDFC6' },
      { key: 'speed_demon', title: 'Speed Demon', desc: 'Complete a category under 10 min', icon: '\u26A1' },
      { key: 'no_hints', title: 'Solo Solver', desc: 'Complete a category without hints', icon: '\uD83E\uDDE0' },
      { key: 'streak_5', title: 'On Fire!', desc: '5 levels in a row on first try', icon: '\uD83D\uDD25' },
      { key: 'perfectionist', title: 'Perfectionist', desc: 'Score 100 on 10 levels', icon: '\uD83D\uDCAF' },
      { key: 'completionist', title: 'Completionist', desc: 'Complete all 490 levels', icon: '\uD83C\uDF1F' },
    ];
    for (const d of allDefs) {
      const earned = this.achievements.has(d.key);
      const mark = earned ? '\u2713' : '\u25CB';
      const type = earned ? 'success' : 'dim';
      this.addLine(`  ${mark} ${d.icon} ${d.title} \u2014 ${d.desc}`, type);
    }
    this.addBlank();
    this.addLine(`  ${this.achievements.size}/${allDefs.length} unlocked`, 'system');
    this.addBlank();
  }

  // ── Sound Toggle ───────────────────────────────────────────

  toggleSound() {
    const on = sound.toggle();
    this.addLine(`Sound effects ${on ? 'enabled' : 'disabled'}.`, 'system');
    if (on) sound.playLevelComplete();
  }

  // ── Music Panel ─────────────────────────────────────────

  toggleMusicPanel(forceState) {
    if (!this.musicPanel) return;
    const show = forceState !== undefined ? forceState : !this.musicPanel.classList.contains('open');
    if (show) {
      this.musicPanel.hidden = false;
      this.musicPanel.classList.add('open');
      // Restore last URL
      try {
        const saved = localStorage.getItem('sudoquest_music_url');
        if (saved && !this.musicEmbedWrap.querySelector('iframe')) {
          this.musicUrlInput.value = saved;
          this.loadMusicUrl();
        }
      } catch (_) {}
    } else {
      this.musicPanel.classList.remove('open');
      this.musicPanel.hidden = true;
    }
  }

  loadMusicUrl() {
    const raw = this.musicUrlInput?.value.trim();
    if (!raw) return;

    const result = this.parseMusicUrl(raw);
    if (!result) {
      this.musicEmbedWrap.innerHTML = '<p class="music-placeholder">Invalid URL. Paste a Spotify or YouTube link.</p>';
      return;
    }

    try { localStorage.setItem('sudoquest_music_url', raw); } catch (_) {}

    this.musicPlayerType = result.type;
    this.musicEmbedWrap.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.src = result.embedUrl;
    iframe.allow = 'encrypted-media; autoplay';
    iframe.loading = 'lazy';
    iframe.setAttribute('allowfullscreen', '');

    if (result.type === 'spotify') {
      iframe.sandbox = 'allow-scripts allow-same-origin allow-popups';
    } else if (result.type === 'youtube') {
      iframe.id = 'yt-music-iframe';
      iframe.sandbox = 'allow-scripts allow-same-origin allow-popups allow-presentation';
    }

    this.musicEmbedWrap.appendChild(iframe);
    this.ytPlayer = (result.type === 'youtube') ? iframe : null;

    // Show volume row
    if (this.musicVolumeRow) this.musicVolumeRow.hidden = false;

    // Apply saved volume after a short delay for iframe to load
    setTimeout(() => this.applyMusicVolume(), 1000);
  }

  parseMusicUrl(url) {
    // Spotify: open.spotify.com/(track|album|playlist|episode|show)/ID
    const sp = url.match(/open\.spotify\.com\/(track|album|playlist|episode|show)\/([a-zA-Z0-9]+)/);
    if (sp) return { type: 'spotify', embedUrl: `https://open.spotify.com/embed/${sp[1]}/${sp[2]}?theme=0` };

    // YouTube: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, youtube.com/shorts/ID
    let ytId = null;
    const yt1 = url.match(/(?:youtube\.com\/watch\?.*v=|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
    if (yt1) ytId = yt1[1];
    if (!ytId) {
      const yt2 = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
      if (yt2) ytId = yt2[1];
    }
    if (ytId) return { type: 'youtube', embedUrl: `https://www.youtube.com/embed/${ytId}?enablejsapi=1&autoplay=1&rel=0` };

    // YouTube Music: music.youtube.com/watch?v=ID
    const ytm = url.match(/music\.youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/);
    if (ytm) return { type: 'youtube', embedUrl: `https://www.youtube.com/embed/${ytm[1]}?enablejsapi=1&autoplay=1&rel=0` };

    return null;
  }

  applyMusicVolume() {
    if (this.ytPlayer && this.musicPlayerType === 'youtube') {
      // Use YouTube IFrame API postMessage to set volume
      try {
        this.ytPlayer.contentWindow.postMessage(JSON.stringify({
          event: 'command',
          func: 'setVolume',
          args: [this.musicVolume]
        }), '*');
      } catch (_) {}
    }
    // Spotify embeds don't support external volume control — user controls via the player
  }

  // ── Learning Sandbox ──────────────────────────────────────

  enterSandbox() {
    this.sandboxMode = true;
    this.sandboxCategory = null;
    this.sandboxLessonIndex = 0;
    this.sandboxConceptIndex = 0;

    // Pause timer while in sandbox
    if (this.timerRunning) {
      this.timerPausedBySandbox = true;
      this.timerRunning = false;
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.timerInterval = null;
      // Save elapsed time so we can resume later
      this.timerElapsedBeforeSandbox = Date.now() - this.sessionStartTime;
      this.levelElapsedBeforeSandbox = Date.now() - this.levelStartTime;
    }

    this.clearTerminal();

    const art = `
 ╔═╗ ╔═╗ ╔╗╔ ╔╦╗ ╔╗  ╔═╗ ═╗╔═
 ╚═╗ ╠═╣ ║║║  ║║ ╠╩╗ ║ ║  ╠╣
 ╚═╝ ╩ ╩ ╝╚╝ ═╩╝ ╚═╝ ╚═╝ ═╝╚═`;
    this.addHTML(`<pre class="ascii-art">${art}</pre>`, 'system');
    this.addBlank();
    this.addLine('Welcome to the Learning Sandbox!', 'system');
    this.addLine('A guided, step-by-step walkthrough of core concepts.', 'dim');
    this.addBlank();
    this.addLine('Pick a topic to learn:', 'question');
    this.addBlank();

    const keys = Object.keys(SANDBOX_LESSONS);
    const labels = { js: 'JavaScript', git: 'Git', cmd: 'Terminal', html: 'HTML', css: 'CSS', csharp: 'C#', python: 'Python', c: 'C', java: 'Java', cpp: 'C++', typescript: 'TypeScript', react: 'React', sql: 'SQL', rust: 'Rust' };
    keys.forEach(k => {
      const lessons = SANDBOX_LESSONS[k];
      const totalConcepts = lessons.reduce((n, l) => n + l.concepts.length, 0);
      this.addLine(`  ${k.padEnd(8)} — ${labels[k] || k} (${lessons.length} lessons, ${totalConcepts} concepts)`, 'system');
    });
    this.addBlank();
    this.addLine('Type a topic name (e.g. "js") or "exit" to leave sandbox.', 'dim');
    this.addBlank();
  }

  handleSandboxInput(input) {
    const lower = input.toLowerCase().trim();

    // Exit sandbox
    if (lower === 'exit' || lower === 'quit' || lower === 'q' || lower === 'back') {
      this.sandboxMode = false;
      this.sandboxCategory = null;

      // Resume timer if it was paused by sandbox
      if (this.timerPausedBySandbox) {
        this.timerPausedBySandbox = false;
        this.sessionStartTime = Date.now() - this.timerElapsedBeforeSandbox;
        this.levelStartTime = Date.now() - this.levelElapsedBeforeSandbox;
        this.timerRunning = true;
        this.timerInterval = setInterval(() => this.updateTimerDisplay(), 50);
      }

      this.clearTerminal();
      if (this.gameStarted && this.currentCategory) {
        this.loadLevel(this.currentLevelIndex);
      } else {
        this.showReadyScreen();
      }
      return;
    }

    // Picking a category
    if (!this.sandboxCategory) {
      if (SANDBOX_LESSONS[lower]) {
        this.sandboxCategory = lower;
        this.sandboxLessonIndex = 0;
        this.sandboxConceptIndex = 0;
        this.showSandboxConcept();
      } else {
        this.addLine(`Unknown topic "${lower}". Choose: ${Object.keys(SANDBOX_LESSONS).join(', ')}`, 'error');
      }
      return;
    }

    // Navigation within sandbox
    if (lower === 'next' || lower === 'n' || lower === '') {
      this.advanceSandbox();
      return;
    }
    if (lower === 'prev' || lower === 'p') {
      this.retreatSandbox();
      return;
    }
    if (lower === 'menu' || lower === 'topics') {
      this.sandboxCategory = null;
      this.enterSandbox();
      return;
    }
    if (lower === 'list' || lower === 'lessons') {
      this.showSandboxLessonList();
      return;
    }

    // Try running code in the sandbox (JS only)
    if (this.sandboxCategory === 'js') {
      this.runSandboxCode(input);
      return;
    }

    // For non-JS categories, just show the code they typed
    input.split('\n').forEach(line => this.addLine(line, 'output'));
    this.addBlank();
    this.addLine('Press Enter or type "next" for the next concept.', 'dim');
  }

  showSandboxConcept() {
    const lessons = SANDBOX_LESSONS[this.sandboxCategory];
    if (!lessons) return;
    const lesson = lessons[this.sandboxLessonIndex];
    if (!lesson) return;
    const concept = lesson.concepts[this.sandboxConceptIndex];
    if (!concept) return;

    this.clearTerminal();

    // Progress bar
    const totalConcepts = lessons.reduce((n, l) => n + l.concepts.length, 0);
    let currentNum = 0;
    for (let i = 0; i < this.sandboxLessonIndex; i++) currentNum += lessons[i].concepts.length;
    currentNum += this.sandboxConceptIndex + 1;

    const labels = { js: 'JavaScript', git: 'Git', cmd: 'Terminal', html: 'HTML', css: 'CSS', csharp: 'C#', python: 'Python', c: 'C', java: 'Java', cpp: 'C++', typescript: 'TypeScript', react: 'React', sql: 'SQL', rust: 'Rust' };
    const catName = labels[this.sandboxCategory] || this.sandboxCategory;

    this.addLine(`\u2550\u2550 ${catName} Sandbox \u2550\u2550  [${currentNum}/${totalConcepts}]`, 'system');
    this.addBlank();
    this.addLine(`Lesson: ${lesson.title}`, 'level-header');
    this.addBlank();

    // Concept name & description
    this.addLine(`\u25B6 ${concept.name}`, 'question');
    this.addBlank();
    this.addLine(concept.desc, 'output');
    this.addBlank();

    // Example code
    this.addLine('\u2500\u2500 Example \u2500\u2500', 'dim');
    concept.example.split('\n').forEach(line => {
      this.addLine(`  ${line}`, 'success');
    });
    this.addBlank();

    // Try it prompt
    if (this.sandboxCategory === 'js') {
      this.addLine('Try it! Type the code above (or your own) and press Enter.', 'hint');
    } else {
      this.addLine('Study the example, then try typing it yourself.', 'hint');
    }
    this.addLine('Commands: next (n), prev (p), list, menu, exit', 'dim');
    this.addBlank();

    this.input.focus();
  }

  advanceSandbox() {
    const lessons = SANDBOX_LESSONS[this.sandboxCategory];
    if (!lessons) return;
    const lesson = lessons[this.sandboxLessonIndex];

    if (this.sandboxConceptIndex < lesson.concepts.length - 1) {
      this.sandboxConceptIndex++;
    } else if (this.sandboxLessonIndex < lessons.length - 1) {
      this.sandboxLessonIndex++;
      this.sandboxConceptIndex = 0;
    } else {
      // Completed all lessons
      sound.playLevelComplete();
      this.clearTerminal();
      this.addBlank();
      this.addLine('\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557', 'success');
      this.addLine('\u2551    SANDBOX COMPLETE! Nice work!     \u2551', 'success');
      this.addLine('\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D', 'success');
      this.addBlank();
      this.addLine('You\'ve covered all concepts for this topic.', 'success-message');
      this.addLine('Ready to test your skills? Type "exit" to go to the challenges!', 'dim');
      this.addBlank();
      this.addLine('Or type "menu" to pick another topic.', 'dim');
      this.addBlank();
      return;
    }
    sound.playNote(660, 0.1, sound.getCtx()?.currentTime || 0, 0.06);
    this.showSandboxConcept();
  }

  retreatSandbox() {
    const lessons = SANDBOX_LESSONS[this.sandboxCategory];
    if (!lessons) return;

    if (this.sandboxConceptIndex > 0) {
      this.sandboxConceptIndex--;
    } else if (this.sandboxLessonIndex > 0) {
      this.sandboxLessonIndex--;
      this.sandboxConceptIndex = lessons[this.sandboxLessonIndex].concepts.length - 1;
    } else {
      this.addLine('Already at the first concept.', 'dim');
      return;
    }
    this.showSandboxConcept();
  }

  showSandboxLessonList() {
    const lessons = SANDBOX_LESSONS[this.sandboxCategory];
    if (!lessons) return;
    this.addBlank();
    this.addLine('Lessons:', 'system');
    lessons.forEach((lesson, li) => {
      const marker = li === this.sandboxLessonIndex ? '>' : ' ';
      this.addLine(`  ${marker} ${li + 1}. ${lesson.title} (${lesson.concepts.length} concepts)`, li === this.sandboxLessonIndex ? 'question' : 'dim');
    });
    this.addBlank();
  }

  async runSandboxCode(code) {
    this.isExecuting = true;
    this.runBtn.textContent = '...';
    this.runBtn.disabled = true;

    try {
      const result = await this.runInSandbox(code);
      if (result.consoleLogs?.length) {
        result.consoleLogs.forEach(log => this.addLine(log, 'output'));
      }
      if (result.errors?.length) {
        result.errors.forEach(err => this.addLine(`Error: ${err}`, 'error'));
        sound.playError();
      } else {
        this.addLine('\u2713 Code executed!', 'success');
      }
    } catch (err) {
      this.addLine(`Error: ${err.message}`, 'error');
    } finally {
      this.isExecuting = false;
      this.runBtn.textContent = 'RUN';
      this.runBtn.disabled = false;
      this.input.focus();
    }

    this.addBlank();
    this.addLine('Type "next" for the next concept, or try more code.', 'dim');
  }

  // ── Streak System ───────────────────────────────────────────

  getTodayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  recordLogin() {
    const today = this.getTodayStr();
    if (this.loginDates[this.loginDates.length - 1] === today) return;
    this.loginDates.push(today);
    // Keep last 365 days only
    if (this.loginDates.length > 365) this.loginDates = this.loginDates.slice(-365);
    // Calculate streak
    this.currentStreak = 1;
    for (let i = this.loginDates.length - 2; i >= 0; i--) {
      const prev = new Date(this.loginDates[i]);
      const curr = new Date(this.loginDates[i + 1]);
      const diff = (curr - prev) / 86400000;
      if (diff <= 1) this.currentStreak++;
      else break;
    }
    if (this.currentStreak > this.longestStreak) this.longestStreak = this.currentStreak;
    this.saveProgress();
  }

  showStreak() {
    this.addBlank();
    this.addLine('\u2550\u2550 Login Streak \u2550\u2550', 'system');
    this.addBlank();
    this.addLine(`  Current streak: ${this.currentStreak} day${this.currentStreak !== 1 ? 's' : ''}`, 'system');
    this.addLine(`  Longest streak: ${this.longestStreak} day${this.longestStreak !== 1 ? 's' : ''}`, 'system');
    this.addLine(`  Total active days: ${this.loginDates.length}`, 'system');
    this.addBlank();
    // Visual calendar — last 28 days
    const today = new Date(this.getTodayStr());
    const dateSet = new Set(this.loginDates);
    let row2 = '  '; // activity row
    for (let i = 27; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      row2 += dateSet.has(key) ? '\u2588' : '\u2591';
    }
    this.addLine('  Last 28 days:', 'dim');
    this.addLine(row2, 'success');
    this.addBlank();
  }

  // ── Stats Dashboard ───────────────────────────────────────

  showStats() {
    this.addBlank();
    this.addLine('\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557', 'system');
    this.addLine('\u2551         PROGRESS DASHBOARD            \u2551', 'system');
    this.addLine('\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D', 'system');
    this.addBlank();

    // Overall stats
    let totalLevels = 0, totalCompleted = 0, totalScore = 0, totalAttempts = 0, totalHints = 0;
    const weakest = []; // {catKey, catName, accuracy}

    for (const cat of CATEGORIES) {
      const catLevels = cat.levels;
      const done = catLevels.filter(l => this.completedLevels.has(l.id));
      const catAttempts = catLevels.reduce((s, l) => s + (this.attempts[l.id] || 0), 0);
      const catHints = catLevels.reduce((s, l) => s + (this.hintsRevealed[l.id] || 0), 0);
      const catScore = done.reduce((s, l) => s + (this.score[l.id] ?? 100), 0);
      const catTime = catLevels.reduce((s, l) => s + (this.levelTimes[l.id] || 0), 0);
      const pct = catLevels.length ? Math.round((done.length / catLevels.length) * 100) : 0;
      // Accuracy = levels completed first try (0 extra attempts) / completed
      const firstTry = done.filter(l => (this.attempts[l.id] || 0) === 0).length;
      const accuracy = done.length ? Math.round((firstTry / done.length) * 100) : 0;

      totalLevels += catLevels.length;
      totalCompleted += done.length;
      totalScore += catScore;
      totalAttempts += catAttempts;
      totalHints += catHints;

      // Progress bar (20 chars wide)
      const filled = Math.round(pct / 5);
      const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(20 - filled);

      this.addLine(`  ${cat.name}`, 'level-header');
      this.addLine(`    [${bar}] ${pct}%  (${done.length}/${catLevels.length})`, done.length === catLevels.length ? 'success' : 'system');
      if (done.length > 0) {
        const timeStr = catTime > 0 ? this.formatTime(catTime) : '--';
        this.addLine(`    Score: ${catScore}  |  Accuracy: ${accuracy}%  |  Time: ${timeStr}`, 'dim');
      }

      if (done.length > 0 && accuracy < 60) {
        weakest.push({ name: cat.name, accuracy });
      }
    }

    this.addBlank();
    const overallPct = totalLevels ? Math.round((totalCompleted / totalLevels) * 100) : 0;
    this.addLine(`  Overall: ${totalCompleted}/${totalLevels} levels (${overallPct}%)`, 'system');
    this.addLine(`  Total Score: ${totalScore} pts  |  Hints Used: ${totalHints}`, 'system');
    this.addLine(`  Streak: ${this.currentStreak} day${this.currentStreak !== 1 ? 's' : ''} (best: ${this.longestStreak})`, 'system');

    // Peer comparison (estimated percentile)
    const avgScore = totalCompleted ? totalScore / totalCompleted : 0;
    const percentile = this.estimatePercentile(totalCompleted, avgScore, totalHints);
    this.addLine(`  Estimated rank: top ${percentile}% of learners`, 'hint');

    if (weakest.length) {
      this.addBlank();
      this.addLine('  Weakest areas (< 60% accuracy):', 'error');
      weakest.sort((a, b) => a.accuracy - b.accuracy);
      weakest.forEach(w => this.addLine(`    ${w.name}: ${w.accuracy}% accuracy`, 'error'));
    }

    // Check for pending reviews
    const dueReviews = this.getDueReviews();
    if (dueReviews.length) {
      this.addBlank();
      this.addLine(`  ${dueReviews.length} review${dueReviews.length > 1 ? 's' : ''} due! Type "review" to practice.`, 'hint');
    }

    this.addBlank();
  }

  // ── Peer Comparison (Estimated Percentile) ────────────────

  estimatePercentile(completed, avgScore, hintsUsed) {
    // Estimate based on local performance vs expected distributions
    // More levels + higher avg score + fewer hints = better rank
    // This is an approximation to motivate — not real server data
    let raw = 0;
    raw += Math.min(completed * 0.5, 30);          // up to 30 pts for volume
    raw += Math.min(avgScore, 100) * 0.4;           // up to 40 pts for quality
    raw += Math.max(0, 30 - hintsUsed * 0.3);       // up to 30 pts for independence
    // Clamp to 1-99
    const percentile = Math.max(1, Math.min(99, Math.round(100 - raw)));
    return percentile;
  }

  // ── Spaced Repetition ─────────────────────────────────────

  scheduleReview(catKey, levelId) {
    // Schedule review 1 day, 3 days, 7 days from now for struggled levels
    const now = new Date();
    const intervals = [1, 3, 7];
    for (const days of intervals) {
      const due = new Date(now);
      due.setDate(due.getDate() + days);
      const dueStr = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, '0')}-${String(due.getDate()).padStart(2, '0')}`;
      // Avoid duplicates
      if (!this.reviewQueue.some(r => r.levelId === levelId && r.dueDate === dueStr)) {
        this.reviewQueue.push({ catKey, levelId, dueDate: dueStr });
      }
    }
    // Keep queue manageable (max 100 entries)
    if (this.reviewQueue.length > 100) this.reviewQueue = this.reviewQueue.slice(-100);
    this.saveProgress();
  }

  getDueReviews() {
    const today = this.getTodayStr();
    return this.reviewQueue.filter(r => r.dueDate <= today);
  }

  showReview() {
    const due = this.getDueReviews();
    this.addBlank();
    if (!due.length) {
      this.addLine('No reviews due! Keep up the great work.', 'success');
      this.addBlank();
      return;
    }
    this.addLine('\u2550\u2550 Spaced Review \u2550\u2550', 'system');
    this.addBlank();
    this.addLine(`${due.length} level${due.length > 1 ? 's' : ''} due for review:`, 'system');
    this.addBlank();
    due.slice(0, 10).forEach((r, i) => {
      const cat = getCategoryByKey(r.catKey);
      if (!cat) return;
      const level = cat.levels.find(l => l.id === r.levelId);
      if (!level) return;
      const catIdx = cat.levels.indexOf(level) + 1;
      this.addLine(`  ${i + 1}. [${cat.name}] Level ${catIdx}: ${level.title}`, 'question');
    });
    this.addBlank();
    this.addLine('Switch to the category and jump to the level to review.', 'dim');
    this.addLine('Completing the level again removes it from the review queue.', 'dim');
    this.addBlank();
  }

  removeFromReviewQueue(levelId) {
    const today = this.getTodayStr();
    this.reviewQueue = this.reviewQueue.filter(r => !(r.levelId === levelId && r.dueDate <= today));
  }

  // ── Daily Challenge ───────────────────────────────────────

  getDailySeed() {
    const today = this.getTodayStr();
    // Simple hash from date string
    let hash = 0;
    for (let i = 0; i < today.length; i++) {
      hash = ((hash << 5) - hash) + today.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  showDailyChallenge() {
    const today = this.getTodayStr();
    this.addBlank();
    this.addLine('\u2550\u2550 Daily Challenge \u2550\u2550', 'system');
    this.addBlank();

    if (this.dailyChallengeCompleted[today]) {
      this.addLine('You already completed today\'s challenge!', 'success');
      this.addLine('Come back tomorrow for a new one.', 'dim');
      this.addBlank();
      return;
    }

    // Pick a deterministic level from all categories
    const allLevels = [];
    for (const cat of CATEGORIES) {
      cat.levels.forEach(l => allLevels.push({ level: l, catKey: cat.key, catName: cat.name }));
    }
    const seed = this.getDailySeed();
    const pick = allLevels[seed % allLevels.length];

    this.addLine(`  Category: ${pick.catName}`, 'system');
    this.addLine(`  Challenge: ${pick.level.title}`, 'question');
    this.addBlank();
    this.addLine(`> ${pick.level.question}`, 'question');
    this.addBlank();

    if (this.completedLevels.has(pick.level.id)) {
      this.addLine('You\'ve already beaten this level — try it again for speed!', 'dim');
    }
    this.addLine(`Switch to "${pick.catKey}" and find this level to complete the daily.`, 'dim');
    this.addBlank();

    // Store which level is today's challenge for completion tracking
    this._dailyChallengeId = pick.level.id;
  }

  checkDailyChallenge(levelId) {
    const today = this.getTodayStr();
    if (this.dailyChallengeCompleted[today]) return;
    // Check if this level matches today's daily
    const allLevels = [];
    for (const cat of CATEGORIES) {
      cat.levels.forEach(l => allLevels.push(l));
    }
    const seed = this.getDailySeed();
    const dailyLevel = allLevels[seed % allLevels.length];
    if (dailyLevel && dailyLevel.id === levelId) {
      this.dailyChallengeCompleted[today] = true;
      this.saveProgress();
      this.addLine('Daily challenge completed!', 'success');
      sound.playAchievement();
    }
  }

  // ── Code Playground (Free REPL) ───────────────────────────

  enterPlayground() {
    this.playgroundMode = true;
    // Pause timer
    if (this.timerRunning) {
      this.timerPausedByPlayground = true;
      this.timerRunning = false;
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.timerInterval = null;
      this.timerElapsedBeforePlayground = Date.now() - this.sessionStartTime;
      this.levelElapsedBeforePlayground = Date.now() - this.levelStartTime;
    }

    this.clearTerminal();
    this.addLine('\u2550\u2550 JS Playground \u2550\u2550', 'system');
    this.addBlank();
    this.addLine('Free-form JavaScript REPL. No levels, no scoring.', 'dim');
    this.addLine('Type any JS code and press Enter to execute.', 'dim');
    this.addLine('Type "exit" to return to the game.', 'dim');
    this.addBlank();
    this.addLine('> Ready. Try something!', 'success');
    this.addBlank();
  }

  async handlePlaygroundInput(input) {
    const lower = input.toLowerCase().trim();
    if (lower === 'exit' || lower === 'quit' || lower === 'q') {
      this.playgroundMode = false;
      // Resume timer
      if (this.timerPausedByPlayground) {
        this.timerPausedByPlayground = false;
        this.sessionStartTime = Date.now() - this.timerElapsedBeforePlayground;
        this.levelStartTime = Date.now() - this.levelElapsedBeforePlayground;
        this.timerRunning = true;
        this.timerInterval = setInterval(() => this.updateTimerDisplay(), 50);
      }
      this.clearTerminal();
      if (this.gameStarted && this.currentCategory) {
        this.loadLevel(this.currentLevelIndex);
      } else {
        this.showReadyScreen();
      }
      return;
    }
    if (lower === 'clear') {
      this.clearTerminal();
      this.addLine('\u2550\u2550 JS Playground \u2550\u2550  (type "exit" to leave)', 'system');
      this.addBlank();
      return;
    }

    this.isExecuting = true;
    this.runBtn.textContent = '...';
    this.runBtn.disabled = true;
    try {
      const result = await this.runInSandbox(input);
      if (result.consoleLogs?.length) {
        result.consoleLogs.forEach(log => this.addLine(log, 'output'));
      }
      if (result.errors?.length) {
        result.errors.forEach(err => this.addLine(`Error: ${err}`, 'error'));
      } else if (!result.consoleLogs?.length) {
        // Show return value for expressions
        const vars = result.variables || {};
        const keys = Object.keys(vars);
        if (keys.length) {
          this.addLine(`\u2192 ${JSON.stringify(vars[keys[keys.length - 1]])}`, 'output');
        }
      }
    } catch (err) {
      this.addLine(`Error: ${err.message}`, 'error');
    } finally {
      this.isExecuting = false;
      this.runBtn.textContent = 'RUN';
      this.runBtn.disabled = false;
      this.input.focus();
    }
    this.addBlank();
  }

  // ── Multi-step Projects ───────────────────────────────────

  getProjectsForCategory(catKey) {
    // Define mini-projects as chains of level ranges within a category
    const projects = {
      js: [
        { name: 'Hello World Builder', desc: 'Master variables, output, and string basics', levels: [1, 2, 3, 4, 5], icon: '\u2691' },
        { name: 'Logic Machine', desc: 'Build conditional logic and operators', levels: [6, 7, 8, 9, 10], icon: '\u2699' },
        { name: 'Function Workshop', desc: 'Create reusable code blocks', levels: [11, 12, 13, 14, 15], icon: '\u2692' },
        { name: 'Data Structures Lab', desc: 'Work with arrays and objects', levels: [16, 17, 18, 19, 20], icon: '\u2610' },
        { name: 'Advanced Patterns', desc: 'Tackle higher-order functions and closures', levels: [21, 22, 23, 24, 25], icon: '\u269B' },
        { name: 'Master Challenge', desc: 'Prove your JS mastery', levels: [26, 27, 28, 29, 30, 31, 32, 33, 34, 35], icon: '\u2605' },
      ],
      git: [
        { name: 'Repo Setup', desc: 'Init, add, commit basics', levels: [1, 2, 3, 4, 5], icon: '\u2691' },
        { name: 'Branch Master', desc: 'Branching, merging, stash', levels: [6, 7, 8, 9, 10], icon: '\u2699' },
        { name: 'Git Workflows', desc: 'Advanced git operations', levels: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20], icon: '\u2692' },
      ],
      cmd: [
        { name: 'File Explorer', desc: 'Navigate and manage files', levels: [1, 2, 3, 4, 5], icon: '\u2691' },
        { name: 'Pipe Builder', desc: 'Chain commands together', levels: [6, 7, 8, 9, 10], icon: '\u2699' },
        { name: 'Shell Mastery', desc: 'Environment and advanced commands', levels: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20], icon: '\u2692' },
      ],
    };
    return projects[catKey] || this.generateGenericProjects(catKey);
  }

  generateGenericProjects(catKey) {
    const cat = getCategoryByKey(catKey);
    if (!cat) return [];
    const total = cat.levels.length;
    const projects = [];
    for (let i = 0; i < total; i += 5) {
      const end = Math.min(i + 5, total);
      const nums = [];
      for (let j = i + 1; j <= end; j++) nums.push(j);
      projects.push({
        name: `${cat.name} Project ${projects.length + 1}`,
        desc: `Levels ${i + 1}-${end}`,
        levels: nums,
        icon: '\u2610'
      });
    }
    return projects;
  }

  showProjects() {
    if (!this.currentCategory) {
      this.addLine('Select a category first to see projects.', 'dim');
      return;
    }
    const projects = this.getProjectsForCategory(this.currentCategory);
    this.addBlank();
    this.addLine('\u2550\u2550 Mini-Projects \u2550\u2550', 'system');
    this.addBlank();

    projects.forEach((proj) => {
      const done = proj.levels.every(n => {
        const level = this.levels[n - 1];
        return level && this.completedLevels.has(level.id);
      });
      const progress = proj.levels.filter(n => {
        const level = this.levels[n - 1];
        return level && this.completedLevels.has(level.id);
      }).length;
      const mark = done ? '\u2713' : `${progress}/${proj.levels.length}`;
      const type = done ? 'success' : progress > 0 ? 'question' : 'dim';
      this.addLine(`  ${proj.icon} ${proj.name} [${mark}]`, type);
      this.addLine(`    ${proj.desc} (levels ${proj.levels[0]}-${proj.levels[proj.levels.length - 1]})`, 'dim');
    });
    this.addBlank();
    this.addLine('Jump to a project\'s first level with "level N".', 'dim');
    this.addBlank();
  }

  // ── Category Complete ──────────────────────────────────────

  showCategoryComplete() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerRunning = false;
    sound.playCategoryComplete();

    const totalTime = this.sessionStartTime ? Date.now() - this.sessionStartTime : 0;
    let totalScore = 0;
    for (const l of this.levels) {
      if (this.completedLevels.has(l.id)) totalScore += (this.score[l.id] ?? 100);
    }
    const pb = this.personalBests[this.currentCategory];
    const pbLine = pb ? `     Personal best: ${this.formatTime(pb).padEnd(28)}\u2551` : `${''.padEnd(51)}\u2551`;

    this.addBlank();
    const art = `
  \u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557
  \u2551                                                   \u2551
  \u2551     CATEGORY COMPLETE!                            \u2551
  \u2551     Total time: ${this.formatTime(totalTime).padEnd(33)}\u2551
  \u2551     Score: ${String(totalScore).padEnd(38)}\u2551
  \u2551${pbLine}
  \u2551                                                   \u2551
  \u2551     Type "categories" to try another track.       \u2551
  \u2551     Type "restart" to reset everything.           \u2551
  \u2551                                                   \u2551
  \u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D`;
    this.addHTML(`<pre class="completion-art">${art}</pre>`, 'success');

    // Show review suggestion for struggled levels
    const struggled = this.levels.filter(l =>
      (this.attempts[l.id] || 0) >= 2 || (this.hintsRevealed[l.id] || 0) > 0
    );
    if (struggled.length) {
      this.addLine(`${struggled.length} level${struggled.length > 1 ? 's' : ''} queued for spaced review. Type "review" later to revisit.`, 'hint');
    }
    this.addLine('Type "stats" for your full progress dashboard.', 'dim');
    this.addBlank();
  }
}

// ── Bootstrap ─────────────────────────────────────────────────

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new SudoQuest());
} else {
  new SudoQuest();
}
