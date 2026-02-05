const { docClient } = require('../configs/awsConfig');
const { ScanCommand } = require("@aws-sdk/lib-dynamodb");

const TABLE_NAME = "ProductLogs";

class LogRepository {

    async getAllLogs() {
        const params = { TableName: TABLE_NAME };
        const result = await docClient.send(new ScanCommand(params));
        return (result.Items || []).sort((a, b) => new Date(b.time) - new Date(a.time));
    }
    async createLog(logData) {
        const { PutCommand } = require("@aws-sdk/lib-dynamodb");
        return await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: logData
        }));
    }
}

module.exports = new LogRepository();