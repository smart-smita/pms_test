const fs = require('fs');
const path = require('path');
const sidebarPath = path.join(__dirname, 'src/components/layout/Sidebar.tsx');

let content = fs.readFileSync(sidebarPath, 'utf8');

// Update SidebarProps
content = content.replace(
  'interface SidebarProps {',
  'interface SidebarProps {\n  isCollapsed?: boolean;'
);

content = content.replace(
  'export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, isOpen, onClose }) => {',
  'export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, isOpen, onClose, isCollapsed = false }) => {'
);

// We need to change the style of the aside to use isCollapsed
content = content.replace(
  'width: \'265px\',\n        minWidth: \'265px\',',
  'width: isCollapsed ? \'80px\' : \'265px\',\n        minWidth: isCollapsed ? \'80px\' : \'265px\','
);

// Hide HTCO ERP text if collapsed
content = content.replace(
  '<div>\n            <div\n              style={{\n                fontWeight: 800,\n                fontSize: \'1.15rem\',',
  '<div style={{ display: isCollapsed ? "none" : "block" }}>\n            <div\n              style={{\n                fontWeight: 800,\n                fontSize: \'1.15rem\','
);

// Change Dashboard button
content = content.replace(
  '<span>Dashboard</span>',
  '{!isCollapsed && <span>Dashboard</span>}'
);

// We will use a regex to fix all `<span>...</span>` inside buttons that are part of the main nav to `{!isCollapsed && <span>...</span>}`
// Actually, it's easier to use replace_file_content or multi_replace_file_content later if needed, or just do it in JS.

// Let's rewrite Sidebar.tsx completely to simplify it as per requirements.
// The new Sidebar will just have Dashboard, Customer, Quotation, Project, Masters, Reports.
// Tasks, Labours, Materials, etc. will go into the Project Workspace.

