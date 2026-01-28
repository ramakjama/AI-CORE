# Spreadsheets Module - Feature Checklist

Use this checklist to verify all features are working correctly after deployment.

## ✅ Core Spreadsheet Features

### Basic Grid Operations
- [ ] Grid displays with 100 rows and 26 columns (A-Z)
- [ ] Can click and select individual cells
- [ ] Can select multiple cells by dragging
- [ ] Can select entire columns by clicking column headers
- [ ] Can select entire rows by clicking row numbers
- [ ] Cell highlighting works on selection
- [ ] Can enter text in cells
- [ ] Can enter numbers in cells
- [ ] Enter key moves selection down
- [ ] Tab key moves selection right
- [ ] Arrow keys navigate between cells
- [ ] Escape key cancels cell editing

### Formulas
- [ ] Can enter formula starting with =
- [ ] =SUM(A1:A10) calculates correctly
- [ ] =AVERAGE(A1:A10) calculates correctly
- [ ] =MAX(A1:A10) finds maximum value
- [ ] =MIN(A1:A10) finds minimum value
- [ ] =COUNT(A1:A10) counts numbers
- [ ] Basic math operations work (=A1+B1, =A1*B1, etc.)
- [ ] Formula results update when source cells change
- [ ] Can reference cells from other sheets
- [ ] Formula errors display appropriately

### Copy/Paste
- [ ] Ctrl+C copies selected cells
- [ ] Ctrl+V pastes copied cells
- [ ] Ctrl+X cuts selected cells
- [ ] Can copy single cell
- [ ] Can copy range of cells
- [ ] Can paste into different location
- [ ] Formulas adjust references when pasted
- [ ] Can copy from Excel and paste
- [ ] Can copy to Excel

### Cell Formatting
- [ ] Bold button makes text bold
- [ ] Italic button makes text italic
- [ ] Underline button underlines text
- [ ] Text color picker opens
- [ ] Text color changes when color selected
- [ ] Background color picker opens
- [ ] Background color changes when color selected
- [ ] Left align button works
- [ ] Center align button works
- [ ] Right align button works
- [ ] Formatting persists after save

### Number Formats
- [ ] Currency format button applies $ and 2 decimals
- [ ] Percentage format button applies %
- [ ] Date format button formats dates correctly
- [ ] Number format button adds thousand separators
- [ ] Formats display correctly in cells
- [ ] Formats persist after save
- [ ] Can switch between formats

### Row/Column Operations
- [ ] Can resize columns by dragging header border
- [ ] Can resize rows by dragging header border
- [ ] Insert Row option in dropdown menu
- [ ] Insert Column option in dropdown menu
- [ ] Delete Row option in dropdown menu
- [ ] Delete Column option in dropdown menu
- [ ] Insert row actually inserts a row
- [ ] Insert column actually inserts a column
- [ ] Delete row removes the row
- [ ] Delete column removes the column
- [ ] Can drag columns to reorder
- [ ] Can drag rows to reorder

### Context Menu (Right-Click)
- [ ] Right-click opens context menu
- [ ] Context menu shows relevant options
- [ ] Insert row above option works
- [ ] Insert column left option works
- [ ] Remove row option works
- [ ] Remove column option works
- [ ] Copy/Cut/Paste options work
- [ ] Merge cells option appears
- [ ] Alignment options work
- [ ] Context menu closes properly

### Cell Merging
- [ ] Can select multiple cells
- [ ] Merge cells option available
- [ ] Cells merge correctly
- [ ] Merged cell displays content
- [ ] Can unmerge cells
- [ ] Merged cells persist after save

### Auto-fill
- [ ] Small square appears at selection corner
- [ ] Can drag the fill handle down
- [ ] Can drag the fill handle right
- [ ] Number sequences continue (1,2,3...)
- [ ] Formulas adjust when filled
- [ ] Same value repeats when no pattern

### Sorting & Filtering
- [ ] Column header dropdown arrow appears
- [ ] Sort ascending option works
- [ ] Sort descending option works
- [ ] Filter menu opens
- [ ] Can select which values to show
- [ ] Filter applies correctly
- [ ] Can clear filter
- [ ] Multiple columns can be filtered

### Undo/Redo
- [ ] Undo button is visible
- [ ] Redo button is visible
- [ ] Undo button reverses last action
- [ ] Redo button re-applies undone action
- [ ] Ctrl+Z triggers undo
- [ ] Ctrl+Y triggers redo
- [ ] Multiple undo levels work

## ✅ Sheet Management

### Multiple Sheets
- [ ] Sheet tabs visible at bottom
- [ ] Default "Sheet 1" tab exists
- [ ] Can click to switch between sheets
- [ ] Active sheet is highlighted
- [ ] Content switches when changing sheets
- [ ] Each sheet has independent data

### Adding Sheets
- [ ] Plus (+) button visible
- [ ] Click + button adds new sheet
- [ ] New sheet has default name (Sheet 2, Sheet 3...)
- [ ] Automatically switches to new sheet
- [ ] Can add multiple sheets

### Deleting Sheets
- [ ] Hover over sheet tab shows X button
- [ ] Click X button deletes sheet
- [ ] Confirmation or immediate deletion
- [ ] Cannot delete if only 1 sheet remains
- [ ] Switches to adjacent sheet after deletion

### Renaming Sheets
- [ ] Can click on sheet name (or double-click)
- [ ] Sheet name becomes editable
- [ ] Can type new name
- [ ] Enter key confirms new name
- [ ] Name change persists

## ✅ File Management

### Sidebar
- [ ] Sidebar visible on left
- [ ] "New Spreadsheet" button visible
- [ ] Recent tab shows last 10 files
- [ ] All Files tab shows all files
- [ ] Tabs switch correctly
- [ ] Spreadsheet icons display
- [ ] File names display
- [ ] Last modified dates display
- [ ] Loading state shows while fetching

### Creating New Spreadsheet
- [ ] Click "New Spreadsheet" button
- [ ] New empty spreadsheet loads
- [ ] Title is "Untitled Spreadsheet"
- [ ] One default sheet exists
- [ ] Empty grid displays

### Opening Existing Spreadsheet
- [ ] Click on file in sidebar
- [ ] File loads in editor
- [ ] Title updates
- [ ] Data displays correctly
- [ ] All sheets load
- [ ] Formatting preserved

### Deleting Spreadsheet
- [ ] Hover over file shows delete button
- [ ] Click delete button removes file
- [ ] File removed from sidebar
- [ ] If current file, clears editor
- [ ] Confirmation dialog (optional)

### Saving
- [ ] Save button visible in top bar
- [ ] Click Save button triggers save
- [ ] Loading state during save
- [ ] Success indication after save
- [ ] Changes persist after refresh
- [ ] Auto-save works on data change

## ✅ Top Bar Features

### Title Editing
- [ ] Spreadsheet title displays
- [ ] Click on title makes it editable
- [ ] Can type new title
- [ ] Enter key confirms new title
- [ ] Click away confirms new title
- [ ] Title change persists after save

### Share Button
- [ ] Share button visible
- [ ] Click opens share dialog
- [ ] Can enter email address
- [ ] Permission dropdown shows options
- [ ] Can edit permission selected by default
- [ ] Can view option available
- [ ] Send Invite button works
- [ ] Dialog closes after sending
- [ ] Cancel button closes dialog

### Export Button
- [ ] Export button visible
- [ ] Click opens export dialog
- [ ] Excel (.xlsx) option available
- [ ] CSV (.csv) option available
- [ ] Click Excel option starts download
- [ ] Click CSV option starts download
- [ ] Downloaded files are valid
- [ ] Can open exported files
- [ ] Formatting preserved in Excel
- [ ] Dialog closes after export

### Collaboration Status
- [ ] User count badge visible (if collaborators)
- [ ] Shows correct number of users
- [ ] Updates in real-time (if implemented)
- [ ] Shows "0 online" or hides when no collaborators

## ✅ Toolbar Features

### Toolbar Visibility
- [ ] Toolbar visible below top bar
- [ ] All buttons display correctly
- [ ] Icons are clear and recognizable
- [ ] Buttons are appropriately grouped
- [ ] Separators between groups visible

### Formatting Buttons
- [ ] Bold button (B) visible and clickable
- [ ] Italic button (I) visible and clickable
- [ ] Underline button (U) visible and clickable
- [ ] Text color button (A) visible
- [ ] Background color button (grid) visible
- [ ] All alignment buttons visible
- [ ] All number format buttons visible

### Dropdown Menus
- [ ] Color picker dropdowns open
- [ ] Color swatches display correctly
- [ ] Can select colors
- [ ] Dropdowns close after selection
- [ ] Insert/Delete dropdown works
- [ ] Insert/Delete options all work

## ✅ UI/UX Features

### Dark Mode
- [ ] Dark theme applies to entire page
- [ ] Handsontable has dark theme
- [ ] Context menu is dark themed
- [ ] Dropdowns are dark themed
- [ ] Borders are visible in dark mode
- [ ] Text is readable in dark mode
- [ ] Colors work well in dark mode
- [ ] Switches with system theme

### Responsive Design
- [ ] Page works on desktop (1920x1080)
- [ ] Page works on laptop (1366x768)
- [ ] Page works on tablet (iPad)
- [ ] Sidebar toggles on mobile (if implemented)
- [ ] Toolbar wraps on narrow screens
- [ ] Touch scrolling works on mobile

### Accessibility
- [ ] Can navigate with keyboard
- [ ] Tab order is logical
- [ ] Focus indicators visible
- [ ] Screen reader compatible (test with NVDA/JAWS)
- [ ] ARIA labels present
- [ ] Color contrast is sufficient
- [ ] All buttons have labels/titles

### Performance
- [ ] Page loads in < 3 seconds
- [ ] Spreadsheet renders quickly
- [ ] No lag when typing
- [ ] Scrolling is smooth
- [ ] No memory leaks (check DevTools)
- [ ] Formula calculation is fast
- [ ] Large datasets handle well (1000+ rows)

### Error Handling
- [ ] API errors show user-friendly messages
- [ ] Network errors handled gracefully
- [ ] Invalid formulas show error in cell
- [ ] Loading states display during operations
- [ ] No console errors in production

## ✅ Integration Features

### API Integration
- [ ] GET /spreadsheets endpoint works
- [ ] GET /spreadsheets/:id endpoint works
- [ ] POST /spreadsheets endpoint works
- [ ] PUT /spreadsheets/:id endpoint works
- [ ] DELETE /spreadsheets/:id endpoint works
- [ ] Export endpoint works for XLSX
- [ ] Export endpoint works for CSV
- [ ] Authentication tokens included
- [ ] Token refresh works on 401

### State Management
- [ ] TanStack Query caching works
- [ ] Data persists between page reloads
- [ ] Query invalidation works correctly
- [ ] Mutations update cache properly
- [ ] Loading states are correct
- [ ] Error states are handled

## ✅ Browser Compatibility

### Chrome
- [ ] All features work on Chrome
- [ ] No console errors
- [ ] Performance is good

### Firefox
- [ ] All features work on Firefox
- [ ] No console errors
- [ ] Performance is acceptable

### Safari
- [ ] All features work on Safari
- [ ] No console errors
- [ ] Performance is acceptable

### Edge
- [ ] All features work on Edge
- [ ] No console errors
- [ ] Performance is good

## 🐛 Known Issues

Document any issues found during testing:

1. **Issue**: [Description]
   - **Severity**: Critical / High / Medium / Low
   - **Steps to Reproduce**: [Steps]
   - **Expected**: [Expected behavior]
   - **Actual**: [Actual behavior]
   - **Workaround**: [If any]

## 📊 Test Results Summary

- **Total Tests**: [Count when complete]
- **Passed**: [ ]
- **Failed**: [ ]
- **Skipped**: [ ]
- **Pass Rate**: [ ]%

## 👥 Tested By

- **Name**: [Your name]
- **Date**: [Test date]
- **Environment**: [Browser, OS, etc.]
- **Version**: 1.0.0

## 📝 Notes

Add any additional notes or observations here:

---

## ✅ Sign-off

Once all critical tests pass:

- [ ] All critical features working
- [ ] No blocking bugs
- [ ] Performance acceptable
- [ ] Accessibility requirements met
- [ ] Ready for production deployment

**Approved by**: ________________
**Date**: ________________
