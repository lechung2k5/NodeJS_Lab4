const { docClient } = require('../configs/awsConfig');
const { ScanCommand, PutCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");

const TABLE_NAME = "Categories";

class CategoryRepository {
    async getAll() {
        const params = {
            TableName: TABLE_NAME
        };
        const result = await docClient.send(new ScanCommand(params));
        return result.Items || [];
    }

    async create(categoryData) {
        const params = {
            TableName: TABLE_NAME,
            Item: categoryData
        };
        return await docClient.send(new PutCommand(params));
    }

    async delete(categoryId) {
        const params = {
            TableName: TABLE_NAME,
            Key: { categoryId: categoryId }
        };
        return await docClient.send(new DeleteCommand(params));
    }
}

module.exports = new CategoryRepository();