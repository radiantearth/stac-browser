const fs = require('fs');
const path = require('path');

// Function to read JSON file
const readJsonFile = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading file from disk: ${err}`);
    return null;
  }
};

// Function to write JSON file
const writeJsonFile = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", 'utf8');
    console.log(`File has been written: ${filePath}`);
  } catch (err) {
    console.error(`Error writing file to disk: ${err}`);
  }
};

// Function to remove empty strings from an object deeply
const removeEmptyStrings = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(removeEmptyStrings).filter((item) => item !== '');
  } else if (obj !== null && typeof obj === 'object') {
    return Object.entries(obj)
      .filter(entry => entry[1] !== '')
      .reduce((acc, [k, v]) => {
        acc[k] = removeEmptyStrings(v);
        return acc;
      }, {});
  }
  return obj;
};

// Main function to process the locales directory
const processLocales = (localesDir) => {
  const folders = fs.readdirSync(localesDir);

  folders.forEach((folder) => {
    const folderPath = path.join(localesDir, folder);

    if (fs.statSync(folderPath).isDirectory()) {
      ['texts.json', 'fields.json'].forEach((fileName) => {
        const filePath = path.join(folderPath, fileName);
        if (fs.existsSync(filePath)) {
          const jsonData = readJsonFile(filePath);
          if (jsonData) {
            const cleanedData = removeEmptyStrings(jsonData);
            writeJsonFile(filePath, cleanedData);
          }
        }
      });
    }
  });
};

// Execute the main function
processLocales('src/locales');
