# 🎓 Attendance Risk Predictor (LPU Phagwara)

A lightweight, responsive web application designed for students of **Lovely Professional University (LPU), Phagwara** to track their class attendance, determine risk levels (Safe, Warning, Danger), calculate exactly how many classes they can safely bunk or must attend in a row to maintain the mandatory **75% LPU attendance requirement**, and forecast future attendance before End-Term Examinations (ETE).

Built as a first-year **B.Tech Computer Science & Engineering (CSE)** project using pure client-side web technologies (Vanilla HTML5, CSS3, and JavaScript) with browser `localStorage` persistence.

---

## 📸 Screenshots

*(Place your project screenshots here)*

| Dashboard & Subject Grid | Future Risk Predictor & Chart |
|:---:|:---:|
| `![Dashboard Screenshot](screenshots/dashboard.png)` | `![Predictor Screenshot](screenshots/predictor.png)` |

| Mobile View | Dark Mode Theme |
|:---:|:---:|
| `![Mobile Screenshot](screenshots/mobile.png)` | `![Dark Mode Screenshot](screenshots/dark_mode.png)` |

---

## 🚀 How to Run the Project

No Node.js, npm, bundlers, backend servers, or databases are required!

1. **Download or Clone the folder:**
   ```bash
   git clone <repository-url>
   cd "attendance risk prdictor"
   ```

2. **Open the App:**
   - Double-click `index.html` to open it in any modern web browser (Google Chrome, Microsoft Edge, Brave, Firefox, Safari).
   - Alternatively, right-click `index.html` and choose **"Open with..." > your preferred browser**.

3. **Sample Data:**
   - On the very first visit, 4 standard LPU first-year courses (`CSE101`, `CSE121`, `MTH166`, `INT108`) are automatically pre-filled so you can explore the features right away.
   - Click the **"Clear Sample Data"** button at the top whenever you are ready to enter your own UMS timetable courses.

---

## 🌟 Key Features

### 1. Subject Management
- **Add, Edit, and Delete Subjects:** Enter course code (e.g., `CSE121`), course title, total classes held, and attended classes.
- **Daily 1-Click Marking:** Quick `+ Present` and `+ Absent` buttons on every subject card to update records right after class.
- **Undo Button:** Accidental click? Hit `↩ Undo` to revert the last action immediately.
- **Duty / Medical Leave (DL/ML) Support:** Toggle to include approved university duty leaves (sports, tech fest, cultural) and verified medical leaves in your attended count.

### 2. Precise Attendance Mathematics
- **Current Percentage:** $\text{Attendance } \% = \frac{\text{Attended Classes}}{\text{Total Classes Held}} \times 100$
- **Customizable Target:** Defaults to LPU's standard **75%**, editable directly from the header if university regulations or course policies change.
- **Safe Skips Allowed:** 
  $$\text{Classes You Can Still Skip} = \left\lfloor \frac{\text{Attended}}{\text{Required \%}} - \text{Total} \right\rfloor$$
- **Must Attend in a Row:**
  $$\text{Classes You Must Attend in a Row} = \left\lceil \frac{\text{Required \%} \times \text{Total} - \text{Attended}}{1 - \text{Required \%}} \right\rceil$$
- **Edge-Case Resilience:** Gracefully handles zero classes conducted, negative numbers, empty fields, and attempts to enter attended classes greater than total held.

### 3. Clear Risk Zones & Badges
- 🟢 **Safe Zone (80% or above):** You have comfortable buffer room. Shows how many classes you can safely skip.
- 🟡 **Warning Zone (Required % to 80%):** Borderline attendance. Shows caution message and how many classes you can skip or attend to reach the 80% Safe Zone.
- 🔴 **Danger Zone (Below Required %):** Short attendance warning! Highlights debarment risk and counts how many lectures you must attend consecutively to qualify for your ETE hall ticket.

### 4. Interactive Future Attendance Predictor
- Select either **"All Subjects (Overall Average)"** or any individual course.
- Enter **"Classes remaining in the semester"** (approximate lectures left before end-term exams).
- Use the **interactive slider** to test "What if I bunk $X$ more classes?"
- Provides real-time predicted final attendance %, risk badge, and a friendly tip calculating the maximum bunks you can afford.

### 5. Extra Productivity Tools
- 📊 **Visual Comparison Chart:** Bar graph rendered via Chart.js CDN with an automated red dashed target line at 75%.
- 🌙 **Dark Mode / Light Mode:** Eye-friendly contrast for late-night hostel study sessions; preference is preserved across visits.
- 📄 **Export Summary (.txt):** Downloads a clean, formatted text report of your entire attendance status for your records.
- 🖨️ **Print-Friendly View:** Optimized CSS print stylesheet for printing or saving directly to PDF.
- 💾 **Local Storage:** All edits stay saved in your browser locally — zero data tracking or external servers.

---

## 📁 File Structure

```text
attendance-risk-predictor/
├── index.html        # Clean semantic HTML5 layout & modal dialogs
├── style.css         # Responsive CSS3 styles, variables, dark mode & print rules
├── script.js         # Vanilla JavaScript logic, math formulas & localStorage
└── README.md         # Documentation & guide
```

---

## 🛠️ Concepts Applied (First-Year CSE)

- **Semantic HTML5:** Headings, sections, forms, and dialog structure.
- **Modern CSS3:** CSS Flexbox, CSS Grid, custom color variables (`:root`), and media queries.
- **Vanilla JavaScript DOM:** Element creation, class toggles, dynamic event binding.
- **Data Modeling:** JavaScript objects and arrays of subject records.
- **Browser APIs:** `window.localStorage` for persistence, `window.print()` for printing, `Blob` / `URL.createObjectURL` for text downloads.
- **Discrete Math:** `Math.floor()` and `Math.ceil()` for bounds calculation and edge-case handling.
- **Chart.js CDN:** Lightweight client-side canvas data visualization.

---

## 👨‍💻 Author

**Made with ❤️ by [Your Name]**  
*B.Tech Computer Science & Engineering (First Year)*  
*Lovely Professional University, Phagwara, Punjab*  

> *Disclaimer: This is an independent student academic tool designed to help students plan leaves and avoid debarment. Always cross-verify final official percentages on the official LPU UMS portal.*
