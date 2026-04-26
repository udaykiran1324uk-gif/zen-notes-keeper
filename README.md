# zen-notes-keeper
A lightweight, persistent note-taking application with real-time search, auto-save capabilities, and secure user authentication. Built with HTML5, CSS3, and JavaScrip
📓 Zen Notes Keeper
A professional, high-performance note-taking application designed with a focus on clean typography and robust data management. This app moves beyond simple text, allowing for a structured "Zen" writing experience with integrated security and organization.

✨ Key Features
IndexedDB Power: Unlike standard apps, this uses IndexedDB (db.js) for a full database experience in your browser, allowing for complex data storage and faster performance.

Intelligent Trash System:

Notes aren't gone forever; they move to a Trash Tab.

Auto-Cleanup: Features logic to automatically purge notes from the trash after 30 days.

Restore: Instantly bring notes back to your active dashboard.

Multimedia Attachments: Support for attaching images, PDFs, and documents (up to 20MB) directly to your notes.

3D Security Standards: Registration requires a strict "3D Security" password (Uppercase, Lowercase, Number, and Special Character).

Dynamic Dashboard:

Real-time Search: Instant filtering of note titles and content.

Active Counter: Displays the number of active entries at a glance.

Auto-Save: Changes are persisted to the database immediately.

Refined UI: Built with Plus Jakarta Sans and Outfit typography for a modern, executive aesthetic.

🛠️ Tech Stack
Frontend: HTML5, CSS3 (Custom Emerald/Slate theme), Vanilla JavaScript (ES6+)

Database: IndexedDB API (via db.js)

UI Framework: Bootstrap 5.3

Icons: Bootstrap Icons

📂 Project Structure
Plaintext
├── index.html       # Main Dashboard with Active/Trash tabs
├── login.html       # Unified Login and Register portal
├── db.js            # Database operations (CRUD, Trash logic, Auth)
├── script.js        # UI Logic, Search, and Event handling
└── style.css        # Custom Emerald-themed design system
🚀 How to Launch
Clone the Repository:

Bash
git clone [https://github.com/your-username/zen-notes-keeper.git](https://github.com/udaykiran1324uk-gif/zen-notes-keeper.git)
Run the Application:
Open login.html in any modern web browser.

Setup Your Profile:

Toggle to "Register" on the login screen.

Create a username and a strong password.

Capture Your Thoughts:
Start creating notes, attaching files, and organizing your dashboard.

📱 Responsiveness
The interface is fully fluid, utilizing the "Plus Jakarta Sans" font for maximum readability on mobile, tablet, and desktop devices.
