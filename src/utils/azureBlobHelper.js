const { BlobServiceClient } = require('@azure/storage-blob');

const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING
);

const getBlobStream = async (containerName, filename) => {
  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(filename);

    // Check if the blob exists
    const exists = await blobClient.exists();
    console.log('o : ', exists);

    if (!exists) {
      return null;
    }

    // Get a readable stream
    const downloadResponse = await blobClient.download();
    return downloadResponse.readableStreamBody;
  } catch (error) {
    console.error(`Error retrieving blob: ${error.message}`);
    throw error;
  }
};

module.exports = {
  getBlobStream,
};
