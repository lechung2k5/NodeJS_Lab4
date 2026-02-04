const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { S3Client } = require("@aws-sdk/client-s3");
require('dotenv').config();

const awsConfig = {
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'fake',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'fake',
    }
};

if (process.env.IS_LOCAL === 'true') {
    awsConfig.endpoint = process.env.DYNAMODB_ENDPOINT_LOCAL;
}

const client = new DynamoDBClient(awsConfig);
const docClient = DynamoDBDocumentClient.from(client);

const s3Client = new S3Client({
    ...awsConfig,
    endpoint: process.env.IS_LOCAL === 'true' ? process.env.S3_ENDPOINT_LOCAL : undefined,
    forcePathStyle: true
});

module.exports = { client, docClient, s3Client };