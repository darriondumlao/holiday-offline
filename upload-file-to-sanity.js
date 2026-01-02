// Quick script to upload a file to Sanity
// Usage: node upload-file-to-sanity.js path/to/your/file.mp3

const { createClient } = require('@sanity/client');
const fs = require('fs');

const client = createClient({
  projectId: 'uq9s8one',
  dataset: 'production',
  apiVersion: '2025-12-04',
  token: process.env.SANITY_API_TOKEN, // Uses token from .env.local
  useCdn: false,
});

async function uploadFile(filePath) {
  try {
    console.log(`Uploading ${filePath}...`);

    const fileBuffer = fs.readFileSync(filePath);
    const fileName = filePath.split('/').pop();

    const asset = await client.assets.upload('file', fileBuffer, {
      filename: fileName,
    });

    console.log('✅ Upload successful!');
    console.log('Asset ID:', asset._id);
    console.log('URL:', asset.url);
    console.log('\nYou can now reference this in your document with:');
    console.log(JSON.stringify({
      _type: 'file',
      asset: {
        _type: 'reference',
        _ref: asset._id
      }
    }, null, 2));

  } catch (error) {
    console.error('❌ Upload failed:', error.message);
  }
}

const filePath = process.argv[2];
if (!filePath) {
  console.error('Please provide a file path');
  console.log('Usage: node upload-file-to-sanity.js path/to/file.mp3');
  process.exit(1);
}

uploadFile(filePath);
