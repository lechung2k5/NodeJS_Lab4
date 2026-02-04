
const { docClient } = require('../configs/awsConfig');
const { PutCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");

class UserRepository {
    async findByUsername(username) {
        const params = {
            TableName: "Users",
            FilterExpression: "username = :u",
            ExpressionAttributeValues: { ":u": username }
        };
        const result = await docClient.send(new ScanCommand(params));
        return result.Items[0];
    }

    async create(userData) {
        const params = {
            TableName: "Users",
            Item: userData
        };
        return await docClient.send(new PutCommand(params));
    }
}

module.exports = new UserRepository();