# Spreadsheets Module

A comprehensive spreadsheet editor built with Handsontable for the AIT-CORE Suite Portal.

## Features

### Core Spreadsheet Features
- **Multiple Sheets**: Create and manage multiple sheets within a single spreadsheet document
- **Cell Formatting**:
  - Bold, italic, underline text styles
  - Text color customization
  - Background color options
  - Text alignment (left, center, right)
- **Formulas Support**: Built-in formula engine supporting SUM, AVERAGE, and other common functions
- **Copy/Paste**: Full clipboard support for copying and pasting cell data
- **Cell Merging**: Merge cells horizontally and vertically
- **Freeze Panes**: Freeze rows and columns for easier navigation
- **Auto-fill**: Drag to auto-fill cells with patterns
- **Sorting & Filtering**: Column sorting and data filtering capabilities

### Formatting Toolbar
- **Font Formatting**: Bold, italic, underline
- **Text Color**: Color picker with 10 preset colors
- **Background Color**: Background color picker with 10 preset colors
- **Alignment**: Left, center, right alignment options
- **Number Formats**:
  - Currency format
  - Percentage format
  - Date format
  - Number format with thousand separators

### Row/Column Operations
- Insert row above selected cell
- Insert column before selected cell
- Delete selected row
- Delete selected column
- Resize rows and columns manually
- Move rows and columns via drag-and-drop

### Sheet Management
- Create new sheets with the "+" button
- Switch between sheets using tabs at the bottom
- Rename sheets by clicking on the sheet name
- Delete sheets (minimum 1 sheet required)

### File Management
- **Sidebar**:
  - View recent spreadsheets (last 10)
  - Browse all spreadsheets
  - Quick file selection
  - Delete spreadsheets
- **Auto-save**: Changes are automatically saved
- **Export Options**:
  - Export to Microsoft Excel (.xlsx)
  - Export to CSV (.csv)
- **Share**: Share spreadsheets with collaborators
- **Collaboration Status**: See who's currently viewing/editing

### Dark Mode Support
- Custom dark theme for Handsontable
- Fully integrated with the suite's theme system
- Automatic theme switching based on system preferences

## Technology Stack

- **Frontend Framework**: Next.js 14 with React 18
- **Spreadsheet Engine**: Handsontable 14.3.0
- **State Management**: TanStack Query for server state
- **UI Components**: Radix UI primitives with custom styling
- **Styling**: Tailwind CSS with custom Handsontable theme
- **API Client**: Axios with interceptors for authentication

## File Structure

```
spreadsheets/
├── page.tsx                 # Main spreadsheet component
├── spreadsheet-theme.css    # Custom dark theme for Handsontable
└── README.md               # This file
```

## Usage

### Creating a New Spreadsheet

1. Click the "New Spreadsheet" button in the sidebar
2. The spreadsheet title defaults to "Untitled Spreadsheet"
3. Click on the title to edit it
4. Start entering data in cells

### Formatting Cells

1. Select one or more cells
2. Use the toolbar buttons to apply formatting:
   - Click Bold/Italic/Underline for text styles
   - Click the "A" button with color bar to change text color
   - Click the grid button with color bar to change background color
   - Click alignment buttons to change text alignment
   - Click number format buttons to apply number formatting

### Working with Formulas

1. Click on a cell
2. Type `=` to start a formula
3. Enter the formula (e.g., `=SUM(A1:A10)`)
4. Press Enter to execute

Common formulas:
- `=SUM(A1:A10)` - Sum of range
- `=AVERAGE(A1:A10)` - Average of range
- `=MAX(A1:A10)` - Maximum value
- `=MIN(A1:A10)` - Minimum value
- `=COUNT(A1:A10)` - Count of numbers

### Adding/Managing Sheets

1. Click the "+" button at the bottom to add a new sheet
2. Click on a sheet tab to switch to it
3. Click the "X" button on a sheet tab to delete it (minimum 1 sheet required)

### Exporting

1. Click the "Export" button in the top bar
2. Choose format:
   - Microsoft Excel (.xlsx) - Preserves formatting
   - CSV (.csv) - Plain data only

### Sharing

1. Click the "Share" button in the top bar
2. Enter collaborator email address
3. Choose permission level (Can edit / Can view)
4. Click "Send Invite"

## API Integration

The spreadsheets module integrates with the following API endpoints:

- `GET /spreadsheets` - List all spreadsheets
- `GET /spreadsheets/:id` - Get a specific spreadsheet
- `POST /spreadsheets` - Create a new spreadsheet
- `PUT /spreadsheets/:id` - Update a spreadsheet
- `DELETE /spreadsheets/:id` - Delete a spreadsheet
- `GET /spreadsheets/:id/export?format=xlsx|csv` - Export spreadsheet

## Keyboard Shortcuts

- **Ctrl/Cmd + Z**: Undo
- **Ctrl/Cmd + Y**: Redo
- **Ctrl/Cmd + C**: Copy
- **Ctrl/Cmd + V**: Paste
- **Ctrl/Cmd + X**: Cut
- **Ctrl/Cmd + B**: Bold
- **Ctrl/Cmd + I**: Italic
- **Ctrl/Cmd + U**: Underline
- **Arrow Keys**: Navigate cells
- **Tab**: Move to next cell
- **Shift + Tab**: Move to previous cell
- **Enter**: Confirm and move down
- **Escape**: Cancel editing
- **F2**: Edit cell

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Considerations

- Recommended maximum: 100,000 cells per sheet
- Large datasets may require pagination or virtual scrolling
- Formula recalculation is automatic but can impact performance with complex formulas
- Consider breaking very large spreadsheets into multiple sheets

## Custom Theme

The spreadsheet uses a custom dark theme that matches the suite's design system. The theme is defined in `spreadsheet-theme.css` and includes:

- Dark background colors
- Custom border colors
- Styled context menus
- Themed scrollbars
- Custom selection colors
- Accessible color contrast

## Future Enhancements

- [ ] Real-time collaboration with WebSocket
- [ ] Comments on cells
- [ ] Cell validation rules
- [ ] Conditional formatting
- [ ] Charts and graphs
- [ ] Pivot tables
- [ ] Import from Excel/CSV
- [ ] Version history
- [ ] Templates library
- [ ] Print layouts
- [ ] Protected sheets
- [ ] Macros/Scripts

## Troubleshooting

### Formulas not calculating
- Check formula syntax
- Ensure all referenced cells exist
- Check for circular references

### Export not working
- Check if the spreadsheet is saved
- Verify API endpoint is accessible
- Check browser download permissions

### Performance issues
- Reduce the number of cells with formulas
- Consider splitting into multiple sheets
- Clear unused cells
- Disable auto-recalculation for large datasets

## Support

For issues or questions, contact the AIT-CORE development team.
