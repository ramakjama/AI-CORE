# Spreadsheets Module - Quick Start Guide

## 🚀 Getting Started

### 1. Start the Development Server
```bash
cd C:\Users\rsori\codex\ait-core-soriano\apps\suite-portal
pnpm dev
```

### 2. Access the Spreadsheets Module
Open your browser and navigate to:
```
http://localhost:3001/spreadsheets
```

## ✨ Quick Feature Tour

### Creating Your First Spreadsheet

1. **Click "New Spreadsheet"** in the sidebar
2. **Edit the title** by clicking on "Untitled Spreadsheet"
3. **Start typing** in any cell
4. **Press Tab** to move to the next cell
5. **Click "Save"** to persist your changes

### Basic Operations

#### Entering Data
- Click any cell and start typing
- Press **Enter** to confirm and move down
- Press **Tab** to confirm and move right
- Press **Escape** to cancel editing

#### Selecting Cells
- **Single cell**: Click on it
- **Range**: Click and drag
- **Column**: Click column header (A, B, C...)
- **Row**: Click row number (1, 2, 3...)
- **All cells**: Click the top-left corner

#### Using Formulas
```
=SUM(A1:A10)        Sum of range
=AVERAGE(A1:A10)    Average of range
=MAX(A1:A10)        Maximum value
=MIN(A1:A10)        Minimum value
=COUNT(A1:A10)      Count numbers
=A1+B1              Add two cells
=A1*B1              Multiply cells
```

### Formatting

#### Text Formatting
1. Select cells
2. Click toolbar buttons:
   - **B** for Bold
   - **I** for Italic
   - **U** for Underline

#### Colors
1. Select cells
2. Click the **A** button (text color) or **Grid** button (background)
3. Choose a color from the picker

#### Alignment
1. Select cells
2. Click alignment button:
   - Left align
   - Center align
   - Right align

#### Number Formats
1. Select cells with numbers
2. Click format button:
   - **$** for Currency ($1,234.56)
   - **%** for Percentage (12.34%)
   - **Calendar** for Date (2026-01-28)
   - **#** for Number with separators (1,234)

### Working with Rows and Columns

#### Insert
1. Right-click on row/column header
2. Select "Insert row above" or "Insert column left"

*Or use the toolbar:*
1. Select a cell
2. Click **Insert** dropdown
3. Choose "Insert Row" or "Insert Column"

#### Delete
1. Right-click on row/column header
2. Select "Remove row" or "Remove column"

*Or use the toolbar:*
1. Select a cell
2. Click **Insert** dropdown
3. Choose "Delete Row" or "Delete Column"

#### Resize
1. Hover over the border between headers
2. Drag to resize

### Working with Multiple Sheets

#### Add a Sheet
- Click the **+** button at the bottom

#### Switch Sheets
- Click on any sheet tab at the bottom

#### Rename a Sheet
- Double-click on the sheet name
- Type new name
- Press Enter

#### Delete a Sheet
1. Hover over the sheet tab
2. Click the **X** button that appears
3. (Note: You must have at least one sheet)

### Copy and Paste

#### Within the Spreadsheet
1. Select cells
2. **Ctrl+C** (Copy) or **Ctrl+X** (Cut)
3. Select destination
4. **Ctrl+V** (Paste)

#### From/To Excel
Works the same way! You can copy from Excel and paste into the spreadsheet and vice versa.

### Auto-fill

1. Enter a value or pattern in cells
2. Select the cells
3. Hover over the small square at the bottom-right corner
4. Drag down or right to auto-fill

Examples:
- **1, 2, 3** → continues the sequence
- **Monday, Tuesday** → continues days
- **Jan, Feb** → continues months
- **Same value** → repeats it

### Merging Cells

1. Select the cells you want to merge
2. Right-click
3. Select "Merge cells"

*To unmerge:*
1. Select the merged cell
2. Right-click
3. Select "Unmerge cells"

### Sorting Data

1. Click the dropdown arrow in the column header
2. Select "Sort ascending" or "Sort descending"

### Filtering Data

1. Click the dropdown arrow in the column header
2. Select "Filter by value"
3. Choose which values to show
4. Click "OK"

### Exporting

#### Export to Excel (.xlsx)
1. Click **Export** button in top bar
2. Select "Microsoft Excel (.xlsx)"
3. File downloads automatically

#### Export to CSV (.csv)
1. Click **Export** button in top bar
2. Select "CSV (.csv)"
3. File downloads automatically

### Sharing

1. Click **Share** button in top bar
2. Enter collaborator's email
3. Choose permission:
   - **Can edit**: Full editing rights
   - **Can view**: Read-only access
4. Click "Send Invite"

### Undo/Redo

- **Undo**: Click ↶ button or press **Ctrl+Z**
- **Redo**: Click ↷ button or press **Ctrl+Y**

## 💡 Pro Tips

### Keyboard Shortcuts
```
Ctrl+Z          Undo
Ctrl+Y          Redo
Ctrl+C          Copy
Ctrl+V          Paste
Ctrl+X          Cut
Ctrl+B          Bold
Ctrl+I          Italic
Ctrl+U          Underline
F2              Edit cell
Escape          Cancel editing
Enter           Confirm and move down
Tab             Confirm and move right
Arrow Keys      Navigate cells
```

### Formula Tips

1. **Start with =**: All formulas must begin with equals sign
2. **Cell references**: Use column letter + row number (A1, B2, etc.)
3. **Ranges**: Use colon (A1:A10 means cells A1 through A10)
4. **Absolute references**: Use $ to fix a reference ($A$1 won't change when copied)

Example:
```
=SUM($A$1:A10)    Column A is fixed, row 1 is fixed, row 10 adjusts
=SUM(A$1:A10)     Only row 1 is fixed
=SUM($A1:A10)     Only column A is fixed
```

### Context Menu

Right-click anywhere in the spreadsheet to access:
- Insert row/column
- Delete row/column
- Copy/Cut/Paste
- Merge/Unmerge cells
- Read only
- Alignment options
- And more!

### Performance Tips

1. **Large datasets**: Consider using multiple sheets
2. **Formulas**: Avoid too many volatile formulas (NOW(), RAND())
3. **Auto-save**: Changes save automatically, but manually save for large changes
4. **Browser**: Chrome/Edge recommended for best performance

### Dark Mode

The spreadsheet automatically adapts to your system's dark/light mode preference. The theme updates instantly when you change your system settings.

## 🔧 Troubleshooting

### Formula Shows as Text
- Make sure it starts with `=`
- Check for typos in function names

### Can't Edit Cell
- Check if the cell is part of a merged cell
- Make sure you're not in read-only mode

### Export Not Working
- Make sure the spreadsheet is saved first
- Check your browser's download settings
- Try a different browser

### Performance Issues
- Close unused spreadsheets
- Reduce the number of formulas
- Clear unused cells
- Split into multiple sheets

### Lost Changes
- Check browser console for errors
- Verify your internet connection
- Refresh and check "Recent" files

## 📚 Next Steps

1. **Read the full README**: `README.md` for detailed documentation
2. **Check Implementation Details**: `IMPLEMENTATION_SUMMARY.md` for technical info
3. **Explore Advanced Features**: Try conditional formatting, pivot tables (coming soon)
4. **Share with Team**: Invite collaborators to work together

## 🆘 Need Help?

- Check the **README.md** for detailed feature documentation
- Review **IMPLEMENTATION_SUMMARY.md** for technical details
- Contact the AIT-CORE development team

---

**Happy Spreadsheeting! 📊**
