/* ========================================================
   ATTENDANCE RISK PREDICTOR - JAVASCRIPT LOGIC
   Lovely Professional University (LPU)
   Student Project - Plain Vanilla JavaScript (ES5/ES6 basic)
   ======================================================== */

// --- Global App State Variables ---
// Array to store all subjects
var subjects = [];

// App settings
var settings = {
    requiredPercent: 75,      // LPU standard attendance threshold
    countDutyLeave: true,     // whether to count DL/ML in attended classes
    darkMode: false,          // dark mode status
    isSampleData: false       // tracks if currently showing sample data
};

// Variable to hold our Chart.js instance
var attendanceChartInstance = null;

// Four sample first-year subjects for initial showcase
var defaultSampleSubjects = [
    {
        id: "sample-1",
        code: "CSE101",
        name: "Computer Programming",
        totalClasses: 28,
        attendedClasses: 24,
        dutyLeaves: 1,
        history: []
    },
    {
        id: "sample-2",
        code: "CSE121",
        name: "Data Structures & Algorithms",
        totalClasses: 30,
        attendedClasses: 23,
        dutyLeaves: 0,
        history: []
    },
    {
        id: "sample-3",
        code: "MTH166",
        name: "Engineering Mathematics",
        totalClasses: 26,
        attendedClasses: 17,
        dutyLeaves: 1,
        history: []
    },
    {
        id: "sample-4",
        code: "INT108",
        name: "Python Programming",
        totalClasses: 24,
        attendedClasses: 21,
        dutyLeaves: 0,
        history: []
    }
];

// --- LocalStorage Functions ---

// Save current subjects and settings to browser localStorage
function saveToLocalStorage() {
    localStorage.setItem("lpu_attendance_subjects", JSON.stringify(subjects));
    localStorage.setItem("lpu_attendance_settings", JSON.stringify(settings));
}

// Load data from localStorage or load samples on first visit
function loadFromLocalStorage() {
    var savedSettings = localStorage.getItem("lpu_attendance_settings");
    if (savedSettings) {
        try {
            settings = JSON.parse(savedSettings);
        } catch (e) {
            console.error("Could not parse settings from localStorage", e);
        }
    }

    var savedSubjects = localStorage.getItem("lpu_attendance_subjects");
    if (savedSubjects) {
        try {
            subjects = JSON.parse(savedSubjects);
        } catch (e) {
            console.error("Could not parse subjects from localStorage", e);
            subjects = [];
        }
    } else {
        // First time user opens the app: pre-fill sample subjects
        subjects = JSON.parse(JSON.stringify(defaultSampleSubjects));
        settings.isSampleData = true;
        saveToLocalStorage();
    }
}

// --- Attendance Math & Calculation Functions ---

// Helper function to get effective attended classes (considering duty leaves)
function getEffectiveAttended(subject) {
    var attended = Number(subject.attendedClasses) || 0;
    var total = Number(subject.totalClasses) || 0;
    var dl = Number(subject.dutyLeaves) || 0;

    if (settings.countDutyLeave) {
        attended = attended + dl;
    }

    // Guard: attended can't exceed total unless total is 0
    if (total > 0 && attended > total) {
        return total;
    }

    return attended;
}

// Function to calculate attendance percentage
function calculatePercentage(attended, total) {
    if (total <= 0) {
        return 0;
    }
    var percent = (attended / total) * 100;
    // Round to 1 decimal place
    return Math.round(percent * 10) / 10;
}

// Function to determine risk status: Safe, Warning or Danger
function getRiskStatus(percentage, requiredPercent) {
    if (percentage >= 80) {
        return "Safe";
    } else if (percentage >= requiredPercent) {
        return "Warning";
    } else {
        return "Danger";
    }
}

// Function to calculate classes that can still be skipped
// Formula: floor(attended / required - total)
function calculateCanSkip(attended, total, requiredPercent) {
    if (total <= 0) return 0;
    var reqFraction = requiredPercent / 100;
    var canSkip = Math.floor((attended / reqFraction) - total);
    if (canSkip < 0) {
        return 0;
    }
    return canSkip;
}

// Function to calculate consecutive classes student must attend to reach target
// Formula: ceil((required * total - attended) / (1 - required))
function calculateMustAttend(attended, total, requiredPercent) {
    if (total <= 0) return 0;
    var reqFraction = requiredPercent / 100;
    
    // If already meeting or above target, no consecutive classes strictly needed
    if ((attended / total) >= reqFraction) {
        return 0;
    }

    // Avoid division by zero if target is 100%
    if (reqFraction >= 1) {
        return 999;
    }

    var needed = Math.ceil(((reqFraction * total) - attended) / (1 - reqFraction));
    if (needed < 0) {
        return 0;
    }
    return needed;
}

// Function to calculate consecutive classes to reach 80% (Safe zone) from Warning zone
function calculateAttendForSafe(attended, total) {
    var safeFraction = 0.80;
    if (total <= 0) return 0;
    if ((attended / total) >= safeFraction) return 0;
    var needed = Math.ceil(((safeFraction * total) - attended) / (1 - safeFraction));
    return needed > 0 ? needed : 0;
}

// Function to calculate overall attendance across all subjects
function calculateOverallStats() {
    var totalHeld = 0;
    var totalAttended = 0;
    var dangerCount = 0;
    var totalSafeSkips = 0;

    for (var i = 0; i < subjects.length; i++) {
        var sub = subjects[i];
        var effAttended = getEffectiveAttended(sub);
        var subTotal = Number(sub.totalClasses) || 0;

        totalHeld += subTotal;
        totalAttended += effAttended;

        var pct = calculatePercentage(effAttended, subTotal);
        var status = getRiskStatus(pct, settings.requiredPercent);

        if (subTotal > 0 && status === "Danger") {
            dangerCount++;
        }

        if (subTotal > 0) {
            totalSafeSkips += calculateCanSkip(effAttended, subTotal, settings.requiredPercent);
        }
    }

    var overallPercent = calculatePercentage(totalAttended, totalHeld);
    var overallStatus = getRiskStatus(overallPercent, settings.requiredPercent);

    return {
        totalHeld: totalHeld,
        totalAttended: totalAttended,
        overallPercent: overallPercent,
        overallStatus: overallStatus,
        dangerCount: dangerCount,
        totalSubjects: subjects.length,
        totalSafeSkips: totalSafeSkips
    };
}

// --- UI Rendering Functions ---

// Update the top dashboard stat cards
function updateDashboard() {
    var stats = calculateOverallStats();

    // 1. Overall attendance percent & fraction
    var percentEl = document.getElementById("overallPercent");
    var badgeEl = document.getElementById("overallBadge");
    var fractionEl = document.getElementById("overallFraction");
    var statusMsgEl = document.getElementById("overallStatusMsg");

    percentEl.textContent = stats.overallPercent + "%";
    fractionEl.textContent = stats.totalAttended + " of " + stats.totalHeld + " classes attended";

    // Set overall badge style
    badgeEl.className = "badge";
    if (stats.totalHeld === 0) {
        badgeEl.textContent = "No Data";
        badgeEl.classList.add("badge-neutral");
        statusMsgEl.textContent = "Add your subject records to see attendance health.";
        statusMsgEl.className = "stat-indicator text-muted";
    } else if (stats.overallStatus === "Safe") {
        badgeEl.textContent = "Safe Zone";
        badgeEl.classList.add("badge-safe");
        percentEl.className = "stat-main-number text-safe";
        statusMsgEl.textContent = "🎉 Overall attendance is in the safe zone (80%+).";
        statusMsgEl.className = "stat-indicator text-safe";
    } else if (stats.overallStatus === "Warning") {
        badgeEl.textContent = "Borderline";
        badgeEl.classList.add("badge-warning");
        percentEl.className = "stat-main-number text-warning";
        statusMsgEl.textContent = "⚠️ Borderline attendance! Do not bunk non-essential lectures.";
        statusMsgEl.className = "stat-indicator text-warning";
    } else {
        badgeEl.textContent = "Debarment Risk";
        badgeEl.classList.add("badge-danger");
        percentEl.className = "stat-main-number text-danger";
        statusMsgEl.textContent = "🚨 Warning: Below " + settings.requiredPercent + "% target! Hall ticket at risk.";
        statusMsgEl.className = "stat-indicator text-danger";
    }

    // 2. Subjects in danger count
    var dangerCountEl = document.getElementById("dangerCount");
    var dangerBadgeEl = document.getElementById("dangerBadge");
    dangerCountEl.textContent = stats.dangerCount;
    if (stats.dangerCount > 0) {
        dangerBadgeEl.textContent = "Action Needed";
        dangerBadgeEl.className = "badge badge-danger";
    } else {
        dangerBadgeEl.textContent = "All Clear";
        dangerBadgeEl.className = "badge badge-safe";
    }

    // 3. Total subjects count
    document.getElementById("totalSubjectsCount").textContent = stats.totalSubjects;

    // 4. Safe bunk allowance across all subjects
    document.getElementById("overallBunkAllowance").textContent = stats.totalSafeSkips;
    document.getElementById("bunkSummaryText").textContent = stats.totalSafeSkips === 1 
        ? "1 safe class skip available across subjects" 
        : stats.totalSafeSkips + " safe skips available across subjects";

    // Sample data banner visibility
    var banner = document.getElementById("sampleDataBanner");
    if (settings.isSampleData && subjects.length > 0) {
        banner.style.display = "flex";
    } else {
        banner.style.display = "none";
    }
}

// Loop through all subjects and render the subject cards grid
function renderSubjectCards() {
    var grid = document.getElementById("subjectsGrid");
    var emptyState = document.getElementById("emptyState");

    // Clear existing cards
    grid.innerHTML = "";

    // If no subjects, show empty state
    if (subjects.length === 0) {
        emptyState.style.display = "block";
        return;
    } else {
        emptyState.style.display = "none";
    }

    // Loop through each subject in the array
    for (var i = 0; i < subjects.length; i++) {
        var sub = subjects[i];
        var effAttended = getEffectiveAttended(sub);
        var total = Number(sub.totalClasses) || 0;
        var rawAttended = Number(sub.attendedClasses) || 0;
        var dl = Number(sub.dutyLeaves) || 0;

        var pct = calculatePercentage(effAttended, total);
        var status = getRiskStatus(pct, settings.requiredPercent);
        var canSkip = calculateCanSkip(effAttended, total, settings.requiredPercent);
        var mustAttend = calculateMustAttend(effAttended, total, settings.requiredPercent);
        var attendForSafe = calculateAttendForSafe(effAttended, total);

        // Create card element
        var card = document.createElement("div");
        card.className = "subject-card";

        // Apply risk color border
        if (total === 0) {
            card.classList.add("card-safe");
        } else if (status === "Safe") {
            card.classList.add("card-safe");
        } else if (status === "Warning") {
            card.classList.add("card-warning");
        } else {
            card.classList.add("card-danger");
        }

        // Determine badge markup
        var badgeHtml = "";
        var adviceHtml = "";
        var progressClass = "progress-safe";
        var percentColorClass = "text-safe";

        if (total === 0) {
            badgeHtml = '<span class="badge badge-neutral">No Classes</span>';
            adviceHtml = '<div class="advice-box">No classes conducted yet. Ready for the semester!</div>';
            progressClass = "progress-safe";
            percentColorClass = "";
        } else if (status === "Safe") {
            badgeHtml = '<span class="badge badge-safe">Safe</span>';
            progressClass = "progress-safe";
            percentColorClass = "text-safe";
            if (canSkip > 0) {
                adviceHtml = '<div class="advice-box advice-safe"><strong>Good going!</strong> You can safely bunk <strong>' + canSkip + '</strong> more ' + (canSkip === 1 ? 'class' : 'classes') + ' without dropping below ' + settings.requiredPercent + '%.</div>';
            } else {
                adviceHtml = '<div class="advice-box advice-safe"><strong>Safe!</strong> But do not bunk the next class or your attendance will drop.</div>';
            }
        } else if (status === "Warning") {
            badgeHtml = '<span class="badge badge-warning">Warning</span>';
            progressClass = "progress-warning";
            percentColorClass = "text-warning";
            if (canSkip > 0) {
                adviceHtml = '<div class="advice-box advice-warning"><strong>Borderline!</strong> You can bunk at most <strong>' + canSkip + '</strong> ' + (canSkip === 1 ? 'class' : 'classes') + '. Attend <strong>' + attendForSafe + '</strong> more in a row to reach 80% Safe Zone.</div>';
            } else {
                adviceHtml = '<div class="advice-box advice-warning"><strong>Right on the edge!</strong> You cannot bunk any classes. Attend the next <strong>' + attendForSafe + '</strong> classes to reach 80% Safe Zone.</div>';
            }
        } else {
            badgeHtml = '<span class="badge badge-danger">Danger</span>';
            progressClass = "progress-danger";
            percentColorClass = "text-danger";
            adviceHtml = '<div class="advice-box advice-danger"><strong>Debarment Risk!</strong> Attend the next <strong>' + mustAttend + '</strong> ' + (mustAttend === 1 ? 'class' : 'classes') + ' in a row or you\'re in trouble with UMS debarment!</div>';
        }

        // Duty leave label if enabled
        var dlLabel = "";
        if (settings.countDutyLeave && dl > 0) {
            dlLabel = '<span class="dl-indicator" title="' + rawAttended + ' regular + ' + dl + ' Duty/Medical Leave">(+' + dl + ' DL/ML)</span>';
        }

        // Fill inner HTML of card
        card.innerHTML = 
            '<div class="card-top">' +
                '<div class="course-code-wrap">' +
                    '<span class="course-code">' + escapeHtml(sub.code) + '</span>' +
                    badgeHtml +
                '</div>' +
                '<div class="card-more-btns">' +
                    '<button class="btn-icon-subtle edit-btn" data-id="' + sub.id + '" title="Edit subject details">✏️</button>' +
                    '<button class="btn-icon-subtle delete-btn" data-id="' + sub.id + '" title="Delete subject">🗑️</button>' +
                '</div>' +
            '</div>' +
            '<div class="course-name">' + escapeHtml(sub.name) + '</div>' +
            '<div class="card-stats-row">' +
                '<div class="card-percent ' + percentColorClass + '">' + pct + '%</div>' +
                '<div class="card-fractions">' +
                    '<span class="held-count">' + effAttended + '</span> / ' + total + ' Held ' + dlLabel +
                '</div>' +
            '</div>' +
            '<div class="progress-container">' +
                '<div class="progress-bar ' + progressClass + '" style="width: ' + Math.min(pct, 100) + '%;"></div>' +
            '</div>' +
            adviceHtml +
            '<div class="card-actions-row">' +
                '<div class="daily-btn-group">' +
                    '<button class="btn btn-present" data-id="' + sub.id + '" title="Mark +1 Present today">+ Present</button>' +
                    '<button class="btn btn-absent" data-id="' + sub.id + '" title="Mark +1 Absent today">+ Absent</button>' +
                '</div>' +
                '<button class="btn btn-undo" data-id="' + sub.id + '" title="Undo last attendance click">↩ Undo</button>' +
            '</div>';

        grid.appendChild(card);
    }

    // Attach event listeners to card buttons
    attachCardEventListeners();
}

// Attach event listeners for +Present, +Absent, Undo, Edit, Delete on subject cards
function attachCardEventListeners() {
    // 1. + Present buttons
    var presentButtons = document.querySelectorAll(".btn-present");
    for (var i = 0; i < presentButtons.length; i++) {
        presentButtons[i].addEventListener("click", function() {
            var subId = this.getAttribute("data-id");
            markAttendance(subId, "present");
        });
    }

    // 2. + Absent buttons
    var absentButtons = document.querySelectorAll(".btn-absent");
    for (var j = 0; j < absentButtons.length; j++) {
        absentButtons[j].addEventListener("click", function() {
            var subId = this.getAttribute("data-id");
            markAttendance(subId, "absent");
        });
    }

    // 3. Undo buttons
    var undoButtons = document.querySelectorAll(".btn-undo");
    for (var k = 0; k < undoButtons.length; k++) {
        undoButtons[k].addEventListener("click", function() {
            var subId = this.getAttribute("data-id");
            undoLastAction(subId);
        });
    }

    // 4. Edit buttons
    var editButtons = document.querySelectorAll(".edit-btn");
    for (var m = 0; m < editButtons.length; m++) {
        editButtons[m].addEventListener("click", function() {
            var subId = this.getAttribute("data-id");
            openEditModal(subId);
        });
    }

    // 5. Delete buttons
    var deleteButtons = document.querySelectorAll(".delete-btn");
    for (var n = 0; n < deleteButtons.length; n++) {
        deleteButtons[n].addEventListener("click", function() {
            var subId = this.getAttribute("data-id");
            deleteSubject(subId);
        });
    }
}

// Function to mark daily attendance (+Present or +Absent)
function markAttendance(subjectId, actionType) {
    for (var i = 0; i < subjects.length; i++) {
        if (subjects[i].id == subjectId) {
            var sub = subjects[i];
            
            // Initialize history array if missing
            if (!sub.history) {
                sub.history = [];
            }

            if (actionType === "present") {
                sub.totalClasses = (Number(sub.totalClasses) || 0) + 1;
                sub.attendedClasses = (Number(sub.attendedClasses) || 0) + 1;
                sub.history.push("present");
            } else if (actionType === "absent") {
                sub.totalClasses = (Number(sub.totalClasses) || 0) + 1;
                sub.history.push("absent");
            }

            saveToLocalStorage();
            refreshAllUI();
            break;
        }
    }
}

// Function to undo last daily attendance click
function undoLastAction(subjectId) {
    for (var i = 0; i < subjects.length; i++) {
        if (subjects[i].id == subjectId) {
            var sub = subjects[i];
            if (!sub.history || sub.history.length === 0) {
                alert("Nothing to undo for this subject!");
                return;
            }

            var lastAction = sub.history.pop();
            if (lastAction === "present") {
                if (sub.totalClasses > 0) sub.totalClasses--;
                if (sub.attendedClasses > 0) sub.attendedClasses--;
            } else if (lastAction === "absent") {
                if (sub.totalClasses > 0) sub.totalClasses--;
            }

            saveToLocalStorage();
            refreshAllUI();
            break;
        }
    }
}

// Function to delete a subject
function deleteSubject(subjectId) {
    var targetSubject = null;
    for (var i = 0; i < subjects.length; i++) {
        if (subjects[i].id == subjectId) {
            targetSubject = subjects[i];
            break;
        }
    }

    if (!targetSubject) return;

    var confirmDelete = confirm("Are you sure you want to delete " + targetSubject.code + " (" + targetSubject.name + ")?");
    if (confirmDelete) {
        var newSubjectsList = [];
        for (var j = 0; j < subjects.length; j++) {
            if (subjects[j].id != subjectId) {
                newSubjectsList.push(subjects[j]);
            }
        }
        subjects = newSubjectsList;
        saveToLocalStorage();
        populatePredictorSubjectDropdown();
        refreshAllUI();
    }
}

// --- Future Risk Predictor Logic ---

// Populate the subject select dropdown in future predictor
function populatePredictorSubjectDropdown() {
    var select = document.getElementById("predictSubjectSelect");
    var currentValue = select.value || "overall";

    select.innerHTML = '<option value="overall">All Subjects (Overall Average)</option>';

    for (var i = 0; i < subjects.length; i++) {
        var opt = document.createElement("option");
        opt.value = subjects[i].id;
        opt.textContent = subjects[i].code + " - " + subjects[i].name;
        select.appendChild(opt);
    }

    // Restore selected value if still valid
    select.value = currentValue;
    if (!select.value) {
        select.value = "overall";
    }
}

// Update the future predictor slider and calculate live result
function updateFuturePrediction() {
    var subjectSelect = document.getElementById("predictSubjectSelect");
    var remainingInput = document.getElementById("remainingClassesInput");
    var bunkSlider = document.getElementById("bunkSlider");
    var bunkDisplay = document.getElementById("bunkValueDisplay");
    var maxSliderLabel = document.getElementById("maxSliderLabel");

    var predPercentEl = document.getElementById("predFinalPercent");
    var predBadgeEl = document.getElementById("predRiskBadge");
    var predDetailEl = document.getElementById("predDetailText");
    var predTipEl = document.getElementById("predTipText");

    // Read inputs
    var remainingClasses = parseInt(remainingInput.value, 10);
    if (isNaN(remainingClasses) || remainingClasses < 0) {
        remainingClasses = 0;
        remainingInput.value = 0;
    }

    // Adjust slider bounds to match remaining classes
    bunkSlider.max = remainingClasses;
    maxSliderLabel.textContent = remainingClasses + " (Bunk All)";

    var bunkClasses = parseInt(bunkSlider.value, 10);
    if (isNaN(bunkClasses) || bunkClasses < 0) {
        bunkClasses = 0;
    }
    if (bunkClasses > remainingClasses) {
        bunkClasses = remainingClasses;
        bunkSlider.value = bunkClasses;
    }

    bunkDisplay.textContent = bunkClasses + " " + (bunkClasses === 1 ? "class" : "classes");

    // Determine current attendance numbers
    var currentHeld = 0;
    var currentAttended = 0;
    var subjectTitle = "overall attendance";

    var selectedId = subjectSelect.value;
    if (selectedId === "overall") {
        var stats = calculateOverallStats();
        currentHeld = stats.totalHeld;
        currentAttended = stats.totalAttended;
        subjectTitle = "overall attendance";
    } else {
        for (var i = 0; i < subjects.length; i++) {
            if (subjects[i].id == selectedId) {
                currentHeld = Number(subjects[i].totalClasses) || 0;
                currentAttended = getEffectiveAttended(subjects[i]);
                subjectTitle = subjects[i].code;
                break;
            }
        }
    }

    // Prediction formula:
    // Future attended classes = currentAttended + (remainingClasses - bunkClasses)
    // Future total classes = currentHeld + remainingClasses
    var classesAttendedFromRemaining = remainingClasses - bunkClasses;
    var finalTotal = currentHeld + remainingClasses;
    var finalAttended = currentAttended + classesAttendedFromRemaining;

    var finalPercent = calculatePercentage(finalAttended, finalTotal);
    var risk = getRiskStatus(finalPercent, settings.requiredPercent);

    // Render outcome
    predPercentEl.textContent = finalPercent + "%";

    // Set badge
    predBadgeEl.className = "badge";
    if (risk === "Safe") {
        predBadgeEl.textContent = "Safe Zone";
        predBadgeEl.classList.add("badge-safe");
        predPercentEl.style.color = "var(--safe-color)";
    } else if (risk === "Warning") {
        predBadgeEl.textContent = "Borderline";
        predBadgeEl.classList.add("badge-warning");
        predPercentEl.style.color = "var(--warning-color)";
    } else {
        predBadgeEl.textContent = "Debarment Danger";
        predBadgeEl.classList.add("badge-danger");
        predPercentEl.style.color = "var(--danger-color)";
    }

    // Friendly explanation message
    predDetailEl.textContent = "If you bunk " + bunkClasses + " out of " + remainingClasses + " remaining lectures in " + subjectTitle + ", you will finish at " + finalPercent + "%.";

    // Calculate maximum allowable bunks from the remaining classes while staying >= requiredPercent
    // Formula: (currentAttended + (remaining - maxBunk)) / (currentHeld + remaining) >= reqFraction
    // => remaining - maxBunk >= reqFraction * (currentHeld + remaining) - currentAttended
    // => maxBunk <= remaining + currentAttended - reqFraction * (currentHeld + remaining)
    var reqFraction = settings.requiredPercent / 100;
    var maxBunkAllowed = Math.floor(remainingClasses + currentAttended - (reqFraction * finalTotal));
    
    if (maxBunkAllowed < 0) {
        maxBunkAllowed = 0;
    }
    if (maxBunkAllowed > remainingClasses) {
        maxBunkAllowed = remainingClasses;
    }

    if (finalTotal === 0) {
        predTipEl.textContent = "💡 Add subjects to simulate your semester prediction.";
    } else if (maxBunkAllowed >= bunkClasses) {
        var extraBuffer = maxBunkAllowed - bunkClasses;
        predTipEl.innerHTML = "💡 Target is " + settings.requiredPercent + "%. You can bunk at most <strong>" + maxBunkAllowed + "</strong> out of " + remainingClasses + " remaining classes (Buffer: " + extraBuffer + " more).";
    } else {
        var deficit = bunkClasses - maxBunkAllowed;
        predTipEl.innerHTML = "⚠️ You are over-bunking! Cut down by at least <strong>" + deficit + "</strong> bunks to stay safe above " + settings.requiredPercent + "%.";
    }
}

// --- Attendance Comparison Chart (Chart.js) ---

// Custom Chart.js target line plugin to draw the required percentage line
var chartTargetLinePlugin = {
    id: "lpuTargetLine",
    afterDraw: function(chart) {
        var ctx = chart.ctx;
        var yScale = chart.scales.y;
        if (!yScale) return;

        var yPos = yScale.getPixelForValue(settings.requiredPercent);
        if (yPos === undefined || isNaN(yPos)) return;

        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = "#dc2626"; // red dashed line
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.moveTo(chart.chartArea.left, yPos);
        ctx.lineTo(chart.chartArea.right, yPos);
        ctx.stroke();

        // Draw small label
        ctx.fillStyle = "#dc2626";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "right";
        ctx.fillText("Target " + settings.requiredPercent + "%", chart.chartArea.right, yPos - 4);
        ctx.restore();
    }
};

// Render or update the Chart.js bar chart
function renderChart() {
    var canvas = document.getElementById("attendanceChart");
    var fallback = document.getElementById("chartFallback");

    // Check if Chart.js is loaded from CDN
    if (typeof Chart === "undefined") {
        if (canvas) canvas.style.display = "none";
        if (fallback) fallback.style.display = "block";
        return;
    } else {
        if (canvas) canvas.style.display = "block";
        if (fallback) fallback.style.display = "none";
    }

    var labels = [];
    var dataValues = [];
    var backgroundColors = [];
    var borderColors = [];

    // Loop through subjects to populate chart data
    for (var i = 0; i < subjects.length; i++) {
        var sub = subjects[i];
        var effAttended = getEffectiveAttended(sub);
        var total = Number(sub.totalClasses) || 0;
        var pct = calculatePercentage(effAttended, total);
        var status = getRiskStatus(pct, settings.requiredPercent);

        labels.push(sub.code);
        dataValues.push(pct);

        if (status === "Safe") {
            backgroundColors.push("#22c55e");
            borderColors.push("#16a34a");
        } else if (status === "Warning") {
            backgroundColors.push("#f59e0b");
            borderColors.push("#d97706");
        } else {
            backgroundColors.push("#ef4444");
            borderColors.push("#dc2626");
        }
    }

    // Update target indicator label in header
    var targetLabel = document.getElementById("chartTargetLabel");
    if (targetLabel) {
        targetLabel.textContent = "Target: " + settings.requiredPercent + "%";
    }

    // If chart already exists, update data
    if (attendanceChartInstance) {
        attendanceChartInstance.data.labels = labels;
        attendanceChartInstance.data.datasets[0].data = dataValues;
        attendanceChartInstance.data.datasets[0].backgroundColor = backgroundColors;
        attendanceChartInstance.data.datasets[0].borderColor = borderColors;
        attendanceChartInstance.update();
        return;
    }

    // Otherwise create new Chart
    var ctx = canvas.getContext("2d");
    attendanceChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Attendance %",
                data: dataValues,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1.5,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(val) {
                            return val + "%";
                        }
                    },
                    grid: {
                        color: "rgba(150, 150, 150, 0.15)"
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return "Attendance: " + context.raw + "%";
                        }
                    }
                }
            }
        },
        plugins: [chartTargetLinePlugin]
    });
}

// --- Add / Edit Subject Modal Logic ---

function openAddModal() {
    var modal = document.getElementById("subjectModal");
    var title = document.getElementById("modalTitle");
    var errorBox = document.getElementById("modalErrorMsg");

    title.textContent = "Add New Subject";
    document.getElementById("editSubjectId").value = "";
    document.getElementById("courseCodeInput").value = "";
    document.getElementById("subjectNameInput").value = "";
    document.getElementById("totalClassesInput").value = "";
    document.getElementById("attendedClassesInput").value = "";
    document.getElementById("dutyLeavesInput").value = "0";

    errorBox.style.display = "none";
    modal.style.display = "flex";
    document.getElementById("courseCodeInput").focus();
}

function openEditModal(subjectId) {
    var targetSubject = null;
    for (var i = 0; i < subjects.length; i++) {
        if (subjects[i].id == subjectId) {
            targetSubject = subjects[i];
            break;
        }
    }

    if (!targetSubject) return;

    var modal = document.getElementById("subjectModal");
    var title = document.getElementById("modalTitle");
    var errorBox = document.getElementById("modalErrorMsg");

    title.textContent = "Edit Subject (" + targetSubject.code + ")";
    document.getElementById("editSubjectId").value = targetSubject.id;
    document.getElementById("courseCodeInput").value = targetSubject.code;
    document.getElementById("subjectNameInput").value = targetSubject.name;
    document.getElementById("totalClassesInput").value = targetSubject.totalClasses;
    document.getElementById("attendedClassesInput").value = targetSubject.attendedClasses;
    document.getElementById("dutyLeavesInput").value = targetSubject.dutyLeaves || 0;

    errorBox.style.display = "none";
    modal.style.display = "flex";
}

function closeModal() {
    document.getElementById("subjectModal").style.display = "none";
}

// Handle Add/Edit Form submission with validation
function handleSubjectFormSubmit(e) {
    e.preventDefault();

    var editId = document.getElementById("editSubjectId").value;
    var code = document.getElementById("courseCodeInput").value.trim().toUpperCase();
    var name = document.getElementById("subjectNameInput").value.trim();
    var totalStr = document.getElementById("totalClassesInput").value;
    var attendedStr = document.getElementById("attendedClassesInput").value;
    var dlStr = document.getElementById("dutyLeavesInput").value;
    var errorBox = document.getElementById("modalErrorMsg");

    // Validation checks
    if (!code || !name || totalStr === "" || attendedStr === "") {
        showModalError("Please fill out all required fields marked with *.");
        return;
    }

    var total = parseInt(totalStr, 10);
    var attended = parseInt(attendedStr, 10);
    var dutyLeaves = parseInt(dlStr, 10) || 0;

    if (isNaN(total) || isNaN(attended) || total < 0 || attended < 0 || dutyLeaves < 0) {
        showModalError("Classes cannot be negative numbers.");
        return;
    }

    if (attended > total) {
        showModalError("Classes attended (" + attended + ") cannot exceed total classes held (" + total + ").");
        return;
    }

    // If editing existing subject
    if (editId) {
        for (var i = 0; i < subjects.length; i++) {
            if (subjects[i].id == editId) {
                subjects[i].code = code;
                subjects[i].name = name;
                subjects[i].totalClasses = total;
                subjects[i].attendedClasses = attended;
                subjects[i].dutyLeaves = dutyLeaves;
                break;
            }
        }
    } else {
        // Create new subject object
        var newSubject = {
            id: "sub-" + Date.now(),
            code: code,
            name: name,
            totalClasses: total,
            attendedClasses: attended,
            dutyLeaves: dutyLeaves,
            history: []
        };
        subjects.push(newSubject);
        settings.isSampleData = false;
    }

    saveToLocalStorage();
    closeModal();
    populatePredictorSubjectDropdown();
    refreshAllUI();
}

function showModalError(message) {
    var errorBox = document.getElementById("modalErrorMsg");
    errorBox.textContent = message;
    errorBox.style.display = "block";
}

// --- Text Summary Export & Print Functionality ---

// Export attendance report as a downloaded .txt file
function exportSummaryText() {
    var stats = calculateOverallStats();
    var today = new Date().toLocaleString();

    var text = "========================================================\n";
    text += "   LOVELY PROFESSIONAL UNIVERSITY, PHAGWARA\n";
    text += "   ATTENDANCE RISK PREDICTOR - STUDENT SUMMARY REPORT\n";
    text += "========================================================\n\n";
    text += "Generated On: " + today + "\n";
    text += "Minimum Target Required: " + settings.requiredPercent + "%\n";
    text += "Duty/Medical Leaves Counted: " + (settings.countDutyLeave ? "YES" : "NO") + "\n\n";
    text += "--------------------------------------------------------\n";
    text += "OVERALL ATTENDANCE SUMMARY\n";
    text += "--------------------------------------------------------\n";
    text += "Overall Attendance : " + stats.overallPercent + "%\n";
    text += "Classes Attended   : " + stats.totalAttended + " of " + stats.totalHeld + "\n";
    text += "Risk Status        : " + stats.overallStatus.toUpperCase() + "\n";
    text += "Subjects in Danger : " + stats.dangerCount + " of " + stats.totalSubjects + "\n";
    text += "Safe Bunk Buffer   : " + stats.totalSafeSkips + " classes across subjects\n\n";

    text += "--------------------------------------------------------\n";
    text += "SUBJECT-WISE BREAKDOWN\n";
    text += "--------------------------------------------------------\n";

    if (subjects.length === 0) {
        text += "No subjects recorded.\n";
    } else {
        for (var i = 0; i < subjects.length; i++) {
            var sub = subjects[i];
            var effAttended = getEffectiveAttended(sub);
            var total = Number(sub.totalClasses) || 0;
            var pct = calculatePercentage(effAttended, total);
            var status = getRiskStatus(pct, settings.requiredPercent);
            var canSkip = calculateCanSkip(effAttended, total, settings.requiredPercent);
            var mustAttend = calculateMustAttend(effAttended, total, settings.requiredPercent);

            text += (i + 1) + ". " + sub.code + ": " + sub.name + "\n";
            text += "   Attendance: " + effAttended + " / " + total + " (" + pct + "%) - Status: " + status + "\n";
            if (sub.dutyLeaves > 0 && settings.countDutyLeave) {
                text += "   Included Duty/Medical Leaves: " + sub.dutyLeaves + "\n";
            }
            if (status === "Safe") {
                text += "   Advice: Can safely bunk " + canSkip + " more classes.\n";
            } else if (status === "Warning") {
                text += "   Advice: Borderline. Can skip at most " + canSkip + " classes. Stay alert!\n";
            } else {
                text += "   Advice: DANGER! Must attend next " + mustAttend + " classes consecutively to reach " + settings.requiredPercent + "%.\n";
            }
            text += "\n";
        }
    }

    text += "========================================================\n";
    text += "Stay regular, clear your CA/ETE, and keep your hall ticket safe!\n";
    text += "Report created via Attendance Risk Predictor (LPU)\n";
    text += "========================================================\n";

    // Create a blob and trigger browser download
    var blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = "LPU_Attendance_Report_" + (new Date().toISOString().slice(0, 10)) + ".txt";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
}

// Trigger print view
function triggerPrintView() {
    var printTimeEl = document.getElementById("printTimestamp");
    if (printTimeEl) {
        printTimeEl.textContent = "Generated: " + new Date().toLocaleString() + " | Target Attendance: " + settings.requiredPercent + "%";
    }
    window.print();
}

// Reset all application data with confirmation
function resetAllData() {
    var confirmReset = confirm("⚠️ Are you sure you want to reset all data?\n\nThis will remove all your subjects and reset settings. This action cannot be undone.");
    if (confirmReset) {
        subjects = [];
        settings = {
            requiredPercent: 75,
            countDutyLeave: true,
            darkMode: false,
            isSampleData: false
        };
        saveToLocalStorage();
        document.getElementById("requiredPercentInput").value = 75;
        document.getElementById("dutyLeaveToggle").checked = true;
        applyTheme(false);
        populatePredictorSubjectDropdown();
        refreshAllUI();
    }
}

// Clear sample data and leave empty state
function clearSampleData() {
    subjects = [];
    settings.isSampleData = false;
    saveToLocalStorage();
    populatePredictorSubjectDropdown();
    refreshAllUI();
}

// Restore default sample data
function restoreSampleData() {
    subjects = JSON.parse(JSON.stringify(defaultSampleSubjects));
    settings.isSampleData = true;
    saveToLocalStorage();
    populatePredictorSubjectDropdown();
    refreshAllUI();
}

// --- Theme Management (Dark Mode) ---

function toggleTheme() {
    settings.darkMode = !settings.darkMode;
    applyTheme(settings.darkMode);
    saveToLocalStorage();
}

function applyTheme(isDark) {
    var icon = document.getElementById("themeIcon");
    var btnText = document.querySelector("#themeToggleBtn .btn-text");

    if (isDark) {
        document.body.classList.add("dark-mode");
        if (icon) icon.textContent = "☀️";
        if (btnText) btnText.textContent = "Light Mode";
    } else {
        document.body.classList.remove("dark-mode");
        if (icon) icon.textContent = "🌙";
        if (btnText) btnText.textContent = "Dark Mode";
    }
}

// Helper to escape HTML characters in strings for security
function escapeHtml(str) {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// --- Consolidated UI Refresh Function ---

function refreshAllUI() {
    updateDashboard();
    renderSubjectCards();
    renderChart();
    updateFuturePrediction();
}

// --- Event Listeners Initialization on Page Load ---

document.addEventListener("DOMContentLoaded", function() {
    // 1. Load data from localStorage
    loadFromLocalStorage();

    // 2. Initialize inputs based on settings
    var reqInput = document.getElementById("requiredPercentInput");
    reqInput.value = settings.requiredPercent;

    var dlToggle = document.getElementById("dutyLeaveToggle");
    dlToggle.checked = settings.countDutyLeave;

    // 3. Apply saved dark mode theme
    applyTheme(settings.darkMode);

    // 4. Populate predictor dropdown
    populatePredictorSubjectDropdown();

    // 5. Initial UI Render
    refreshAllUI();

    // --- Wire up Header & Settings Event Listeners ---
    
    // Required attendance target input change
    reqInput.addEventListener("input", function() {
        var val = parseInt(this.value, 10);
        if (!isNaN(val) && val >= 50 && val <= 99) {
            settings.requiredPercent = val;
            saveToLocalStorage();
            refreshAllUI();
        }
    });

    // Dark mode toggle button
    document.getElementById("themeToggleBtn").addEventListener("click", toggleTheme);

    // Duty leave toggle switch
    dlToggle.addEventListener("change", function() {
        settings.countDutyLeave = this.checked;
        saveToLocalStorage();
        refreshAllUI();
    });

    // Clear sample data button
    document.getElementById("clearSampleDataBtn").addEventListener("click", clearSampleData);

    // Modal Add Subject trigger buttons
    document.getElementById("openAddSubjectBtn").addEventListener("click", openAddModal);
    document.getElementById("emptyAddBtn").addEventListener("click", openAddModal);
    document.getElementById("restoreSampleBtn").addEventListener("click", restoreSampleData);

    // Modal Close buttons
    document.getElementById("closeModalBtn").addEventListener("click", closeModal);
    document.getElementById("cancelModalBtn").addEventListener("click", closeModal);

    // Close modal if user clicks outside of modal dialog
    window.addEventListener("click", function(event) {
        var modal = document.getElementById("subjectModal");
        if (event.target === modal) {
            closeModal();
        }
    });

    // Subject Add/Edit Form submit
    document.getElementById("subjectForm").addEventListener("submit", handleSubjectFormSubmit);

    // Predictor controls event listeners
    document.getElementById("predictSubjectSelect").addEventListener("change", updateFuturePrediction);
    document.getElementById("remainingClassesInput").addEventListener("input", updateFuturePrediction);
    document.getElementById("bunkSlider").addEventListener("input", updateFuturePrediction);

    // Utility buttons
    document.getElementById("exportTxtBtn").addEventListener("click", exportSummaryText);
    document.getElementById("printViewBtn").addEventListener("click", triggerPrintView);
    document.getElementById("resetAllDataBtn").addEventListener("click", resetAllData);
});
