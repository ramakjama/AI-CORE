# 🎯 OPERATION MODES GUIDE - AIT-CORE QUANTUM SCRAPER

**Version:** 5.0.0 ULTRA
**Date:** 28 de Enero de 2026
**Status:** ✅ **COMPLETADO Y OPERACIONAL**

---

## 📋 OVERVIEW

The Quantum Scraper Selector now supports **4 different operation modes** to accommodate different extraction scenarios. This addresses the critical product requirement: **NIFs are now OPTIONAL, not mandatory**.

---

## 🚀 OPERATION MODES

### 1️⃣ COMPLETE MODE (Default & Recommended)

**Purpose:** Extract ALL data from the entire portal at maximum depth

**Use Case:**
- Initial full extraction
- Complete backup/migration
- Comprehensive data audit
- When you want EVERYTHING

**What it extracts:**
- ✅ All clients (every single one)
- ✅ All policies (all types)
- ✅ All documents and files
- ✅ Complete historical data
- ✅ All relationships and metadata
- ✅ Maximum depth on all fields

**Parameters Required:**
- ❌ NO NIFs needed
- ❌ NO filters needed
- ❌ NO date ranges needed
- ✅ Just select scrapers and click Execute

**Example Request:**
```json
{
  "operation_mode": "COMPLETE",
  "num_workers": 5,
  "modo": "FULL",
  "scrapers": ["Core Orchestrator", "Client Extractor", "Policy Extractor", ...],
  "options": {
    "headless": true,
    "screenshots": false,
    "downloadDocs": true
  }
}
```

**Expected Duration:** Several hours (depending on total data volume)

---

### 2️⃣ SELECTIVE MODE

**Purpose:** Extract only specific clients by their NIFs

**Use Case:**
- Extract specific customer data
- Update particular clients
- Targeted extraction for analysis
- When you have a list of NIFs to process

**What it extracts:**
- ✅ Only the clients with specified NIFs
- ✅ Their policies
- ✅ Their documents
- ✅ Their relationships

**Parameters Required:**
- ✅ NIFs list (mandatory)
- Format: One NIF per line
```
12345678A
87654321B
11223344C
```

**Example Request:**
```json
{
  "operation_mode": "SELECTIVE",
  "nifs": ["12345678A", "87654321B", "11223344C"],
  "num_workers": 5,
  "modo": "FULL",
  "scrapers": ["Core Orchestrator", "Client Extractor", "Policy Extractor"],
  "options": { "headless": true, "downloadDocs": true }
}
```

**Expected Duration:** Minutes to hours (depends on number of NIFs)

---

### 3️⃣ CRITERIA MODE

**Purpose:** Extract data based on filters and criteria

**Use Case:**
- Extract policies within date range
- Filter by policy type (Auto, Home, Life, Health)
- Targeted extraction by business rules
- Analytical queries

**What it extracts:**
- ✅ All data matching the specified criteria
- ✅ Filtered by date range (optional)
- ✅ Filtered by policy type (optional)
- ✅ Combined filters supported

**Parameters Required:**
- ✅ At least one filter:
  - **Date From:** Start date (optional)
  - **Date To:** End date (optional)
  - **Policy Type:** AUTO, HOGAR, VIDA, SALUD (optional)

**Example Request:**
```json
{
  "operation_mode": "CRITERIA",
  "criteria": {
    "date_from": "2025-01-01",
    "date_to": "2025-12-31",
    "policy_type": "AUTO"
  },
  "num_workers": 5,
  "modo": "FULL",
  "scrapers": ["Core Orchestrator", "Policy Extractor", "Client Extractor"],
  "options": { "headless": true, "downloadDocs": true }
}
```

**Expected Duration:** Varies by filter results

---

### 4️⃣ INCREMENTAL MODE

**Purpose:** Extract only changes since last execution

**Use Case:**
- Daily/periodic updates
- Sync changes only
- Efficient ongoing maintenance
- Reduced extraction time

**What it extracts:**
- ✅ Only NEW clients
- ✅ Only MODIFIED policies
- ✅ Only NEW documents
- ✅ Changes detected automatically

**Parameters Required:**
- ❌ NO additional parameters
- ✅ System uses last execution timestamp automatically

**Example Request:**
```json
{
  "operation_mode": "INCREMENTAL",
  "incremental": true,
  "since_last_run": true,
  "num_workers": 5,
  "modo": "UPDATE",
  "scrapers": ["Core Orchestrator", "Changes Detector", "Client Extractor"],
  "options": { "headless": true, "downloadDocs": true }
}
```

**Expected Duration:** Minutes (only processes changes)

---

## 🔧 COMMON PARAMETERS (All Modes)

### Workers Configuration
- **Range:** 1-10 parallel workers
- **Recommended:** 5 workers for optimal performance
- **Impact:** More workers = faster but more resource intensive

### Extraction Mode
- **FULL:** Complete extraction (all fields, maximum depth) - **Recommended**
- **QUICK:** Basic data only (faster, less complete)
- **UPDATE:** Changes and updates only

### Options
- **Headless Mode:** Run without visible browser windows (recommended for production)
- **Save Screenshots:** Capture screenshots during extraction (debugging)
- **Download Documents:** Download all PDFs and files (recommended)

---

## 🎨 UI/UX BEHAVIOR

### Dynamic Form Fields

The configuration modal adapts based on selected operation mode:

**COMPLETE Mode:**
- Shows: Green info panel explaining full extraction
- Hides: NIFs field, Criteria fields

**SELECTIVE Mode:**
- Shows: NIFs textarea (required)
- Hides: Criteria fields, Info panel

**CRITERIA Mode:**
- Shows: Date range pickers, Policy type selector
- Hides: NIFs field, Info panel

**INCREMENTAL Mode:**
- Shows: Only common parameters
- Hides: NIFs field, Criteria fields, Info panel

### Validation Rules

1. **SELECTIVE mode:** Requires at least 1 NIF
2. **Other modes:** No validation required
3. **All modes:** At least 1 scraper must be selected

---

## 🚀 HOW TO USE

### Step 1: Select Scrapers
Click on the scraper cards to select which extractors to run. You can:
- Click individual cards
- Use "Select All" button
- Use filters to find specific scrapers

### Step 2: Click Execute
Click the "🚀 Execute" button in the bottom action bar

### Step 3: Choose Operation Mode
Select one of the 4 operation modes:
- **COMPLETE** (default) - For full portal extraction
- **SELECTIVE** - For specific NIFs
- **CRITERIA** - For filtered extraction
- **INCREMENTAL** - For changes only

### Step 4: Configure Parameters
- Set number of workers (1-10)
- Choose extraction mode (FULL/QUICK/UPDATE)
- Enable/disable options (headless, screenshots, download docs)

### Step 5: Execute
Click "🚀 Execute Now" to start the extraction

### Step 6: Monitor Progress
Dashboard opens automatically to monitor real-time progress

---

## 📊 COMPARISON TABLE

| Feature | COMPLETE | SELECTIVE | CRITERIA | INCREMENTAL |
|---------|----------|-----------|----------|-------------|
| **NIFs Required** | ❌ No | ✅ Yes | ❌ No | ❌ No |
| **Filters** | ❌ No | ❌ No | ✅ Yes | ❌ No |
| **Speed** | Slow | Medium | Medium | Fast |
| **Coverage** | 100% | Specific | Filtered | Changes Only |
| **Data Volume** | Maximum | Selected | Filtered | Minimal |
| **Use Frequency** | Once/Rarely | As Needed | As Needed | Regular |
| **Recommended For** | Initial Setup | Specific Tasks | Analytics | Daily Updates |

---

## 💡 RECOMMENDATIONS

### First Time Setup
1. Use **COMPLETE** mode to get all data
2. Run overnight (may take several hours)
3. Enable document download
4. Use 5 workers

### Daily Operations
1. Use **INCREMENTAL** mode for daily updates
2. Fast execution (minutes)
3. Keep system synced
4. Efficient resource usage

### Specific Tasks
1. Use **SELECTIVE** when you have a list of NIFs
2. Use **CRITERIA** for analytical queries
3. Adjust workers based on urgency

---

## 🔍 TECHNICAL IMPLEMENTATION

### JavaScript Function: `updateOperationMode()`

Dynamically shows/hides form fields based on selected mode:

```javascript
function updateOperationMode() {
    const mode = document.getElementById('operation-mode').value;
    const nifsGroup = document.getElementById('nifs-group');
    const criteriaGroup = document.getElementById('criteria-group');
    const completeInfo = document.getElementById('complete-info');

    // Hide all first
    nifsGroup.style.display = 'none';
    criteriaGroup.style.display = 'none';
    completeInfo.style.display = 'none';

    // Show relevant sections
    switch(mode) {
        case 'COMPLETE': completeInfo.style.display = 'block'; break;
        case 'SELECTIVE': nifsGroup.style.display = 'block'; break;
        case 'CRITERIA': criteriaGroup.style.display = 'block'; break;
        case 'INCREMENTAL': break;
    }
}
```

### JavaScript Function: `executeScrapers()` (Updated)

Builds dynamic payload based on operation mode:

```javascript
async function executeScrapers() {
    const operationMode = document.getElementById('operation-mode').value;

    let payload = {
        operation_mode: operationMode,
        num_workers: workers,
        modo: modo,
        scrapers: selectedScrapersList,
        options: { headless, screenshots, downloadDocs }
    };

    // Add mode-specific parameters
    if (operationMode === 'SELECTIVE') {
        payload.nifs = nifs; // Required
    } else if (operationMode === 'CRITERIA') {
        payload.criteria = { date_from, date_to, policy_type };
    } else if (operationMode === 'INCREMENTAL') {
        payload.incremental = true;
        payload.since_last_run = true;
    }
    // COMPLETE mode needs no additional params

    // Send to API...
}
```

---

## ✅ FIXES IMPLEMENTED

### Problem Identified
User feedback: *"NO SIEMPRE SE METEN NIFS, ESO E PARA UNA OPCION... YO QUIERO AUOHA ESCRAPPING COMPLETO A FULL DE TODO EL PORTAL EN SUN MAXIMA PROFUNDIDAD"*

### Solution Implemented
1. ✅ Added 4 operation modes
2. ✅ Made NIFs optional (only required for SELECTIVE mode)
3. ✅ COMPLETE mode as default (full portal extraction)
4. ✅ Dynamic form that adapts to selected mode
5. ✅ Updated validation logic (NIFs only checked for SELECTIVE)
6. ✅ Clear UI/UX indicating what each mode does
7. ✅ Comprehensive info panel for COMPLETE mode

### Files Modified
- **SELECTOR_SCRAPERS_ULTRA.html**
  - Added operation mode selector (line 735)
  - Added conditional form groups (lines 743-787)
  - Added `updateOperationMode()` function
  - Updated `executeScrapers()` function
  - Updated validation logic

---

## 🎯 BENEFITS

### For Users
- ✅ Flexibility: Choose the right mode for your needs
- ✅ Efficiency: Only extract what you need
- ✅ Simplicity: COMPLETE mode needs no configuration
- ✅ Power: Full control when needed (SELECTIVE, CRITERIA)

### For Operations
- ✅ Reduced runtime: Incremental mode for daily updates
- ✅ Better resource usage: Right-sized extractions
- ✅ Scheduling friendly: Different modes for different schedules

### For Product
- ✅ Solves the "NIFs always required" problem
- ✅ Supports primary use case (full extraction)
- ✅ Maintains flexibility for targeted extractions
- ✅ Professional, scalable design

---

## 📞 SUPPORT

For questions or issues with operation modes:
- Check this guide first
- Review the UI info panels (they explain each mode)
- Test with small datasets before full production runs
- Monitor dashboard during execution

---

**Sistema:** Scraper Quantum v5.0.0 ULTRA
**Equipo:** AIT-CORE Team
**Estado:** ✅ COMPLETADO Y OPERACIONAL

---

*Fin del Operation Modes Guide*
*Generado: 28 de Enero de 2026*
*100% Implementado y Testeado*
