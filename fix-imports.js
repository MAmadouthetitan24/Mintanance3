const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// List of UI component names that should be lowercase
const uiComponents = [
  'button',
  'card',
  'avatar',
  'badge',
  'tabs',
  'separator',
  'dialog',
  'select',
  'textarea',
  'label',
  'input',
  'skeleton',
  'toast',
  'tooltip',
  'form',
  'sheet',
  'dropdown-menu',
  'calendar',
  'carousel',
  'command',
  'pagination',
  'sidebar',
  'job-card'
];

// Function to process a file
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Replace imports from @/components/ui with lowercase
  uiComponents.forEach(component => {
    const upperComponent = component.charAt(0).toUpperCase() + component.slice(1);
    const regex = new RegExp(`from ['"]@/components/ui/${upperComponent}['"]`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, `from '@/components/ui/${component}'`);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated imports in: ${filePath}`);
  }
}

// Find all TypeScript files
glob('src/**/*.{ts,tsx}').then(files => {
  files.forEach(processFile);
  console.log('Import paths updated successfully!');
}).catch(err => {
  console.error('Error finding files:', err);
}); 