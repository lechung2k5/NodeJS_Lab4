const { docClient } = require('../configs/awsConfig');
const { PutCommand } = require("@aws-sdk/lib-dynamodb");

const TABLE_NAME = "ProductLogs";

class LogRepository {
    async createLog(logData) {
        const params = {
            TableName: TABLE_NAME,
            Item: logData
        };
        return await docClient.send(new PutCommand(params));
    }
}

module.exports = new LogRepository();